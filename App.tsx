import React, { useState, useRef, useEffect } from 'react';
import { generateText, textToSpeech, generateImage, analyzeImage } from './services/geminiService';
import { Logo } from './components/icons/Logo';
import Loader from './components/Loader';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import { ParentalControlIcon } from './components/icons/ParentalControlIcon';
import { PlagiarismCheckIcon } from './components/icons/PlagiarismCheckIcon';
import { ComplexityIcon } from './components/icons/ComplexityIcon';
import { SparkleIcon } from './components/icons/SparkleIcon';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { UploadIcon } from './components/icons/UploadIcon';
import { SpeakerIcon } from './components/icons/SpeakerIcon';
import { TranslateIcon } from './components/icons/TranslateIcon';
import { ProofreadIcon } from './components/icons/ProofreadIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { TextIcon } from './components/icons/TextIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { ScanEyeIcon } from './components/icons/ScanEyeIcon';

import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import jspdf from 'jspdf';

type Tab = 'text' | 'image' | 'analyzer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('text');

  // Text Assistant State
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [creativity, setCreativity] = useState<number>(70);
  const [factuality, setFactuality] = useState<number>(50);
  const [parentalControls, setParentalControls] = useState<boolean>(false);
  const [plagiarismCheck, setPlagiarismCheck] = useState<boolean>(false);
  const [sources, setSources] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [translationTarget, setTranslationTarget] = useState<{ text: string, type: 'output' | 'analysis' } | null>(null);
  const [lastTask, setLastTask] = useState<{ type: string, lang?: string }>({ type: 'generate' });

  // Image Generator State
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Image Analyzer State
  const [imageForAnalysis, setImageForAnalysis] = useState<{ file: File, dataUrl: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecordingAnalysis, setIsRecordingAnalysis] = useState(false);
  const [analysisTranscript, setAnalysisTranscript] = useState('');
  const analysisTranscriptRef = useRef(''); // Ref to hold the latest transcript

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null); // SpeechRecognition instance

  // Language List
  const languages = { "English": "en-US", "Spanish": "es-ES", "French": "fr-FR", "German": "de-DE", "Italian": "it-IT", "Portuguese": "pt-BR", "Russian": "ru-RU", "Japanese": "ja-JP", "Korean": "ko-KR", "Chinese (Mandarin)": "zh-CN" };

  // Initialize Speech Recognition
  const setupRecognition = (onResult: (transcript: string) => void, onEnd: () => void) => {
    if ('webkitSpeechRecognition' in window) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onResult(finalTranscript);
        }
      };
      recognition.onend = onEnd;
      recognitionRef.current = recognition;
    } else {
      setError("Speech recognition is not supported in this browser.");
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setupRecognition(
        (transcript) => setInputText(prev => prev + transcript),
        () => setIsRecording(false)
      );
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsGenerating(true);
    setInputText('');

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let pdfText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            pdfText += content.items.map((item: any) => item.str).join(' ');
          }
          setInputText(pdfText);
          setIsGenerating(false);
        };
        reader.readAsArrayBuffer(file);
        return;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else { // txt
        text = await file.text();
      }
      setInputText(text);
    } catch (e: any) {
      setError(`Failed to read file: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleGenerate = async (task: string, text: string, lang?: string) => {
    setIsGenerating(true);
    setError(null);
    setOutputText('');
    setSources([]);

    const options = {
      creativity,
      factuality,
      parentalControls,
      plagiarismCheck
    };

    try {
      const response = await generateText(task, text, options, lang);
      setOutputText(response.text);
      if (plagiarismCheck && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setSources(response.candidates[0].groundingMetadata.groundingChunks);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSpeak = async (text: string, lang?: string) => {
    if (isSpeaking) {
      audioSourceRef.current?.stop();
      setIsSpeaking(false);
      return;
    }
    setError(null);
    setIsSpeaking(true);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioBuffer = await textToSpeech(text, lang);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
      audioSourceRef.current = source;
    } catch (e: any) {
      setError(e.message || 'Audio playback unavailable.');
      setIsSpeaking(false);
    }
  };

  const handleTranslateClick = (text: string, type: 'output' | 'analysis') => {
    setTranslationTarget({ text, type });
    setShowLanguageModal(true);
  };
  
  const handleLanguageSelect = async (langCode: string, langName: string) => {
    if (translationTarget) {
      if (translationTarget.type === 'output') {
        handleGenerate(`Translate the following text to ${langName}`, translationTarget.text, langCode);
        setLastTask({ type: 'translate', lang: langCode });
      } else { // For analysis translation, use a simple text generation call
        setIsAnalyzing(true);
        setError(null);
        setAnalysisResult('');
        try {
          // Use a simple text generation for translation instead of re-analyzing
          const response = await generateText(`Translate the following text to ${langName}`, translationTarget.text, { creativity: 50, factuality: 50, parentalControls: false, plagiarismCheck: false });
          setAnalysisResult(response.text);
        } catch(e: any) {
          setError(e.message || 'Failed to translate analysis.');
        } finally {
          setIsAnalyzing(false);
        }
      }
    }
    setShowLanguageModal(false);
    setTranslationTarget(null);
  };

  const handleDownload = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    doc.text(outputText, 10, 10);
    doc.save("generated-text.pdf");
  };

  const handleImageGenerate = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setError(null);
    try {
      const imageUrl = await generateImage(imagePrompt);
      setGeneratedImageUrl(imageUrl);
    } catch (e: any) {
      setError(e.message || "Failed to generate image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUploadForAnalysis = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageForAnalysis({ file, dataUrl: reader.result as string });
        setAnalysisResult('');
        setAnalysisTranscript('');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAnalyze = async (file: File, prompt: string) => {
      if (!prompt.trim()) {
        setError("Please ask a question about the image.");
        return;
      }
      setIsAnalyzing(true);
      setAnalysisResult('');
      setError(null);
      try {
          const result = await analyzeImage(prompt, file);
          setAnalysisResult(result);
      } catch (e: any) {
          setError(e.message || "Failed to analyze image.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleAnalyzeMic = () => {
    if (isRecordingAnalysis) {
        recognitionRef.current?.stop();
    } else {
        analysisTranscriptRef.current = ''; // Reset ref
        setAnalysisTranscript(''); // Reset state for UI
        setupRecognition(
            (transcript) => {
                // Use ref to accumulate transcript to avoid stale state in callback
                analysisTranscriptRef.current = analysisTranscriptRef.current + transcript; 
                setAnalysisTranscript(analysisTranscriptRef.current);
            },
            () => {
                setIsRecordingAnalysis(false);
                if (imageForAnalysis && analysisTranscriptRef.current) {
                    handleAnalyze(imageForAnalysis.file, analysisTranscriptRef.current);
                }
            }
        );
        recognitionRef.current?.start();
        setIsRecordingAnalysis(true);
    }
  };

  useEffect(() => {
    // Cleanup speech recognition on component unmount
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <main className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
      <div className="container mx-auto p-4 md:p-6 flex-grow flex flex-col">
        <header className="flex items-center gap-4 mb-6">
          <Logo />
          <h1 className="text-3xl font-bold text-gray-100">Idea Optimizer AI</h1>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button onClick={() => setActiveTab('text')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'text' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <TextIcon /> Text Assistant
          </button>
          <button onClick={() => setActiveTab('image')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'image' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <ImageIcon /> Image Generator
          </button>
          <button onClick={() => setActiveTab('analyzer')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'analyzer' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
            <ScanEyeIcon /> Image Analyzer
          </button>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel - Only for Text Assistant */}
          {activeTab === 'text' && (
            <div className="md:col-span-1">
              <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg sticky top-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-100">AI Settings</h2>
                <div className="space-y-6">
                  <Slider label="Creativity" value={creativity} onChange={(e) => setCreativity(Number(e.target.value))} icon={<SparkleIcon />} valueLabel={creativity < 33 ? 'Precise' : creativity < 67 ? 'Balanced' : 'Inspired'} />
                  <Slider label="Factuality" value={factuality} onChange={(e) => setFactuality(Number(e.target.value))} icon={<ComplexityIcon />} valueLabel={factuality < 33 ? 'Creative' : factuality < 67 ? 'Grounded' : 'Factual'} />
                  <h3 className="text-md font-medium text-indigo-400 border-b border-gray-700 pb-2 pt-2">Features</h3>
                  <Toggle label="Parental Control" enabled={parentalControls} onChange={setParentalControls} icon={<ParentalControlIcon />} />
                  <Toggle label="Plagiarism Guard" enabled={plagiarismCheck} onChange={setPlagiarismCheck} icon={<PlagiarismCheckIcon />} />
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className={activeTab === 'text' ? 'md:col-span-2' : 'md:col-span-3'}>
            {/* TEXT ASSISTANT */}
            {activeTab === 'text' && (
              <div className="flex flex-col gap-6 h-full">
                <div className="relative">
                  <textarea id="input-text" rows={8} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 pr-20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-gray-200 resize-none" placeholder="Write a prompt or paste your text here..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button onClick={handleMicClick} className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500/50' : 'hover:bg-gray-700'}`} title={isRecording ? 'Stop Recording' : 'Use Microphone'}>
                      <MicrophoneIcon />
                    </button>
                    <label htmlFor="file-upload" className="p-2 rounded-full hover:bg-gray-700 cursor-pointer" title="Upload File">
                      <UploadIcon />
                    </label>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
                  </div>
                </div>
                <div className="flex justify-center">
                    <button onClick={() => { handleGenerate(inputText, inputText); setLastTask({type: 'generate'})}} disabled={isGenerating || !inputText} className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors duration-200">
                        {isGenerating ? <Loader /> : <SparkleIcon />}
                        <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
                    </button>
                </div>
                <div className="relative flex-grow">
                  <div className="w-full h-full min-h-[250px] bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-200 whitespace-pre-wrap overflow-y-auto">
                    {isGenerating && <div className="flex justify-center items-center h-full"><Loader /></div>}
                    {error && <div className="text-red-400">{error}</div>}
                    {!isGenerating && !error && outputText}
                    {sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources:</h4>
                        <ul className="list-decimal list-inside text-xs space-y-1">
                          {sources.map((chunk, index) => (
                            <li key={index}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{chunk.web.title}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                   {!isGenerating && outputText && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-gray-800/80 p-2 rounded-lg">
                           <button onClick={() => handleGenerate('Proofread the following text', outputText)} className="p-2 hover:bg-gray-700 rounded-full" title="Proofread"><ProofreadIcon /></button>
                           <button onClick={() => handleTranslateClick(outputText, 'output')} className="p-2 hover:bg-gray-700 rounded-full" title="Translate"><TranslateIcon /></button>
                           <button onClick={() => handleSpeak(outputText, lastTask.lang)} className="p-2 hover:bg-gray-700 rounded-full" title={isSpeaking ? "Stop Speaking" : "Speak Text"}><SpeakerIcon isSpeaking={isSpeaking} /></button>
                           <button onClick={handleDownload} className="p-2 hover:bg-gray-700 rounded-full" title="Download as PDF"><DownloadIcon /></button>
                        </div>
                    )}
                </div>
              </div>
            )}
            {/* IMAGE GENERATOR */}
            {activeTab === 'image' && (
                <div className="flex flex-col gap-4 items-center h-full">
                    <div className="w-full max-w-2xl">
                        <textarea rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-gray-200 resize-none" placeholder="A majestic lion wearing a crown, photorealistic... (any language)" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
                        <button onClick={handleImageGenerate} disabled={isGeneratingImage || !imagePrompt} className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors duration-200">
                            {isGeneratingImage ? <Loader /> : <ImageIcon />}
                            <span>{isGeneratingImage ? 'Generating...' : 'Generate Image'}</span>
                        </button>
                    </div>
                     <div className="flex-grow w-full max-w-2xl bg-gray-800/50 border border-gray-700 rounded-lg flex items-center justify-center p-4">
                        {isGeneratingImage && <Loader />}
                        {error && <div className="text-red-400 text-center">{error}</div>}
                        {generatedImageUrl && !isGeneratingImage && (
                          <div className="relative group">
                              <img src={generatedImageUrl} alt="Generated" className="max-h-full max-w-full object-contain rounded-md" />
                              <a href={generatedImageUrl} download="generated-image.png" className="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Download Image">
                                  <DownloadIcon />
                              </a>
                          </div>
                        )}
                        {!generatedImageUrl && !isGeneratingImage && !error && <p className="text-gray-400">Your generated image will appear here.</p>}
                    </div>
                </div>
            )}
            {/* IMAGE ANALYZER */}
            {activeTab === 'analyzer' && (
                <div className="flex flex-col md:flex-row gap-6 h-full">
                    <div className="md:w-1/2 flex flex-col gap-4 items-center">
                        <div className="w-full h-64 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center relative">
                            {imageForAnalysis ? (
                                <img src={imageForAnalysis.dataUrl} alt="For analysis" className="max-h-full max-w-full object-contain rounded-md" />
                            ) : (
                                <p className="text-gray-400">Upload an image to analyze</p>
                            )}
                        </div>
                        <label htmlFor="image-upload" className="w-full text-center px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold cursor-pointer transition-colors duration-200">
                           {imageForAnalysis ? 'Change Image' : 'Upload Image'}
                        </label>
                        <input id="image-upload" type="file" className="hidden" onChange={handleImageUploadForAnalysis} accept="image/*" />
                        {imageForAnalysis && (
                          <div className="flex flex-col items-center gap-2">
                            <button onClick={handleAnalyzeMic} className={`p-4 rounded-full transition-colors ${isRecordingAnalysis ? 'bg-red-500/50 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`} title={isRecordingAnalysis ? "Stop Recording" : "Ask about image"}>
                                <MicrophoneIcon />
                            </button>
                             <p className="text-sm text-gray-400 h-5">{isRecordingAnalysis ? 'Listening...' : (analysisTranscript || 'Click mic to ask a question')}</p>
                          </div>
                        )}
                    </div>
                    <div className="md:w-1/2 flex flex-col">
                        <div className="relative flex-grow">
                             <div className="w-full h-full min-h-[250px] bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-200 whitespace-pre-wrap overflow-y-auto">
                                {isAnalyzing && <div className="flex justify-center items-center h-full"><Loader /></div>}
                                {error && <div className="text-red-400">{error}</div>}
                                {!isAnalyzing && !error && analysisResult}
                                {!isAnalyzing && !analysisResult && !error && <p className="text-gray-400">The analysis of your image will appear here.</p>}
                            </div>
                            {!isAnalyzing && analysisResult && (
                                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-gray-800/80 p-2 rounded-lg">
                                   <button onClick={() => handleTranslateClick(analysisResult, 'analysis')} className="p-2 hover:bg-gray-700 rounded-full" title="Translate"><TranslateIcon /></button>
                                   <button onClick={() => handleSpeak(analysisResult)} className="p-2 hover:bg-gray-700 rounded-full" title={isSpeaking ? "Stop Speaking" : "Speak Analysis"}><SpeakerIcon isSpeaking={isSpeaking} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>
      </div>
      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Language</h3>
              <button onClick={() => setShowLanguageModal(false)}><CloseIcon /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(languages).map(([name, code]) => (
                <button key={code} onClick={() => handleLanguageSelect(code, name)} className="text-left p-2 hover:bg-gray-700 rounded-md transition-colors">
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;