
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { MemeCanvas, MemeCanvasHandle } from './components/MemeCanvas';
import { Button } from './components/Button';
import { AiGenerator } from './components/AiGenerator';
import { MemeText, MemeSticker, MemeLayer, Tab, HistoryState } from './types';
import { generateMagicCaptions, editMemeImage } from './services/geminiService';
import { Wand2, Plus, Trash2, ArrowLeft, AlignLeft, AlignCenter, AlignRight, Undo, Redo, RotateCw, Type as FontIcon, X, Sparkles, ChevronUp, ChevronDown, Palette, Smile, Search, AlertCircle, Check, Maximize, Move, RotateCcw, Scaling, Download, Monitor, Layers, Copy } from 'lucide-react';

const FONTS = [
  { name: 'Oswald', label: 'Oswald (Default)' },
  { name: 'Anton', label: 'Anton (Impact-like)' },
  { name: 'Bangers', label: 'Bangers (Comic)' },
  { name: 'Comic Neue', label: 'Comic Neue' },
  { name: 'Roboto', label: 'Roboto' },
];

const FILTERS = [
    { name: 'Normal', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Noir', value: 'grayscale(100%) contrast(150%) brightness(90%)' },
    { name: 'Fried', value: 'contrast(200%) saturate(200%)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(80%) brightness(120%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Warm', value: 'sepia(30%) saturate(140%)' },
    { name: 'Cool', value: 'hue-rotate(30deg) contrast(120%)' },
    { name: 'Cyber', value: 'hue-rotate(190deg) saturate(200%) contrast(120%)' },
    { name: 'Dreamy', value: 'brightness(110%) saturate(120%) blur(0.5px)' },
    { name: 'Invert', value: 'invert(100%)' },
    { name: 'Blur', value: 'blur(3px)' },
    { name: 'Ghost', value: 'opacity(50%) blur(1px)' },
];

// GIPHY API Configuration
const GIPHY_API_KEY = 'cSEyxg1j17Bzc0BPQsoEtKqQajqvG06x'; 
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/stickers';

// Helper for CORS Proxy
const getProxiedUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=png`;
};

// Helper to format numbers: 16.00 -> 16, 16.40 -> 16.4, 16.456 -> 16.46
const formatValue = (val: number | undefined) => {
    if (val === undefined) return 0;
    return Number(parseFloat(val.toFixed(2)));
};

type AppView = 'HOME' | 'AI_GENERATOR' | 'EDITOR';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('HOME');
  const [aiStartPrompt, setAiStartPrompt] = useState("");

  const [image, setImage] = useState<string | null>(null);
  const [layers, setLayers] = useState<MemeLayer[]>([]);
  const canvasRef = useRef<MemeCanvasHandle>(null);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CAPTION);
  const [imageFilter, setImageFilter] = useState('none');

  // Sticker Tab State
  const [stickerSearch, setStickerSearch] = useState("");
  const [stickerResults, setStickerResults] = useState<{id: string, url: string, title: string}[]>([]);
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);

  // Modals
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);
  const [generatedEditImage, setGeneratedEditImage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [previewFilter, setPreviewFilter] = useState('none');

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [finalImagePreview, setFinalImagePreview] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState("my-meme");
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [exportQuality, setExportQuality] = useState(0.9);
  const [exportDimensions, setExportDimensions] = useState({ width: 0, height: 0 });
  const [copySuccess, setCopySuccess] = useState(false);

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveHistory = useCallback((newLayers: MemeLayer[], newImage?: string | null, newFilter?: string) => {
    const stateToSave: HistoryState = {
        layers: JSON.parse(JSON.stringify(newLayers)),
        image: newImage !== undefined ? newImage : image,
        filter: newFilter !== undefined ? newFilter : imageFilter
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(stateToSave);
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, image, imageFilter]);

  const handleImageSelect = (base64: string) => {
    setImage(base64);
    setLayers([]);
    setImageFilter('none');
    setHistory([{ layers: [], image: base64, filter: 'none' }]);
    setHistoryIndex(0);
    setSuggestedCaptions([]);
    setActiveTab(Tab.CAPTION);
    setSelectedId(null);
    setView('EDITOR');
  };

  const handleNavigateToAi = (initialPrompt: string) => {
      setAiStartPrompt(initialPrompt);
      setView('AI_GENERATOR');
  };

  const addText = (content: string = "DOUBLE TAP TO EDIT") => {
    const newText: MemeText = {
      type: 'text',
      id: Date.now().toString(),
      content,
      x: 50,
      y: layers.length === 0 ? 15 : 50,
      color: '#FFFFFF',
      fontSize: 40,
      boxWidth: 400,
      textAlign: 'center',
      rotation: 0,
      fontFamily: 'Oswald'
    };
    const newLayers = [...layers, newText];
    setLayers(newLayers);
    setSelectedId(newText.id);
    saveHistory(newLayers);
  };

  const addSticker = async (rawUrl: string) => {
      const url = getProxiedUrl(rawUrl);
      const uniqueId = `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create sticker with default values
      const newSticker: MemeSticker = {
          type: 'sticker',
          id: uniqueId,
          url,
          x: 50,
          y: 50,
          width: 200, 
          height: 200,
          rotation: 0
      };
      
      // Add to layers
      setLayers(prev => {
          const updated = [...prev, newSticker];
          // Defer history save to next tick to allow image loading
          setTimeout(() => saveHistory(updated), 0);
          return updated;
      });
      setSelectedId(newSticker.id);
  };

  const updateLayer = (id: string, updates: Partial<MemeLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l) as MemeLayer[]);
  };

  const removeLayer = (id: string) => {
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (selectedId === id) setSelectedId(null);
    saveHistory(newLayers);
  };

  const requestResetAllLayers = () => {
      setShowResetConfirmModal(true);
  };

  const confirmResetAllLayers = () => {
      const newLayers = layers.map(l => {
          const defaults = { x: 50, y: 50, rotation: 0 };
          if(l.type === 'text') {
              return { 
                  ...l, 
                  ...defaults, 
                  fontSize: 40, 
                  boxWidth: 400,
                  textAlign: 'center' as const
              };
          }
          if(l.type === 'sticker') {
              // Try to maintain aspect ratio if possible, else default to square
              const ratio = l.width / l.height || 1;
              return { ...l, ...defaults, width: 200, height: 200 / ratio };
          }
          return l;
      });
      setLayers(newLayers);
      saveHistory(newLayers);
      setShowResetConfirmModal(false);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(prev.layers)));
      setImage(prev.image);
      setImageFilter(prev.filter);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(next.layers)));
      setImage(next.image);
      setImageFilter(next.filter);
    }
  };

  // Sticker API Fetching (GIPHY)
  const fetchStickers = useCallback(async (query: string) => {
      setIsLoadingStickers(true);
      setStickerResults([]);
      
      try {
          const endpoint = query.trim() 
              ? `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=g`
              : `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=g`;
              
          const response = await fetch(endpoint);
          
          if (response.ok) {
              const data = await response.json();
              const results = data.data.map((item: any) => ({
                  id: item.id,
                  url: item.images?.original?.url || item.images?.fixed_height?.url,
                  title: item.title || 'Sticker'
              })).filter((item: any) => item.url);
              
              setStickerResults(results);
          }
      } catch (error) {
          console.error("Failed to fetch stickers:", error);
      } finally {
          setIsLoadingStickers(false);
      }
  }, []);

  // Fetch trending stickers on mount if in editor
  useEffect(() => {
      if (view === 'EDITOR' && stickerResults.length === 0) {
          fetchStickers("");
      }
  }, [view]);

  // Debounced search for stickers
  useEffect(() => {
      const timer = setTimeout(() => {
          if (view === 'EDITOR') {
              fetchStickers(stickerSearch);
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [stickerSearch, fetchStickers, view]);

  const handleMagicAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const captions = await generateMagicCaptions(image);
      setSuggestedCaptions(captions);
    } catch (error) {
      alert("Failed to generate captions.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAiEdit = async () => {
    if (!image || !editPrompt.trim()) return;
    setIsGeneratingEdit(true);
    setGeneratedEditImage(null);
    setEditError(null);
    try {
      const newImage = await editMemeImage(image, editPrompt);
      setGeneratedEditImage(newImage);
    } catch (error: any) {
      setEditError(error.message || "Failed to edit image.");
    } finally {
      setIsGeneratingEdit(false);
    }
  };

  const applyAiEdit = () => {
      if (generatedEditImage) {
          setImage(generatedEditImage);
          saveHistory(layers, generatedEditImage, imageFilter); 
          setShowEditModal(false);
          setGeneratedEditImage(null);
          setEditPrompt("");
      }
  };

  const applyFilter = () => {
      setImageFilter(previewFilter);
      saveHistory(layers, image, previewFilter);
      setShowFilterModal(false);
  };

  const handleOpenDownloadModal = () => {
      if (canvasRef.current) {
          setSelectedId(null);
          setTimeout(() => {
             const dataUrl = canvasRef.current?.exportImage('image/png');
             const dims = canvasRef.current?.getDimensions() || { width: 0, height: 0 };
             setExportDimensions(dims);
             if (dataUrl) {
                 setFinalImagePreview(dataUrl);
                 setShowDownloadModal(true);
             }
          }, 50);
      }
  };

  // Update preview when format changes
  useEffect(() => {
      if (showDownloadModal && canvasRef.current) {
          const mime = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvasRef.current.exportImage(mime, exportQuality);
          setFinalImagePreview(dataUrl);
      }
  }, [exportFormat, exportQuality, showDownloadModal]);

  const handleDownload = () => {
      if (!finalImagePreview) return;
      const safeFilename = exportFilename.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'meme-studio';
      
      if (exportFormat === 'jpeg') {
           if (canvasRef.current) {
               const jpgUrl = canvasRef.current.exportImage('image/jpeg', exportQuality);
               triggerDownload(jpgUrl, 'jpg', safeFilename);
           }
          return;
      }
      triggerDownload(finalImagePreview, 'png', safeFilename);
  };

  const triggerDownload = (url: string, ext: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleCopyClipboard = async () => {
      if (!canvasRef.current) return;
      try {
          const dataUrl = canvasRef.current.exportImage('image/png');
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob })
          ]);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
          console.error("Failed to copy", err);
      }
  };

  const activeLayer = layers.find(l => l.id === selectedId);

  if (view === 'AI_GENERATOR') {
      return <AiGenerator onSelect={handleImageSelect} onBack={() => setView('HOME')} initialPrompt={aiStartPrompt} />;
  }

  return (
    <div className="min-h-screen flex flex-col pt-6 pb-10 overflow-x-hidden bg-[#050505]">
      <Header />

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in-up">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowResetConfirmModal(false)}></div>
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
                <div className="flex items-center gap-3 text-neutral-200">
                    <AlertCircle className="w-6 h-6 text-indigo-500" />
                    <h3 className="font-bold text-lg">Reset all layers?</h3>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">
                    This will restore all positions, sizes, and styles to their default values. This action cannot be undone easily.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setShowResetConfirmModal(false)} className="text-neutral-400 hover:text-white">Cancel</Button>
                    <Button variant="primary" onClick={confirmResetAllLayers} className="bg-indigo-600 hover:bg-indigo-500 border-none text-white px-6">Confirm Reset</Button>
                </div>
            </div>
        </div>
      )}

      {/* Other Modals... */}
      {/* Magic Modal */}
      {showMagicModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowMagicModal(false)}></div>
            <div className="relative w-full md:max-w-md bg-neutral-900 border-t md:border border-neutral-800 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-neutral-800 rounded-lg"><Wand2 className="w-4 h-4 text-neutral-300" /></div>
                        <h3 className="text-sm font-semibold text-white">Magic Captions</h3>
                    </div>
                    <button onClick={() => setShowMagicModal(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar pb-10 md:pb-5">
                    {suggestedCaptions.length > 0 && !isAnalyzing && (
                        <div className="space-y-2">
                            {suggestedCaptions.map((cap, idx) => (
                                <button key={idx} onClick={() => { addText(cap); setShowMagicModal(false); }} className="w-full text-left p-3 text-sm text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-neutral-700 rounded-xl transition-all">"{cap}"</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black md:bg-transparent md:p-6 animate-fade-in-up">
              <div className="hidden md:block fixed inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowEditModal(false)}></div>
              <div className="relative w-full h-full md:h-[85vh] md:max-w-5xl bg-neutral-900 border-none md:border border-neutral-800 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-neutral-800 bg-neutral-950/50 shrink-0 safe-top">
                      <h3 className="text-base font-bold text-white">Generative Edit</h3>
                      <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      <div className="flex-1 p-4 md:p-6 flex flex-col bg-neutral-950/30 min-h-0">
                          <div className="flex-1 flex items-center justify-center relative min-h-0"><img src={image!} className="max-w-full max-h-full object-contain rounded-lg" alt="Original" /></div>
                      </div>
                      <div className="flex-1 p-4 md:p-6 flex flex-col bg-black/20 relative min-h-0">
                           <div className="flex-1 flex items-center justify-center relative min-h-0 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
                                {editError ? <p className="text-red-400 text-xs">{editError}</p> : 
                                isGeneratingEdit ? <div className="animate-spin w-8 h-8 border-2 border-white rounded-full"></div> :
                                generatedEditImage ? <img src={generatedEditImage} className="max-w-full max-h-full object-contain rounded-lg" /> : 
                                <p className="text-neutral-600">Enter prompt to generate</p>}
                           </div>
                      </div>
                  </div>
                  <div className="p-4 md:p-6 bg-neutral-950 border-t border-neutral-800 flex flex-col gap-4 shrink-0 safe-bottom">
                      <div className="flex gap-3">
                          <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Describe changes..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none" />
                          <Button variant="primary" onClick={handleRunAiEdit} disabled={!editPrompt.trim() || isGeneratingEdit}>Generate</Button>
                      </div>
                      {generatedEditImage && <Button variant="secondary" onClick={applyAiEdit} className="w-full">Apply Edit</Button>}
                  </div>
              </div>
          </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black md:bg-transparent md:p-6 animate-fade-in-up">
              <div className="hidden md:block fixed inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowFilterModal(false)}></div>
              <div className="relative w-full h-full md:h-[80vh] md:max-w-4xl bg-neutral-900 border-none md:border border-neutral-800 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-neutral-800 bg-neutral-950/50 safe-top">
                       <h3 className="text-base font-bold text-white">Filters</h3>
                       <button onClick={() => setShowFilterModal(false)} className="p-2"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 flex items-center justify-center bg-black">
                      <img src={image!} className="max-w-full max-h-full object-contain" style={{ filter: previewFilter }} alt="Preview" />
                  </div>
                  <div className="p-6 bg-neutral-950 border-t border-neutral-800 flex gap-3 overflow-x-auto safe-bottom">
                      {FILTERS.map((filter) => (
                          <button key={filter.name} onClick={() => setPreviewFilter(filter.value)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm border ${previewFilter === filter.value ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400'}`}>{filter.name}</button>
                      ))}
                      <Button variant="secondary" onClick={applyFilter}>Apply</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && finalImagePreview && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in-up">
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowDownloadModal(false)}></div>
              <div className="relative w-full md:max-w-5xl h-[90dvh] md:h-[80vh] bg-neutral-900 rounded-t-3xl md:rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
                  <button onClick={() => setShowDownloadModal(false)} className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white md:hidden"><X className="w-5 h-5" /></button>
                  
                  <div className="flex-1 bg-[#101010] flex items-center justify-center p-6 relative overflow-hidden min-h-0">
                       <img src={finalImagePreview} alt="Final Result" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                  </div>

                  <div className="w-full md:w-96 bg-neutral-950 border-t md:border-l border-neutral-800 flex flex-col shrink-0 p-6 gap-6 overflow-y-auto">
                      <div className="flex justify-between items-center"><h3 className="text-lg font-bold text-white">Export</h3><button onClick={() => setShowDownloadModal(false)} className="hidden md:block"><X className="w-5 h-5" /></button></div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-neutral-500 uppercase">File Name</label>
                              <input type="text" value={exportFilename} onChange={(e) => setExportFilename(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white mt-1" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-neutral-500 uppercase">Format</label>
                              <div className="grid grid-cols-2 gap-3 mt-1">
                                  {['png', 'jpeg'].map((fmt) => (
                                      <button key={fmt} onClick={() => setExportFormat(fmt as any)} className={`p-3 rounded-xl border text-sm font-bold uppercase ${exportFormat === fmt ? 'bg-neutral-800 border-white text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>{fmt}</button>
                                  ))}
                              </div>
                          </div>
                          {exportFormat === 'jpeg' && (
                              <div>
                                  <div className="flex justify-between text-xs mb-2"><span className="text-neutral-500 font-bold uppercase">Quality</span><span className="text-neutral-400">{Math.round(exportQuality * 100)}%</span></div>
                                  <input type="range" min="0.1" max="1" step="0.1" value={exportQuality} onChange={(e) => setExportQuality(parseFloat(e.target.value))} className="w-full accent-white" />
                              </div>
                          )}
                      </div>

                      <div className="mt-auto space-y-3">
                          <Button variant="primary" onClick={handleDownload} className="w-full justify-center py-4 bg-white text-black" icon={<Download className="w-5 h-5" />}>Download Image</Button>
                          <Button 
                            variant="secondary" 
                            onClick={handleCopyClipboard} 
                            className={`w-full justify-center py-3 transition-all duration-300 ${copySuccess ? 'bg-green-500/20 text-green-400 border-green-500/50' : ''}`} 
                            icon={copySuccess ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          >
                            {copySuccess ? "Copied!" : "Copy to Clipboard"}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Main Content */}
      {!image ? (
        <ImageUploader onImageSelect={handleImageSelect} onAiGenerateClick={handleNavigateToAi} />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden animate-fade-in-up">
          {/* Editor Canvas Area */}
          <div className="flex-1 flex flex-col relative bg-[#101010]">
             {/* Top Toolbar */}
             <div className="absolute top-4 left-0 right-0 z-30 flex justify-between px-4 pointer-events-none">
                 <div className="pointer-events-auto flex gap-2">
                     <button onClick={() => setView('HOME')} className="p-2 bg-black/50 backdrop-blur rounded-full text-white border border-white/10 hover:bg-white hover:text-black transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                     <div className="flex bg-black/50 backdrop-blur rounded-full border border-white/10 p-1">
                         <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"><Undo className="w-4 h-4" /></button>
                         <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"><Redo className="w-4 h-4" /></button>
                     </div>
                 </div>
                 <div className="pointer-events-auto flex gap-2">
                     <button onClick={() => setShowFilterModal(true)} className="px-4 py-2 bg-black/50 backdrop-blur rounded-full text-white border border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Palette className="w-4 h-4" /> Filters</button>
                     <button onClick={() => setShowEditModal(true)} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 backdrop-blur rounded-full border border-indigo-500/30 hover:bg-indigo-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Edit</button>
                 </div>
             </div>

             {/* Canvas */}
             <div className="flex-1 relative p-4 md:p-8 overflow-hidden flex items-center justify-center">
                 <MemeCanvas 
                    ref={canvasRef}
                    image={image} 
                    layers={layers} 
                    selectedId={selectedId}
                    filter={imageFilter}
                    onSelect={setSelectedId}
                    onUpdate={updateLayer}
                    onInteractionEnd={() => saveHistory(layers)}
                 />
             </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full md:w-80 bg-neutral-900 border-t md:border-t-0 md:border-l border-neutral-800 flex flex-col z-40 shrink-0 shadow-2xl">
              {/* Tabs */}
              <div className="flex border-b border-neutral-800">
                  <button onClick={() => setActiveTab(Tab.CAPTION)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.CAPTION ? 'text-white bg-neutral-800 border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}><FontIcon className="w-4 h-4" /> Text</button>
                  <button onClick={() => setActiveTab(Tab.STICKER)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.STICKER ? 'text-white bg-neutral-800 border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}><Smile className="w-4 h-4" /> Stickers</button>
                  <button onClick={() => setActiveTab(Tab.EDIT)} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.EDIT ? 'text-white bg-neutral-800 border-b-2 border-white' : 'text-neutral-500 hover:text-neutral-300'}`}><Monitor className="w-4 h-4" /> Edit</button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                  
                  {/* CAPTION TAB */}
                  {activeTab === Tab.CAPTION && (
                      <div className="space-y-6 animate-fade-in-up">
                          <div className="grid grid-cols-2 gap-3">
                              <Button onClick={() => addText()} className="w-full justify-center bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700" icon={<Plus className="w-4 h-4" />}>Add Text</Button>
                              <Button onClick={() => setShowMagicModal(true)} className="w-full justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none" icon={<Wand2 className="w-4 h-4" />}>AI Ideas</Button>
                          </div>

                          {activeLayer?.type === 'text' ? (
                              <div className="space-y-5 pt-4 border-t border-neutral-800">
                                  <div>
                                      <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Font Family</label>
                                      <div className="grid grid-cols-1 gap-2">
                                          {FONTS.map(font => (
                                              <button 
                                                key={font.name}
                                                onClick={() => updateLayer(activeLayer.id, { fontFamily: font.name })}
                                                className={`px-3 py-2 text-left rounded-lg border text-sm ${activeLayer.fontFamily === font.name ? 'bg-white text-black border-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
                                                style={{ fontFamily: font.name }}
                                              >
                                                  {font.label}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Alignment</label>
                                      <div className="flex bg-neutral-800 rounded-lg p-1">
                                          {(['left', 'center', 'right'] as const).map(align => (
                                              <button 
                                                key={align}
                                                onClick={() => updateLayer(activeLayer.id, { textAlign: align })}
                                                className={`flex-1 py-1.5 rounded-md flex justify-center ${activeLayer.textAlign === align ? 'bg-neutral-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
                                              >
                                                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block">Color</label>
                                      <div className="flex flex-wrap gap-2">
                                          {['#FFFFFF', '#000000', '#FF0000', '#FFFF00', '#00FF00', '#0000FF', '#FF00FF'].map(c => (
                                              <button 
                                                key={c}
                                                onClick={() => updateLayer(activeLayer.id, { color: c })}
                                                className={`w-8 h-8 rounded-full border-2 ${activeLayer.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                                style={{ backgroundColor: c }}
                                              />
                                          ))}
                                          <input 
                                            type="color" 
                                            value={activeLayer.color}
                                            onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })}
                                            className="w-8 h-8 rounded-full overflow-hidden opacity-0 absolute" 
                                            id="color-picker"
                                          />
                                          <label htmlFor="color-picker" className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 cursor-pointer border-2 border-neutral-700 flex items-center justify-center">
                                              <Plus className="w-3 h-3 text-white mix-blend-difference" />
                                          </label>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-center py-10 text-neutral-600 border border-dashed border-neutral-800 rounded-xl">
                                  <p className="text-sm">Select a text layer to edit style</p>
                              </div>
                          )}
                      </div>
                  )}

                  {/* STICKER TAB */}
                  {activeTab === Tab.STICKER && (
                      <div className="space-y-4 h-full flex flex-col animate-fade-in-up">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                              <input 
                                type="text" 
                                value={stickerSearch}
                                onChange={(e) => setStickerSearch(e.target.value)}
                                placeholder="Search GIPHY..."
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-neutral-500 outline-none"
                              />
                          </div>
                          
                          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                              {isLoadingStickers ? (
                                  <div className="grid grid-cols-3 gap-2">
                                      {[...Array(9)].map((_, i) => <div key={i} className="aspect-square bg-neutral-800 rounded-lg animate-pulse" />)}
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-3 gap-2">
                                      {stickerResults.map(sticker => (
                                          <button 
                                            key={sticker.id}
                                            onClick={() => addSticker(sticker.url)}
                                            className="aspect-square relative group overflow-hidden rounded-lg bg-neutral-800 hover:ring-2 ring-indigo-500 transition-all"
                                          >
                                              <img src={sticker.url} alt={sticker.title} className="w-full h-full object-cover" loading="lazy" />
                                          </button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

                  {/* EDIT TAB */}
                  {activeTab === Tab.EDIT && (
                      <div className="space-y-6 animate-fade-in-up">
                          {!activeLayer ? (
                               <div className="text-center py-10 text-neutral-500">
                                   <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                   <p className="text-sm">Select an object on the canvas</p>
                               </div>
                          ) : (
                              <>
                                  <div className="bg-neutral-800/50 rounded-xl p-4 space-y-4 border border-neutral-800">
                                      <div className="flex items-center justify-between">
                                          <span className="text-xs font-bold uppercase text-neutral-500">Layer Actions</span>
                                          <button onClick={() => removeLayer(activeLayer.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                                      </div>
                                      
                                      {/* SLIDERS with formatValue */}
                                      <div className="space-y-3">
                                          <div>
                                              <div className="flex justify-between mb-1">
                                                  <span className="text-xs text-neutral-400 flex items-center gap-1"><Move className="w-3 h-3" /> Position X</span>
                                                  <span className="text-[10px] font-mono text-neutral-500">{formatValue(activeLayer.x)}%</span>
                                              </div>
                                              <input type="range" min="0" max="100" step="0.1" value={activeLayer.x} onChange={(e) => updateLayer(activeLayer.id, { x: parseFloat(e.target.value) })} className="w-full accent-white h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                                          </div>
                                          
                                          <div>
                                              <div className="flex justify-between mb-1">
                                                  <span className="text-xs text-neutral-400 flex items-center gap-1"><Move className="w-3 h-3 rotate-90" /> Position Y</span>
                                                  <span className="text-[10px] font-mono text-neutral-500">{formatValue(activeLayer.y)}%</span>
                                              </div>
                                              <input type="range" min="0" max="100" step="0.1" value={activeLayer.y} onChange={(e) => updateLayer(activeLayer.id, { y: parseFloat(e.target.value) })} className="w-full accent-white h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                                          </div>

                                          <div>
                                              <div className="flex justify-between mb-1">
                                                  <span className="text-xs text-neutral-400 flex items-center gap-1"><RotateCw className="w-3 h-3" /> Rotation</span>
                                                  <span className="text-[10px] font-mono text-neutral-500">{formatValue((activeLayer.rotation * 180 / Math.PI) % 360)}°</span>
                                              </div>
                                              <input type="range" min="0" max="360" step="1" value={(activeLayer.rotation * 180 / Math.PI) % 360} onChange={(e) => updateLayer(activeLayer.id, { rotation: parseFloat(e.target.value) * Math.PI / 180 })} className="w-full accent-white h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                                          </div>

                                          <div>
                                              <div className="flex justify-between mb-1">
                                                  <span className="text-xs text-neutral-400 flex items-center gap-1"><Scaling className="w-3 h-3" /> Size</span>
                                                  <span className="text-[10px] font-mono text-neutral-500">{activeLayer.type === 'text' ? formatValue(activeLayer.fontSize) : formatValue(activeLayer.width)}</span>
                                              </div>
                                              {activeLayer.type === 'text' ? (
                                                   <input type="range" min="10" max="200" step="1" value={activeLayer.fontSize} onChange={(e) => updateLayer(activeLayer.id, { fontSize: parseFloat(e.target.value) })} className="w-full accent-white h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                                              ) : (
                                                   <input type="range" min="50" max="500" step="1" value={activeLayer.width} onChange={(e) => {
                                                       const ratio = activeLayer.height / activeLayer.width;
                                                       const w = parseFloat(e.target.value);
                                                       updateLayer(activeLayer.id, { width: w, height: w * ratio });
                                                   }} className="w-full accent-white h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </>
                          )}
                      </div>
                  )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-neutral-800 bg-neutral-950 space-y-3">
                   <div className="flex gap-2">
                        <button 
                            onClick={requestResetAllLayers} 
                            className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
                            title="Reset All Layers"
                        >
                            <RotateCcw className="w-4 h-4" /> Reset All
                        </button>
                        <Button variant="primary" onClick={handleOpenDownloadModal} className="flex-[2] justify-center bg-white text-black" icon={<Download className="w-4 h-4" />}>Download</Button>
                   </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
