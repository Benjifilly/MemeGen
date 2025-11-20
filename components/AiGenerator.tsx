
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Terminal, Trash2, ArrowLeft, Zap, Sparkles, AlertCircle, ChevronDown, X } from 'lucide-react';
import { Button } from './Button';
import { generateHighQualityImage, generateFastImage } from '../services/geminiService';

interface AiGeneratorProps {
  onSelect: (url: string) => void;
  onBack: () => void;
  initialPrompt?: string;
}

interface AiModel {
    id: string;
    name: string;
    status: 'available' | 'unavailable';
    label: string;
    color: string;
}

const MODELS: AiModel[] = [
    { id: 'imagen-4', name: 'Imagen 4.0', status: 'available', label: 'High Quality', color: 'bg-indigo-500' },
    { id: 'gemini-2.5', name: 'Gemini 2.5 Flash', status: 'available', label: 'Fast Gen', color: 'bg-blue-500' },
    { id: 'imagen-3', name: 'Imagen 3.0', status: 'unavailable', label: 'Legacy', color: 'bg-neutral-500' },
    { id: 'veo', name: 'Veo Video', status: 'unavailable', label: 'Video Gen', color: 'bg-purple-500' },
];

export const AiGenerator: React.FC<AiGeneratorProps> = ({ onSelect, onBack, initialPrompt = "" }) => {
  const [aiPrompt, setAiPrompt] = useState(initialPrompt);
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const [currentAiIndex, setCurrentAiIndex] = useState(-1);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Model Selection State
  const [selectedModelId, setSelectedModelId] = useState('imagen-4');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Background pre-fetching ref
  const preloadPromiseRef = useRef<Promise<string> | null>(null);
  const loadedPromptRef = useRef<string>("");
  const modelRef = useRef<string>(selectedModelId);

  // Update ref when model changes
  useEffect(() => {
    modelRef.current = selectedModelId;
  }, [selectedModelId]);

  // Auto-start
  useEffect(() => {
    if (initialPrompt && aiHistory.length === 0 && !loadingAi) {
        handleGenerate(false);
    }
  }, []);

  const callGenerationApi = async (prompt: string, modelId: string) => {
      if (modelId === 'gemini-2.5') {
          return await generateFastImage(prompt);
      }
      // Default to Imagen 4.0
      return await generateHighQualityImage(prompt);
  };

  const triggerPreload = (prompt: string) => {
    if (!prompt.trim()) return;
    const currentModel = modelRef.current;
    // Background preload
    preloadPromiseRef.current = callGenerationApi(prompt, currentModel)
        .then(url => url)
        .catch((err) => {
            // We silently catch here so the UI doesn't break, 
            // but we return null so the main handler knows to retry.
            return null as any;
        });
    loadedPromptRef.current = prompt;
  };

  const handleGenerate = async (isNextClick = false) => {
    if (!aiPrompt.trim()) return;

    // Navigation Logic: If we are just moving forward in history
    if (isNextClick && currentAiIndex < aiHistory.length - 1) {
        setCurrentAiIndex(prev => prev + 1);
        return;
    }

    setLoadingAi(true);
    setError(null);

    try {
        let newImageUrl: string | null = null;

        // Check if we have a valid preloaded image for this specific prompt and model
        if (isNextClick && preloadPromiseRef.current && loadedPromptRef.current === aiPrompt && modelRef.current === selectedModelId) {
            newImageUrl = await preloadPromiseRef.current;
        }

        // If no preload, or preload failed/empty, generate fresh
        if (!newImageUrl) {
            newImageUrl = await callGenerationApi(aiPrompt, selectedModelId);
        }

        if (newImageUrl) {
            // Append new image to history
            setAiHistory(prev => [...prev, newImageUrl!]);
            
            // CRITICAL: Jump to the end of the list (the new image)
            // The index of the newly added item is equal to the old length.
            setCurrentAiIndex(prevIndex => aiHistory.length);
            
            // Start buffering the next one
            preloadPromiseRef.current = null;
            triggerPreload(aiPrompt);
        }

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Generation failed. Please check your connection or quota.");
    } finally {
        setLoadingAi(false);
    }
  };

  const clearHistory = () => {
    setAiHistory([]);
    setCurrentAiIndex(-1);
    setAiPrompt("");
    preloadPromiseRef.current = null;
    setError(null);
  };

  const navigateHistory = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
        if (currentAiIndex > 0) setCurrentAiIndex(prev => prev - 1);
    } else {
        // Right arrow acts as "Next" in history OR "Generate New" if at end
        handleGenerate(true);
    }
  };

  const currentModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in-up font-sans text-neutral-200 selection:bg-white/20">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-start pointer-events-none">
         <div className="pointer-events-auto">
             <button 
                onClick={onBack}
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
             >
                 <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-full group-hover:border-neutral-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                 </div>
             </button>
         </div>
         
         {/* Model Selector Badge / Dropdown */}
         <div className="pointer-events-auto relative">
             <button 
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur px-3 py-1.5 rounded-full border border-neutral-800 shadow-lg hover:border-neutral-600 transition-all group"
             >
                <div className={`w-1.5 h-1.5 rounded-full ${currentModel.color} shadow-[0_0_8px_currentColor]`}></div>
                <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wide group-hover:text-white transition-colors">
                    {currentModel.name}
                </span>
                <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform duration-300 ${showModelDropdown ? 'rotate-180' : ''}`} />
             </button>

             {/* Dropdown Menu */}
             {showModelDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-[60] animate-fade-in-up origin-top-right">
                    <div className="py-1">
                        {MODELS.map(model => (
                            <button
                                key={model.id}
                                disabled={model.status === 'unavailable'}
                                onClick={() => { setSelectedModelId(model.id); setShowModelDropdown(false); }}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors
                                    ${selectedModelId === model.id ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'}
                                    ${model.status === 'unavailable' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className={`text-xs font-medium ${model.status === 'unavailable' ? 'text-neutral-500' : 'text-neutral-200'}`}>
                                        {model.name}
                                    </span>
                                    <span className="text-[9px] text-neutral-500 uppercase tracking-wider">{model.label}</span>
                                </div>
                                <div className="flex items-center">
                                    {model.status === 'available' ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></div>
                                    ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 border border-neutral-600"></div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
             )}
         </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute top-24 left-0 w-full z-[60] flex justify-center px-4 pointer-events-none">
            <div className="bg-red-900/90 border border-red-700 text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 pointer-events-auto max-w-xl animate-fade-in-up">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-800 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}

      {/* Main Display Area */}
      <div className="flex-1 relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-neutral-950" onClick={() => setShowModelDropdown(false)}>
         {/* Background Aesthetic */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 ${selectedModelId === 'imagen-4' ? 'bg-indigo-500/5' : 'bg-blue-500/5'}`}></div>
         
         {/* Content Container */}
         <div className="relative z-10 w-full max-w-5xl h-[65vh] flex flex-col items-center justify-center">
             
             {/* Empty State */}
             {!loadingAi && aiHistory.length === 0 && (
                <div className="text-center space-y-5 animate-fade-in-up max-w-lg px-6">
                    <div className="w-20 h-20 mx-auto bg-neutral-900/50 rounded-full flex items-center justify-center border border-neutral-800 shadow-[0_0_40px_rgba(255,255,255,0.05)] mb-6">
                        <Sparkles className="w-8 h-8 text-neutral-600" />
                    </div>
                    <h2 className="text-4xl font-light text-white tracking-tighter">Imagine Anything</h2>
                    <p className="text-neutral-500 text-lg font-light">Enter a prompt below to initialize the generation sequence.</p>
                </div>
             )}

             {/* Loading State - Minimal & Clean */}
             {loadingAi && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
                     <div className="relative">
                         <div className="w-20 h-20 border-[3px] border-neutral-800 border-t-white rounded-full animate-spin"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                         </div>
                     </div>
                     <p className="mt-8 text-xs font-medium text-neutral-500 uppercase tracking-[0.2em] animate-pulse">Creating Asset...</p>
                 </div>
             )}

             {/* Image Display */}
             {aiHistory.length > 0 && (
                 <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-out transform ${loadingAi ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                     <img 
                        key={aiHistory[currentAiIndex]} 
                        src={aiHistory[currentAiIndex]} 
                        alt="Generated Content" 
                        className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg select-none"
                        draggable={false}
                    />
                 </div>
             )}
         </div>

         {/* Use Button - Floating below image */}
         {!loadingAi && aiHistory.length > 0 && (
             <div className="mt-8 animate-fade-in-up z-20 h-12">
                <Button 
                    onClick={() => onSelect(aiHistory[currentAiIndex])} 
                    className="bg-white text-black hover:bg-neutral-200 border-none px-8 py-3 text-xs font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(255,255,255,0.1)] rounded-full transition-all hover:scale-105 active:scale-95"
                >
                    Use Template
                </Button>
             </div>
         )}

         {/* Navigation Arrows */}
         {aiHistory.length > 0 && (
            <>
                <button 
                    onClick={(e) => { e.stopPropagation(); navigateHistory('prev'); }}
                    disabled={currentAiIndex === 0 || loadingAi}
                    className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 p-4 text-neutral-600 hover:text-white disabled:opacity-0 transition-all hover:scale-110 active:scale-95 z-30 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/5"
                >
                    <ChevronLeft className="w-10 h-10 md:w-12 md:h-12" strokeWidth={0.5} />
                </button>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); navigateHistory('next'); }}
                    disabled={loadingAi}
                    className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 p-4 text-neutral-600 hover:text-white transition-all hover:scale-110 active:scale-95 flex flex-col items-center gap-2 group z-30 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/5"
                >
                    <ChevronRight className="w-10 h-10 md:w-12 md:h-12" strokeWidth={0.5} />
                </button>
            </>
         )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full bg-black/50 backdrop-blur-lg border-t border-neutral-800/50 p-6 pb-10 z-40">
         <div className="max-w-3xl mx-auto w-full space-y-4">
             <div className="flex gap-2 relative group focus-within:ring-1 ring-neutral-700 rounded-2xl transition-all bg-neutral-900/50 border border-neutral-800 p-1">
                <div className="pl-3 flex items-center justify-center text-neutral-500">
                    <Terminal className="w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate(false)}
                    placeholder="Describe your vision..."
                    className="flex-1 bg-transparent border-none text-white px-3 py-3 outline-none font-sans text-sm placeholder:text-neutral-600"
                    autoFocus
                />
                <button 
                    onClick={() => handleGenerate(false)}
                    disabled={loadingAi || !aiPrompt.trim()}
                    className="bg-white text-black hover:bg-neutral-200 px-6 font-bold uppercase tracking-wider text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 shadow-lg hover:shadow-white/20"
                >
                    {loadingAi ? <Loader2 className="w-3 h-3 animate-spin"/> : <><Zap className="w-3 h-3 fill-black" /> RUN</>}
                </button>
             </div>
             
             <div className="flex items-center justify-between text-[10px] font-mono text-neutral-600 uppercase tracking-wider px-2">
                 <button onClick={clearHistory} disabled={aiHistory.length === 0} className="hover:text-red-500 disabled:opacity-0 transition-colors flex items-center gap-1.5">
                     <Trash2 className="w-3 h-3" /> Clear History
                 </button>
                 
                 {/* Improved Counter Visibility */}
                 <div className={`flex items-center gap-3 transition-opacity duration-300 ${aiHistory.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-neutral-900 text-white px-4 py-2 rounded-full border border-neutral-700 shadow-md font-bold text-xs tracking-widest">
                        <span className="text-indigo-400">{currentAiIndex + 1}</span> 
                        <span className="text-neutral-600 mx-1">/</span> 
                        <span>{aiHistory.length}</span>
                    </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};
