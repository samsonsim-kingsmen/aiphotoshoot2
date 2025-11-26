import { useState } from "react";
import { keywordMap } from "../services/geminiService";
import Button from "./common/Button";
import { CameraIcon } from "./common/Icon";

// ✅ Import your video correctly
import keywordBg from "/keywordbg.mp4";

interface KeywordSelectorProps {
  onKeywordsSelect: (keywords: string[]) => void;
}

const keywords = Object.keys(keywordMap);

// How many buttons per row
const rowPattern = [2, 3, 2, 2, 3, 2];

// Control X position of each row
const rowOffsets: number[] = [0, 0, 15, 25, 10, 0];

const KeywordSelector = ({ onKeywordsSelect }: KeywordSelectorProps) => {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((k) => k !== keyword);
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

  // Group keywords into rows following the pattern [2,3,2,2,3,2]
  let startIndex = 0;
  const groupedKeywords: string[][] = rowPattern.map((count) => {
    const row = keywords.slice(startIndex, startIndex + count);
    startIndex += count;
    return row;
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">

      {/* 🔹 Video background (using imported file) */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={keywordBg}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 🔹 Foreground content */}
      <div className="relative z-10 w-full h-full text-white">

        {/* 🔸 Title — 5% from top, wider */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ top: "5%", width: "90%" }}
        >
          <h2 className="text-2xl sm:text-3xl font-orbitron">
            Who Were You Then, Who Will You Be?
          </h2>
          <p className="mt-1 text-gray-200">
            Choose 3 words that describe your style.
          </p>
        </div>

        {/* 🔸 Center block of keyword rows */}
        <div
          className="absolute top-1/2 left-1/2 w-full flex flex-col items-center justify-center"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div
            className="flex flex-col items-center justify-center gap-3 sm:gap-4"
            style={{ width: "60%" }}
          >
            {groupedKeywords.map((row, rowIndex) => {
              const offsetX = rowOffsets[rowIndex] ?? 0;

              return (
                <div
                  key={rowIndex}
                  className="flex justify-center gap-2 sm:gap-3"
                  style={{
                    transform: `translateX(${offsetX}px)`,
                    transition: "transform 0.3s ease",
                  }}
                >
                  {row.map((keyword) => {
                    const isSelected = selectedKeywords.includes(keyword);
                    const isDisabled =
                      !isSelected && selectedKeywords.length >= 3;

                    return (
                      <button
                        key={keyword}
                        onClick={() => handleKeywordClick(keyword)}
                        disabled={isDisabled}
                        className={`
                          relative px-3 py-1.5 sm:px-4 sm:py-2 
                          text-sm sm:text-base font-medium rounded-full border 
                          transition-all duration-300 transform hover:scale-110
                          backdrop-blur-md
                          ${
                            isSelected
                              ? `border-white text-white bg-white/20 
                                shadow-[0_0_10px_3px_rgba(255,255,255,0.9),
                                        0_0_25px_10px_rgba(255,255,255,0.6),
                                        0_0_50px_20px_rgba(255,255,255,0.4)]`
                              : `border-white/60 text-white bg-white/5 hover:bg-white/10
                                shadow-[0_0_6px_2px_rgba(255,255,255,0.6),
                                        0_0_15px_6px_rgba(255,255,255,0.4),
                                        0_0_30px_10px_rgba(255,255,255,0.2)]`
                          }
                          ${
                            isDisabled
                              ? "opacity-40 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        `}
                      >
                        {keyword}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* 🔸 Enter button — 5% from bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-3/5"
          style={{ bottom: "5%" }}
        >
          <Button
            onClick={handleSubmit}
            disabled={selectedKeywords.length !== 3}
            className={`w-full ${
              selectedKeywords.length !== 3
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            aria-label="Proceed to camera"
          >
            <CameraIcon className="w-5 h-5 mr-2" />
            Take a picture
          </Button>
        </div>

      </div>
    </div>
  );
};

export default KeywordSelector;
