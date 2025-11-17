import Button from './common/Button';
import { SparklesIcon, RetakeIcon } from './common/Icon';

interface PhotoEditorProps {
  capturedImage: string;
  onRetake: () => void;
  onGenerate: () => void;
  error?: string | null;
}

const PhotoEditor = ({ capturedImage, onRetake, onGenerate, error }: PhotoEditorProps) => {
  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center">
      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col sm:flex-row justify-center items-center gap-4">
        {error && <p className="text-red-300 text-center text-sm mb-2 sm:mb-0 sm:absolute sm:bottom-20">{error}</p>}
        <Button onClick={onRetake} variant="secondary" aria-label="Retake photo">
            <RetakeIcon className="w-5 h-5 mr-2" />
            Retake
        </Button>
        <Button onClick={onGenerate} aria-label="Journey through time">
            <SparklesIcon className="w-5 h-5 mr-2" />
            Journey through time
        </Button>
      </div>
    </div>
  );
};

export default PhotoEditor;