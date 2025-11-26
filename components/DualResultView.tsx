import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { ClockIcon, DownloadIcon } from "./common/Icon";
import Button from "./common/Button";

interface DualResultViewProps {
  image1: string;
  image2: string;
  retroTheme: string;
  futureTheme: string;
  onCapture: (compositeImage: string) => void;
  error: string | null;
}

// A robust component for rendering vertical text that works well with html2canvas
const VerticalText = ({
  text,
  reverse = false,
  className,
}: {
  text: string;
  reverse?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`flex items-center whitespace-nowrap gap-1 ${
        reverse ? "flex-col-reverse" : "flex-col"
      } ${className || ""}`}
    >
      {text
        .toUpperCase()
        .split("")
        .map((char, index) => (
          <span key={index} className="leading-none tracking-widest">
            {char}
          </span>
        ))}
    </div>
  );
};

const DualResultView = ({
  image1,
  image2,
  retroTheme,
  futureTheme,
  onCapture,
  error,
}: DualResultViewProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleCaptureClick = async () => {
    if (!captureRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#000000", // Pure black background
      });
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onCapture(imageDataUrl);
    } catch (err) {
      console.error("Failed to capture element:", err);
      setIsCapturing(false);
    } finally {
      setIsCapturing(false);
    }
  };

  // Still includes portal-animation if you like that look on screen,
  // but html2canvas will only really "see" the gradient glow from portal-glow-bg
  const capsuleBaseClasses =
    "w-full h-full rounded-full bg-cover bg-center transition-all duration-300 ease-in-out border-4 border-white/60 portal-animation overflow-hidden relative";

  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* Capture area – fills full screen */}
      <div
        ref={captureRef}
        className="w-full h-full flex items-center justify-center relative overflow-hidden"
      >
        {/* Title PNG */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-center transform -translate-y-[15%]">
          <img
            src="./Title.png"
            className="transform scale-[0.8]"
            alt="Title"
          />
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          {/* Left Group (Retro) */}
          <div
            className="absolute w-[41.4%] h-[50.6%] -translate-x-[35%] -translate-y-[15%] scale-85"
            aria-label="Retro-themed image on the left"
          >
            <div className="absolute top-1/2 -left-12 -translate-y-1/2">
              <VerticalText
                text={retroTheme}
                className="text-fuchsia-300 font-orbitron text-lg opacity-80"
              />
            </div>

            {/* Glow wrapper + capsule */}
            <div className="relative w-full h-full rounded-full">
              <div className="portal-glow-bg" />
              <div
                className={capsuleBaseClasses}
                style={{ backgroundImage: `url(${image1})` }}
              />
            </div>
          </div>

          {/* Right Group (Future) */}
          <div
            className="absolute w-[41.4%] h-[50.6%] translate-x-[35%] translate-y-[30%] scale-85"
            aria-label="Futuristic-themed image on the right"
          >
            {/* Glow wrapper + capsule */}
            <div className="relative w-full h-full rounded-full">
              <div className="portal-glow-bg" />
              <div
                className={capsuleBaseClasses}
                style={{ backgroundImage: `url(${image2})` }}
              />
            </div>

            <div className="absolute top-1/2 -right-12 -translate-y-1/2">
              <VerticalText
                text={futureTheme}
                className="text-fuchsia-300 font-orbitron text-lg opacity-80"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-1 right-4 z-30">
          <img
            src="./Logo.png"
            alt="Logo"
            className="scale-50 origin-bottom-right"
          />
        </div>
      </div>

      {/* Download button overlay – in front, ~5% from bottom */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[2.5%] z-40">
        {error && (
          <p className="text-red-300 text-center text-sm mb-2">{error}</p>
        )}

        <div className="transform scale-[0.8]">
          <Button onClick={handleCaptureClick} disabled={isCapturing}>
            {isCapturing ? (
              <>
                <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DualResultView;
