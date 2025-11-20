import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Upload, Search, Loader2, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from './Button';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  onAiGenerateClick: (initialPrompt: string) => void;
}

interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  source: 'imgflip' | 'memegen';
  width?: number;
  height?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, onAiGenerateClick }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Template Data State
  const [allTemplates, setAllTemplates] = useState<MemeTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Fetch & Merge APIs on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingTemplates(true);
      try {
        const [imgflipRes, memegenRes] = await Promise.allSettled([
          fetch('https://api.imgflip.com/get_memes').then(res => res.json()),
          fetch('https://api.memegen.link/templates').then(res => res.json())
        ]);

        let merged: MemeTemplate[] = [];

        if (imgflipRes.status === 'fulfilled' && imgflipRes.value.success) {
          imgflipRes.value.data.memes.forEach((m: any) => {
            merged.push({
              id: `if-${m.id}`,
              name: m.name,
              url: m.url,
              source: 'imgflip',
              width: m.width,
              height: m.height
            });
          });
        }

        if (memegenRes.status === 'fulfilled') {
           memegenRes.value.forEach((m: any) => {
             merged.push({
               id: `mg-${m.id}`,
               name: m.name,
               url: m.blank,
               source: 'memegen'
             });
           });
        }

        setAllTemplates(merged);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchData();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, [onImageSelect]);

  const fetchTemplate = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => onImageSelect(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Failed to load template", e);
      alert("Could not load this specific image due to browser restrictions. Try another or upload your own!");
    }
  };

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return allTemplates;
    const lowerQ = searchQuery.toLowerCase();
    return allTemplates.filter(t => t.name.toLowerCase().includes(lowerQ));
  }, [allTemplates, searchQuery]);

  const displayTemplates = filteredTemplates.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = displayTemplates.length < filteredTemplates.length;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up animate-delay-100">
      
      {/* Drag & Drop Area */}
      <div 
        className={`
          relative group overflow-hidden rounded-2xl transition-all duration-500 ease-out
          ${isDragging 
            ? 'bg-neutral-900 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.02]' 
            : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'}
          border-2 border-dashed h-[200px] flex flex-col items-center justify-center cursor-pointer mb-8
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="absolute inset-0 opacity-0 cursor-pointer z-20"
        />
        
        <div className={`
          p-3 rounded-2xl bg-neutral-800/50 mb-3 transition-transform duration-500
          ${isDragging ? 'scale-110 bg-indigo-500/10' : 'group-hover:scale-110'}
        `}>
          <Upload className={`w-6 h-6 ${isDragging ? 'text-indigo-400' : 'text-neutral-400 group-hover:text-white'} transition-colors`} />
        </div>
        
        <h3 className="text-base font-medium text-white mb-1">Upload Custom Image</h3>
        <p className="text-neutral-500 text-xs max-w-xs text-center">
          Drag & drop or click to browse
        </p>
      </div>

      {/* Search & Templates Section */}
      <div className="animate-fade-in-up animate-delay-200">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
             {searchQuery ? 'Search Results' : 'Trending Templates'}
             <span className="bg-neutral-800 text-neutral-500 py-0.5 px-2 rounded-full text-[10px]">
               {filteredTemplates.length}
             </span>
           </h3>
        </div>

        {/* Search Bar + AI Button */}
        <div className="flex gap-3 mb-6 z-10">
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    placeholder="Search 2000+ templates (e.g. 'drake', 'cat')..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 outline-none transition-all shadow-sm focus:bg-neutral-900/80"
                />
            </div>
            
            <Button 
                variant="secondary"
                onClick={() => onAiGenerateClick(searchQuery)}
                className="!bg-neutral-900 !border-neutral-800 !text-neutral-400 hover:!bg-neutral-800 hover:!text-neutral-200 hover:!border-neutral-700 transition-all px-4 shadow-md"
                title="Generate with AI"
            >
                <Sparkles className="w-5 h-5" />
            </Button>
        </div>

        {/* Standard Templates Grid */}
        {loadingTemplates ? (
            <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
                </div>
            </div>
        ) : (
            <>
                {displayTemplates.length === 0 ? (
                     <div className="text-center py-16 text-neutral-500 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/20">
                        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium">No templates found for "{searchQuery}"</p>
                        <button 
                            onClick={() => onAiGenerateClick(searchQuery)}
                            className="mt-4 text-neutral-300 hover:text-white text-xs underline underline-offset-2"
                        >
                            Generate it with AI instead?
                        </button>
                     </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {displayTemplates.map((t) => (
                                <button 
                                    key={t.id}
                                    onClick={() => fetchTemplate(t.url)}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-500 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                                >
                                    <img 
                                        src={t.url} 
                                        alt={t.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0" 
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-white text-[10px] font-medium truncate leading-tight">{t.name}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center pt-4 pb-8">
                                <Button 
                                    variant="secondary" 
                                    onClick={() => setPage(p => p + 1)}
                                    className="group !bg-neutral-900 hover:!bg-neutral-800 border-neutral-800"
                                >
                                    Load More Templates
                                    <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};
