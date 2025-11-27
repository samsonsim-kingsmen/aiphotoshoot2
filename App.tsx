import { useState, useCallback } from 'react';
import { AppState } from './types';
import { generateFashionImage, keywordMap, retroThemes, futureThemes } from './services/geminiService';
import { uploadImage } from './services/firebaseService';
import { dataUrlToBase64 } from './utils/imageUtils';
import CameraView from './components/CameraView';
import PhotoEditor from './components/PhotoEditor';
import ResultView from './components/ResultView';
import Loader from './components/common/Loader';
import KeywordSelector from './components/KeywordSelector';
import DualResultView from './components/DualResultView';
import LandingPage from './components/LandingPage';

// 🔹 Loading messages for AI transformation
const loadingMessagesAI = [
  "Analyzing your vibe...",
  "Warming up the AI stylist...",
  "Generating retro reality...",
  "Crafting a futuristic vision...",
  "Saving your masterpiece...",
  "Almost ready for your debut..."
];

// 🔹 Loading messages for QR / final save
const loadingMessagesQR = [
  "Saving your final image...",
  "Uploading your masterpiece...",
  "Generating your download link...",
  "Preparing your QR code...",
  "Almost done..."
];

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [winningThemes, setWinningThemes] = useState<{ retro: string; future: string } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<[string, string] | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Track what kind of loading is happening: AI generation or QR/save
  const [loadingType, setLoadingType] = useState<"AI" | "QR">("AI");

  const calculateWinningThemes = (selectedKeywords: string[]) => {
    const scores = {
      retro: {} as Record<string, number>,
      future: {} as Record<string, number>,
    };

    // Initialize scores
    retroThemes.forEach(theme => scores.retro[theme] = 0);
    futureThemes.forEach(theme => scores.future[theme] = 0);

    // Calculate scores based on selected keywords
    for (const keyword of selectedKeywords) {
      const weights = keywordMap[keyword as keyof typeof keywordMap];
      if (weights) {
        // Score retro themes
        for (const theme in weights['1970s']) {
          if (scores.retro[theme] !== undefined) {
            scores.retro[theme] += weights['1970s'][theme as keyof typeof weights['1970s']];
          }
        }
        // Score future themes
        for (const theme in weights['2070s']) {
          if (scores.future[theme] !== undefined) {
            scores.future[theme] += weights['2070s'][theme as keyof typeof weights['2070s']];
          }
        }
      }
    }

    // Find the theme with the highest score in each category
    const findTopTheme = (themeScores: Record<string, number>) => {
      return Object.entries(themeScores).reduce(
        (top, current) => current[1] > top[1] ? current : top,
        ['', -1]
      )[0];
    };
    
    const winningRetro = findTopTheme(scores.retro);
    const winningFuture = findTopTheme(scores.future);

    // Fallback to first theme if no keywords match
    return {
      retro: winningRetro || retroThemes[0],
      future: winningFuture || futureThemes[0],
    };
  };

  const handleEnter = () => setAppState(AppState.KEYWORD_SELECTION);

  const handleKeywordsSelect = (keywords: string[]) => {
    const themes = calculateWinningThemes(keywords);
    setWinningThemes(themes);
    setAppState(AppState.CAMERA);
  };

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    setAppState(AppState.EDIT);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAppState(AppState.CAMERA);
  };

  const handleCompositeUpload = async (compositeImage: string) => {
    // 🔹 This is the QR / final save phase
    setLoadingType("QR");
    setAppState(AppState.LOADING);
    setError(null);

    try {
      const downloadUrl = await uploadImage(compositeImage);
      setFinalImage(compositeImage);
      setFinalImageUrl(downloadUrl);
      setAppState(AppState.RESULT);
    } catch (err) {
      console.error('Composite image upload failed:', err);
      setError('Failed to save your composite image. Please try again.');
      setAppState(AppState.DUAL_RESULT); // Go back to dual result view on error
    }
  };
  
  const handleBackToLanding = () => {
    setWinningThemes(null);
    setCapturedImage(null);
    setGeneratedImages(null);
    setFinalImage(null);
    setFinalImageUrl(null);
    setError(null);
    setAppState(AppState.LANDING);
  };

  const handleBackToSelection = () => {
    setFinalImage(null);
    setFinalImageUrl(null);
    setAppState(AppState.DUAL_RESULT);
  };

  const handleGenerate = useCallback(async () => {
    if (!capturedImage || !winningThemes) return;

    // 🔹 This is the AI transformation phase
    setLoadingType("AI");
    setAppState(AppState.LOADING);
    setError(null);

    try {
      const base64Image = dataUrlToBase64(capturedImage);
      const [retroResult, futureResult] = await Promise.all([
        generateFashionImage(base64Image, winningThemes.retro),
        generateFashionImage(base64Image, winningThemes.future)
      ]);
      
      setGeneratedImages([
        `data:image/jpeg;base64,${retroResult}`,
        `data:image/jpeg;base64,${futureResult}`
      ]);
      setAppState(AppState.DUAL_RESULT);
    } catch (err) {
      console.error(err);
      setError('Failed to create your fashion shots. Please try again.');
      setAppState(AppState.EDIT); // Go back to editor on error
    }
  }, [capturedImage, winningThemes]);

  const renderContent = () => {
    switch (appState) {
      case AppState.LANDING:
        return <LandingPage onEnter={handleEnter} />;

      case AppState.KEYWORD_SELECTION:
        return <KeywordSelector onKeywordsSelect={handleKeywordsSelect} />;

      case AppState.CAMERA:
        return <CameraView onCapture={handleCapture} />;

      case AppState.EDIT:
        return (
          <PhotoEditor
            capturedImage={capturedImage!}
            onRetake={handleRetake}
            onGenerate={handleGenerate}
            error={error}
          />
        );

      case AppState.LOADING:
        return (
          <Loader
            messages={loadingType === "AI" ? loadingMessagesAI : loadingMessagesQR}
          />
        );

      case AppState.DUAL_RESULT:
        return (
          <DualResultView 
            image1={generatedImages![0]}
            image2={generatedImages![1]}
            retroTheme={winningThemes!.retro}
            futureTheme={winningThemes!.future}
            onCapture={handleCompositeUpload}
            onRetake={handleRetake}          // ✅ now wired
            error={error}
          />
        );

      case AppState.RESULT:
        return (
          <ResultView
            generatedImage={finalImage!}
            downloadUrl={finalImageUrl!}
            onStartOver={handleBackToLanding}
            onGoBack={handleBackToSelection}
          />
        );

      default:
        return <LandingPage onEnter={handleEnter} />;
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <main className="h-full aspect-[9/16] bg-black border border-white/10 overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
