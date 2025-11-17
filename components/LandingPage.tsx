import Button from './common/Button';
import { SparklesIcon } from './common/Icon';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage = ({ onEnter }: LandingPageProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out;
        }
      `}</style>
      <div className="relative mb-8">
        <SparklesIcon className="w-24 h-24 text-fuchsia-400" />
        <SparklesIcon className="w-8 h-8 text-yellow-300 absolute -top-4 -right-4 animate-pulse" style={{ animationDelay: '0.3s' }} />
        <SparklesIcon className="w-6 h-6 text-cyan-300 absolute -bottom-2 -left-2 animate-pulse" style={{ animationDelay: '0.6s' }}/>
      </div>

      <h2 className="text-3xl md:text-4xl font-orbitron text-fuchsia-300 mb-4">
        The Kingsmen Continuum
      </h2>
      <p className="text-gray-300 max-w-md mb-10">
        Step through the portal.
      </p>
      <Button onClick={onEnter} className="portal-animation">
        Enter
      </Button>
    </div>
  );
};

export default LandingPage;