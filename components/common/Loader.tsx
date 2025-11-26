import { useState, useEffect } from 'react';
import { ClockIcon } from './Icon';

interface LoaderProps {
  messages: string[];
}

const Loader = ({ messages }: LoaderProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, [messages.length]);
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <ClockIcon className="w-16 h-16 text-white animate-spin mb-4" />
      <p className="text-xl font-semibold text-white font-orbitron text-center px-4">
        {messages[currentMessageIndex]}
      </p>
    </div>
  );
};

export default Loader;
