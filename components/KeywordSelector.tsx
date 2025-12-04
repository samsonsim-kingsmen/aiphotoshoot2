import { useState } from "react";
import { keywordMap } from "../services/geminiService";
import Button from "./common/Button";
import { CameraIcon } from "./common/Icon";
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
      if (prev.includes(keyword)) return prev.filter((k) => k !== keyword);

      if (prev.length < 3) return [...prev, keyword];

      const trimmed = prev.slice(0, 2);
      return [...trimmed, keyword];
    });
  };

  const handleSubmit = () => {
    if (selectedKeywords.length === 3) onKeywordsSelect(selectedKeywords);
  };

  // Group keywords into rows
  let startIndex = 0;
  const groupedKeywords: string[][] = rowPattern.map((count) => {
    const row = keywords.slice(startIndex, startIndex + count);
    startIndex += count;
    return row;
  });

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={keywordBg}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Foreground */}
      <div className="relative z-10 w-full h-full text-white">
        <style>{`
          .keyword-title { font-size: clamp(1.6rem, 4vh, 3rem); }
          .keyword-sub { font-size: clamp(1rem, 2vh, 1.6rem); }
          .keyword-chip-container { width: min(60vh, 700px); }
          .keyword-grid { row-gap: 2vh; }

          .keyword-chip {
            font-size: clamp(0.9rem, 2vh, 1.3rem);
            padding-inline: 2.2vh;
            padding-block: 1vh;
            transition: all 0.25s ease;
            backdrop-filter: blur(8px);
          }

          .keyword-cta-wrapper { width: 40vh; }
          .keyword-cta {
            font-size: clamp(1rem, 2.4vh, 1.6rem);
            padding-block: 1.4vh;
          }
          .keyword-cta-icon { width: 3vh; height: 3vh; }
        `}</style>

        {/* TITLE */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ top: "5vh", width: "90%" }}
        >
          <h2
            className="keyword-title font-orbitron"
            style={{ fontSize: "4vh" }}
          >
            Who Were You Then, Who Will You Be?
          </h2>
          <p
            className="keyword-sub mt-1 text-gray-300"
            style={{ fontSize: "2vh" }}
          >
            Choose 3 words that describe your style.
          </p>
        </div>

        {/* KEYWORD GRID */}
        <div
          className="absolute top-1/2 left-1/2 w-full flex flex-col items-center justify-center"
          style={{ transform: "translate(-50%, -58%)" }}
        >
          <div className="keyword-chip-container keyword-grid flex flex-col items-center justify-center">
            {groupedKeywords.map((row, rowIndex) => {
              const offsetX = rowOffsets[rowIndex];

              return (
                <div
                  key={rowIndex}
                  className="flex justify-center gap-6"
                  style={{ transform: `translateX(${offsetX}px)` }}
                >
                  {row.map((keyword) => {
                    const isSelected = selectedKeywords.includes(keyword);

                    return (
                      <button
                        key={keyword}
                        onClick={() => handleKeywordClick(keyword)}
                        className={`
                          keyword-chip rounded-full border relative 
                          
                          ${
                            isSelected
                              ? "border-white bg-white/25 text-white shadow-[0_0_15px_4px_rgba(255,255,255,0.9),0_0_35px_12px_rgba(255,255,255,0.7)] scale-110"
                              : "border-white/40 bg-white/10 text-white/80 opacity-65 hover:opacity-80 hover:border-white/60 hover:bg-white/20 hover:scale-105"
                          }
                        `}
                        style={{
                          width: "13vh",
                          fontSize: "2vh",
                        }}
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

        {/* CTA BUTTON */}
        <div
          className="keyword-cta-wrapper absolute left-1/2 -translate-x-1/2"
          style={{ bottom: "10vh", width: "30vh" }}
        >
          <Button
            onClick={handleSubmit}
            disabled={selectedKeywords.length !== 3}
            style={{ fontSize: "2vh" }}
            className={`keyword-cta w-full ${
              selectedKeywords.length !== 3
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            aria-label="Proceed to camera"
          >
            <CameraIcon className="keyword-cta-icon mr-5" />
            Take a picture
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KeywordSelector;
