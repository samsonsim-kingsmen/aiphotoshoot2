import { useState } from 'react';
import { keywordMap } from '../services/geminiService';
import Button from './common/Button';
import { CameraIcon } from './common/Icon';

interface KeywordSelectorProps {
    onKeywordsSelect: (keywords: string[]) => void;
}

const keywords = Object.keys(keywordMap);

const KeywordSelector = ({ onKeywordsSelect }: KeywordSelectorProps) => {
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

    const handleKeywordClick = (keyword: string) => {
        setSelectedKeywords(prev => {
            if (prev.includes(keyword)) {
                return prev.filter(k => k !== keyword);
            }
            if (prev.length < 3) {
                return [...prev, keyword];
            }
            return prev;
        });
    };

    const handleSubmit = () => {
        if (selectedKeywords.length === 3) {
            onKeywordsSelect(selectedKeywords);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6">
            <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-orbitron text-fuchsia-300">Who Were You Then, Who Will You Be?</h2>
                <p className="text-gray-300 mt-1">Choose 3 words that describe your style.</p>
            </div>
            <div className="flex-grow w-full flex flex-wrap justify-center items-center content-center gap-2 sm:gap-3 overflow-y-auto p-2">
                {keywords.map(keyword => {
                    const isSelected = selectedKeywords.includes(keyword);
                    const isDisabled = !isSelected && selectedKeywords.length >= 3;
                    return (
                        <button
                            key={keyword}
                            onClick={() => handleKeywordClick(keyword)}
                            disabled={isDisabled}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-full border transition-all duration-200 transform hover:scale-105 backdrop-blur-sm
                                ${isSelected
                                    ? 'bg-fuchsia-500/40 border-fuchsia-400 text-white shadow-lg'
                                    : 'bg-white/10 border-white/20 text-fuchsia-300 hover:border-fuchsia-400 hover:bg-white/20'
                                }
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            {keyword}
                        </button>
                    );
                })}
            </div>
            <div className="mt-4 w-full">
                <Button 
                    onClick={handleSubmit}
                    disabled={selectedKeywords.length !== 3}
                    className={`w-full ${selectedKeywords.length !== 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Proceed to camera"
                >
                    <CameraIcon className="w-5 h-5 mr-2" />
                    Take a picture
                </Button>
            </div>
        </div>
    );
};

export default KeywordSelector;