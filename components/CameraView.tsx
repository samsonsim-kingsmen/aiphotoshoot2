import { useRef, useEffect, useState } from 'react';
import Button from './common/Button';
import { CameraIcon, NoCameraIcon } from './common/Icon';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
}

const CameraView = ({ onCapture }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions and try again.");
      }
    };
    startCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const targetAspectRatio = 9 / 16;
      
      let sWidth, sHeight, sx, sy;
      
      const videoAspectRatio = videoWidth / videoHeight;

      if (videoAspectRatio > targetAspectRatio) {
        // Video is wider than target (e.g., landscape webcam), crop width
        sHeight = videoHeight;
        sWidth = sHeight * targetAspectRatio;
        sx = (videoWidth - sWidth) / 2;
        sy = 0;
      } else {
        // Video is taller than target, crop height
        sWidth = videoWidth;
        sHeight = sWidth / targetAspectRatio;
        sx = 0;
        sy = (videoHeight - sHeight) / 2;
      }
      
      canvas.width = sWidth;
      canvas.height = sHeight;

      // Flip the context horizontally to create an un-mirrored image
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      
      // Draw the cropped portion of the video onto the canvas
      context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      onCapture(imageDataUrl);
    }
  };

  const handleCaptureClick = () => {
    if (countdown !== null) return;

    let count = 5;
    setCountdown(count);

    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count > 0 ? count : null);
      if (count === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        capture();
      }
    }, 1000);
  };

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
        <NoCameraIcon className="w-16 h-16 mb-4 text-red-500" />
        <p className="text-center font-semibold text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black">
      <div className="w-full h-full overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover -scale-x-100" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-9xl font-orbitron text-white drop-shadow-lg" style={{textShadow: '0 0 15px rgba(255,255,255,0.7)'}}>{countdown}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
        <Button onClick={handleCaptureClick} disabled={countdown !== null} aria-label="Capture photo">
            <CameraIcon className="w-6 h-6 mr-2" />
            Capture
        </Button>
      </div>
    </div>
  );
};

export default CameraView;