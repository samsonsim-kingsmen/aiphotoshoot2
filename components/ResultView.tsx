import Button from './common/Button';
import { StartOverIcon, BackIcon } from './common/Icon';

interface ResultViewProps {
  generatedImage: string;
  downloadUrl: string;
  onStartOver: () => void;
  onGoBack: () => void;
}

const ResultView = ({ generatedImage, downloadUrl, onStartOver, onGoBack }: ResultViewProps) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(downloadUrl)}&qzone=1&bgcolor=ffffff`;

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Image container that grows */}
      <div className="flex-grow w-full relative flex items-center justify-center p-4 overflow-hidden">
        <img 
          src={generatedImage} 
          alt="Generated fashion photo" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-lg" 
        />
      </div>
      
      {/* Footer containing QR and Buttons */}
      <div className="flex-shrink-0 w-full z-10">
        {/* QR Code Section */}
        <div className="bg-black p-4 flex flex-col items-center justify-center gap-3">
            <p className="font-semibold text-white">Scan to Download</p>
            <div className="bg-white p-2 rounded-lg shadow-lg">
               <img src={qrCodeUrl} alt="QR code to download image" width="128" height="128" />
            </div>
        </div>
        
        {/* Button Section */}
        <div className="p-4 bg-black flex w-full justify-center items-center gap-2">
          <Button onClick={onGoBack} variant="secondary" aria-label="Go back">
              <BackIcon className="w-5 h-5 mr-2" />
              Back
          </Button>
          <Button onClick={onStartOver} variant="secondary" aria-label="Start over">
              <StartOverIcon className="w-5 h-5 mr-2" />
              Start Over
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultView;