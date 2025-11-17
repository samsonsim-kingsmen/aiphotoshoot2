import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { ClockIcon, DownloadIcon } from './common/Icon';
import Button from './common/Button';

interface DualResultViewProps {
  image1: string;
  image2: string;
  retroTheme: string;
  futureTheme: string;
  onCapture: (compositeImage: string) => void;
  error: string | null;
}

// A robust component for rendering vertical text that works well with html2canvas
const VerticalText = ({ text, reverse = false, className }: { text: string; reverse?: boolean; className?: string }) => {
    return (
        <div className={`flex items-center whitespace-nowrap gap-1 ${reverse ? 'flex-col-reverse' : 'flex-col'} ${className || ''}`}>
            {text.toUpperCase().split('').map((char, index) => (
                <span key={index} className="leading-none tracking-widest">
                    {char}
                </span>
            ))}
        </div>
    );
};

const DualResultView = ({ image1, image2, retroTheme, futureTheme, onCapture, error }: DualResultViewProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleCaptureClick = async () => {
    if (!captureRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
        const canvas = await html2canvas(captureRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#000000' // Pure black background
        });
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
    } catch (err) {
        console.error("Failed to capture element:", err);
        // Let the App component handle displaying a generic error message
        // by returning to this screen with an error prop. For now, just re-enable button.
        setIsCapturing(false);
    }
  };

  const capsuleBaseClasses = "w-full h-full rounded-full bg-cover bg-center transition-all duration-300 ease-in-out border-4 border-white/60 portal-animation overflow-hidden relative";

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden">
      <div ref={captureRef} className="w-full flex-grow relative flex items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 right-0 p-4 bg-black flex flex-col items-center justify-center z-20">
          <h2 className="text-2xl font-orbitron text-yellow-300 text-center">the kingsmen continuum</h2>
        </div>
        
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Left Group (Retro) */}
          <div 
              className={`absolute w-[41.4%] h-[50.6%] -translate-x-[35%] -translate-y-[25%]`}
              aria-label="Retro-themed image on the left"
          >
              <div className="absolute top-1/2 -left-12 -translate-y-1/2">
                  <VerticalText 
                    text={retroTheme} 
                    className="text-fuchsia-300 font-orbitron text-lg opacity-80"
                  />
              </div>
              <div
                  className={`${capsuleBaseClasses}`}
                  style={{ backgroundImage: `url(${image1})` }}
              >
              </div>
          </div>

          {/* Right Group (Future) */}
          <div 
              className={`absolute w-[41.4%] h-[50.6%] translate-x-[35%] translate-y-[25%]`}
              aria-label="Futuristic-themed image on the right"
          >
              <div
                  className={`${capsuleBaseClasses}`}
                  style={{ backgroundImage: `url(${image2})` }}
              >
              </div>
              <div className="absolute top-1/2 -right-12 -translate-y-1/2">
                  <VerticalText 
                    text={futureTheme}
                    className="text-fuchsia-300 font-orbitron text-lg opacity-80"
                  />
              </div>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 z-30">
            <p className="font-orbitron text-white/70 text-base">kingsmen</p>
        </div>
      </div>
      
      <div className="flex-shrink-0 w-full p-4 bg-black flex flex-col justify-center items-center gap-2 z-10">
        {error && <p className="text-red-300 text-center text-sm mb-2">{error}</p>}
        <Button onClick={handleCaptureClick} disabled={isCapturing}>
          {isCapturing ? (
            <>
              <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <DownloadIcon className="w-5 h-5 mr-2" />
              download
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DualResultView;