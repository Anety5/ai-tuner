import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Logo } from './components/icons/Logo';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import Loader from './components/Loader';
import { SparkleIcon } from './components/icons/SparkleIcon';
import { ComplexityIcon } from './components/icons/ComplexityIcon';
import { EducationIcon } from './components/icons/EducationIcon';
import { PlagiarismCheckIcon } from './components/icons/PlagiarismCheckIcon';
import { ProofreadIcon } from './components/icons/ProofreadIcon';
import { SummarizeIcon } from './components/icons/SummarizeIcon';
import { CloseIcon } from './components/icons/CloseIcon';
import { MicrophoneIcon } from './components/icons/MicrophoneIcon';
import { SpeakerIcon } from './components/icons/SpeakerIcon';
import { generateText, proofreadText, summarizeText, AITask } from './services/geminiService';

// Fix: Add type declaration for the standard `SpeechRecognition` property on the Window object.
// Add type declarations for Speech Recognition APIs
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creativity, setCreativity] = useState(70);
  const [complexity, setComplexity] = useState(50);
  const [educationSetting, setEducationSetting] = useState('General');
  const [plagiarismGuard, setPlagiarismGuard] = useState(false);
  const [mode, setMode] = useState<AITask>('Optimize');

  const [aiReady, setAiReady] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'nano' | 'flash'>('flash');
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    async function checkAIAvailability() {
      if (window.ai && (await window.ai.canCreateTextSession()) === 'readily') {
        setAiReady(true);
        setSelectedModel('nano');
      } else {
        setAiReady(false);
        setSelectedModel('flash');
      }
    }
    checkAIAvailability();
  }, []);

  const getSystemInstruction = (): string => {
    let baseInstruction = `You are an expert consultant and creative strategist. Your task is to process the user's text based on the following settings.`;

    const instructions: string[] = [
      `Creativity Level: ${creativity}/100. Adjust your response to be more innovative and less conventional as this number increases.`,
      `Complexity Level: ${complexity}/100. Tailor the vocabulary, sentence structure, and conceptual depth accordingly.`,
    ];
    
    if (educationSetting !== 'General') {
        instructions.push(`Educational Context: Adapt your response for a '${educationSetting}' audience.`);
        if (plagiarismGuard) {
            instructions.push(`Originality Requirement: You MUST synthesize information and explain concepts in your own words. Avoid direct quotes and ensure the output is original.`);
        }
    }
    
    if (mode === 'Summarize') {
        baseInstruction = `You are an expert summarizer. Your task is to create a concise, easy-to-read summary of the provided text.`;
    } else if (mode === 'Proofread') {
        baseInstruction = `You are an expert proofreader. Your task is to correct any grammar, spelling, punctuation, and awkward phrasing in the provided text, while preserving the original meaning and intent.`;
    } else if (mode === 'Optimize') {
         if (inputText.toLowerCase().includes('code') || inputText.toLowerCase().includes('python') || inputText.toLowerCase().includes('javascript')) {
            instructions.push(`Coding Task: Format any code blocks correctly with language identifiers and provide clear, concise comments.`);
        }
    }

    return `${baseInstruction}\n\n${instructions.map(i => `- ${i}`).join('\n')}`;
  };

  const handleGenerate = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setOutputText('');

    try {
      let result = '';
      const systemInstruction = getSystemInstruction();

      if (mode === 'Optimize') {
        result = await generateText(inputText, systemInstruction, selectedModel);
      } else if (mode === 'Summarize') {
        result = await summarizeText(inputText, systemInstruction, selectedModel);
      } else if (mode === 'Proofread') {
        result = await proofreadText(inputText, systemInstruction, selectedModel);
      }
      
      if (!result || result.trim() === '') {
        setError("The AI returned an empty response. Try adjusting your prompt or settings.");
      } else {
        setOutputText(result);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(errorMessage);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInputText(prev => prev + finalTranscript);
    };
    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInputText(inputText + interimTranscript);
    };

    recognition.start();
  };
  
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    if (!outputText) return;

    const utterance = new SpeechSynthesisUtterance(outputText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
        setError("Text-to-speech failed.");
        setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  };
  
  const getButtonText = () => {
    switch (mode) {
      case 'Summarize': return 'Summarize';
      case 'Proofread': return 'Proofread';
      default: return 'Optimize';
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans p-6 flex flex-col max-h-screen">
      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <Logo />
        <button onClick={() => window.close()} className="text-gray-500 hover:text-white transition-colors">
            <CloseIcon />
        </button>
      </header>

      <main className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
        {/* Input and Controls Column */}
        <div className="flex flex-col gap-4 md:w-1/2 flex-shrink-0">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
             {/* Mode Selector */}
            <div className="flex justify-center bg-gray-700/50 p-1 rounded-lg">
                {(['Optimize', 'Summarize', 'Proofread'] as AITask[]).map(task => (
                    <button key={task} onClick={() => setMode(task)} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${mode === task ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>{task}</button>
                ))}
            </div>

            {/* Model Selector */}
            {aiReady && (
              <div className="flex justify-center bg-gray-700/50 p-1 rounded-lg">
                  <button onClick={() => setSelectedModel('nano')} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${selectedModel === 'nano' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>Nano (On-Device)</button>
                  <button onClick={() => setSelectedModel('flash')} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${selectedModel === 'flash' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}>Flash (Cloud)</button>
              </div>
            )}
             {!aiReady && <p className="text-center text-xs text-yellow-400/80">Gemini Nano not available in this browser. Using Cloud AI.</p>}

            <Slider
              label="Creativity"
              value={creativity}
              onChange={(e) => setCreativity(parseInt(e.target.value, 10))}
              icon={<SparkleIcon />}
              valueLabel={`${creativity}%`}
            />
            <Slider
              label="Complexity"
              value={complexity}
              onChange={(e) => setComplexity(parseInt(e.target.value, 10))}
              icon={<ComplexityIcon />}
              valueLabel={`${complexity}%`}
            />
            
            <div className="flex justify-between items-center">
              <label className="flex items-center text-sm font-medium text-gray-300">
                <EducationIcon />
                <span className="ml-2">Educational Setting</span>
              </label>
              <select value={educationSetting} onChange={e => setEducationSetting(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2">
                <option value="General">General</option>
                <option value="K-12">K-12</option>
                <option value="University">University</option>
              </select>
            </div>

            {educationSetting !== 'General' && (
              <Toggle
                label="Plagiarism Guard"
                enabled={plagiarismGuard}
                onChange={setPlagiarismGuard}
                icon={<PlagiarismCheckIcon />}
              />
            )}
          </div>
        </div>

        {/* Input/Output Column */}
        <div className="flex flex-col gap-4 md:w-1/2 flex-grow min-h-0">
            {/* Input Area */}
            <div className="flex flex-col flex-grow min-h-0">
                <label htmlFor="input-text" className="text-sm font-medium mb-2 text-gray-400 flex-shrink-0">Your Idea / Text</label>
                <div className="relative w-full flex-grow">
                    <textarea
                      id="input-text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={mode === 'Summarize' ? "Paste the text you want to summarize here..." : "Describe your idea, ask a question, or paste your text to proofread..."}
                      className="w-full h-full p-4 pr-12 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    />
                    <button onClick={handleMic} className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-500/20' : 'text-gray-400 hover:bg-gray-700'}`}>
                        <MicrophoneIcon />
                    </button>
                </div>
            </div>

            {/* Output Area */}
            <div className="flex flex-col flex-grow min-h-0">
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <label htmlFor="output-text" className="text-sm font-medium text-gray-400">AI Response</label>
                    <button onClick={handleSpeak} disabled={!outputText || isLoading} className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors">
                        <SpeakerIcon isSpeaking={isSpeaking} />
                    </button>
                </div>
                <div className="relative w-full flex-grow border border-gray-700 rounded-lg bg-gray-800">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg z-10">
                        <div className="flex flex-col items-center gap-2">
                            <Loader />
                            <span className="text-gray-400">Generating...</span>
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="p-4 text-red-400">
                        <strong>Error:</strong> {error}
                      </div>
                    )}
                    <pre className="whitespace-pre-wrap font-sans text-gray-300 h-full overflow-y-auto p-4">
                      {outputText}
                    </pre>
                </div>
            </div>
          
            <button
                onClick={handleGenerate}
                disabled={isLoading || !inputText.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0"
            >
                {isLoading ? (
                  <>
                    <Loader />
                    <span>Generating...</span>
                  </>
                ) : (
                 <>
                    {mode === 'Optimize' && <SparkleIcon />}
                    {mode === 'Summarize' && <SummarizeIcon />}
                    {mode === 'Proofread' && <ProofreadIcon />}
                    <span>{getButtonText()}</span>
                  </>
                )}
            </button>
        </div>
      </main>
    </div>
  );
};

export default App;