
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { MemeLayer, MemeText, MemeSticker } from '../types';
import { RotateCw, Move, Maximize, Scaling } from 'lucide-react';

interface MemeCanvasProps {
  image: string;
  layers: MemeLayer[];
  selectedId: string | null;
  filter: string;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<MemeLayer>) => void;
  onInteractionEnd: () => void;
}

export interface MemeCanvasHandle {
  exportImage: (mimeType?: string, quality?: number) => string;
  getDimensions: () => { width: number, height: number };
}

type InteractionMode = 'NONE' | 'DRAGGING' | 'ROTATING' | 'RESIZING' | 'RESIZING_BOX' | 'PINCHING';

export const MemeCanvas = forwardRef<MemeCanvasHandle, MemeCanvasProps>(({ 
  image, 
  layers,
  selectedId, 
  filter = 'none',
  onSelect, 
  onUpdate,
  onInteractionEnd 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  
  // Image Cache & Status Tracking
  const stickerCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const stickerStatus = useRef<Map<string, 'loading' | 'loaded' | 'error'>>(new Map());

  // Interaction State
  const [mode, setMode] = useState<InteractionMode>('NONE');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // Store initial values for smooth calculations
  const [initialDragData, setInitialDragData] = useState<{
    fontSize?: number;
    rotation?: number;
    distance?: number;
    angle?: number;
    boxWidth?: number;
    width?: number;
    height?: number;
    layer?: MemeLayer;
    startX?: number;
    startY?: number;
  }>({});

  // Expose export method to parent
  useImperativeHandle(ref, () => ({
    exportImage: (mimeType = 'image/png', quality = 1.0) => {
      if (!canvasRef.current) return '';
      // Force a sync redraw to ensure latest state (filters etc) is captured
      drawCanvas();
      return canvasRef.current.toDataURL(mimeType, quality);
    },
    getDimensions: () => {
        if (!canvasRef.current) return { width: 0, height: 0 };
        return { width: canvasRef.current.width, height: canvasRef.current.height };
    }
  }));

  // Load main image
  useEffect(() => {
    if (!image) {
        setImgElement(null);
        return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => setImgElement(img);
    img.onerror = () => {
        console.error("Failed to load background image");
        // Fallback for some data URIs or local issues
        img.crossOrigin = "";
        img.src = image;
    };
  }, [image]);

  // Load sticker images with optimization
  useEffect(() => {
    let needsRedraw = false;
    
    layers.forEach(layer => {
        if (layer.type === 'sticker') {
            const url = layer.url;
            
            if (stickerCache.current.has(url)) {
                return;
            }
            
            if (!stickerStatus.current.has(url) || stickerStatus.current.get(url) === 'error') {
                stickerStatus.current.set(url, 'loading');
                needsRedraw = true;

                const img = new Image();
                img.crossOrigin = "anonymous";
                
                img.onload = () => {
                    stickerCache.current.set(url, img);
                    stickerStatus.current.set(url, 'loaded');
                    drawCanvas();
                };
                
                img.onerror = () => {
                    console.error(`Failed to load sticker: ${url}`);
                    stickerStatus.current.set(url, 'error');
                    drawCanvas(); 
                };
                
                img.src = url;
            }
        }
    });

    if (needsRedraw) {
        drawCanvas();
    }
  }, [layers]); 

  // --- Helper Functions ---

  const getEffectiveSize = (value: number, canvasWidth: number) => {
    const REFERENCE_WIDTH = 600; 
    return value * (canvasWidth / REFERENCE_WIDTH);
  };

  const getWrappedLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const paragraphs = text.split('\n');
    const wrappedLines: string[] = [];

    paragraphs.forEach(paragraph => {
        if (paragraph === '') {
            wrappedLines.push('');
            return;
        }

        const words = paragraph.split(' ');
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth) {
                wrappedLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        wrappedLines.push(currentLine);
    });

    return wrappedLines;
  };

  const getTextMetrics = (ctx: CanvasRenderingContext2D, text: MemeText, canvasWidth: number) => {
    const fontSize = getEffectiveSize(text.fontSize, canvasWidth);
    ctx.font = `700 ${fontSize}px ${text.fontFamily}`;
    const lineHeight = fontSize * 1.2;
    
    const scaledBoxWidth = getEffectiveSize(text.boxWidth || 500, canvasWidth);
    const maxWidth = Math.max(scaledBoxWidth, fontSize); 
    
    const lines = getWrappedLines(ctx, text.content, maxWidth);
    const totalHeight = lines.length * lineHeight;
    
    return { 
        width: maxWidth,
        contentWidth: Math.max(...lines.map(l => ctx.measureText(l).width)),
        height: totalHeight, 
        lines, 
        lineHeight 
    };
  };

  const transformToLocal = (x: number, y: number, cx: number, cy: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: dx * cos + dy * sin, // Inverse rotation
      y: -dx * sin + dy * cos
    };
  };

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else if ('clientX' in e) {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    } else {
        return { x: 0, y: 0 };
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, width: number, height: number, showRotate: boolean, showWidthHandle: boolean) => {
    const padding = 12;
    const halfW = width / 2 + padding;
    const halfH = height / 2 + padding;

    // Box
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(-halfW, -halfH, halfW * 2, halfH * 2);
    ctx.setLineDash([]);

    // Handles
    const handleSize = 18; // Larger handles for mobile touch
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;

    const drawHandle = (x: number, y: number) => {
        ctx.beginPath();
        ctx.arc(x, y, handleSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    };

    // Resize Handle (Bottom Right)
    drawHandle(halfW, halfH);

    // Rotate Handle (Top Center - extended)
    if (showRotate) {
        ctx.beginPath();
        ctx.moveTo(0, -halfH);
        ctx.lineTo(0, -halfH - 35);
        ctx.stroke();
        drawHandle(0, -halfH - 35);
    }

    // Width Handle (Right Center - only for text)
    if (showWidthHandle) {
         ctx.fillStyle = '#f97316'; // orange-500
         ctx.strokeStyle = '#ffffff';
         
         // Draw rounded pill for handle
         const hw = 6;  // half width of handle
         const hh = 16; // half height of handle
         const x = halfW - hw;
         const y = -hh;
         const w = hw * 2;
         const h = hh * 2;
         const r = 5;

         ctx.beginPath();
         ctx.roundRect(x, y, w, h, r);
         ctx.fill();
         ctx.stroke();
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return; 
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Background sizing
    let bgWidth = 800;
    let bgHeight = 800;

    if (imgElement) {
        bgWidth = imgElement.width;
        bgHeight = imgElement.height;
    }

    const containerWidth = container.clientWidth;
    // Ensure reasonable minimum scale
    const scale = bgWidth > 0 ? containerWidth / bgWidth : 1;
    
    const targetW = Math.floor(bgWidth * scale);
    const targetH = Math.floor(bgHeight * scale);

    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW || 300;
        canvas.height = targetH || 300;
    }

    // Clear and Reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'none'; // Critical reset before we start
    
    // 1. Draw Background Image with Filter
    ctx.save();
    
    // Apply filter specifically to the context before drawing the background image
    if (filter && filter !== 'none') {
        ctx.filter = filter;
    }
    
    if (imgElement) {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#171717';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#404040';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.filter = 'none'; 
        ctx.fillText('Loading Image...', canvas.width/2, canvas.height/2);
    }
    ctx.restore();
    
    // CRITICAL: Reset filter for subsequent layers so they aren't affected
    ctx.filter = 'none';

    // 2. Draw Layers
    layers.forEach(layer => {
        ctx.save();
        const x = (layer.x / 100) * canvas.width;
        const y = (layer.y / 100) * canvas.height;
        
        ctx.translate(x, y);
        ctx.rotate(layer.rotation);

        let width = 0;
        let height = 0;
        let showWidthHandle = false;

        if (layer.type === 'sticker') {
            const url = layer.url;
            const img = stickerCache.current.get(url);

            width = getEffectiveSize(layer.width, canvas.width);
            height = getEffectiveSize(layer.height, canvas.width);

            if (img) {
                ctx.drawImage(img, -width/2, -height/2, width, height);
            } else {
                const status = stickerStatus.current.get(url);
                if (status === 'loading') {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.fillRect(-width/2, -height/2, width, height);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(-width/2, -height/2, width, height);
                } else if (status === 'error') {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                    ctx.fillRect(-width/2, -height/2, width, height);
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-width/2, -height/2, width, height);
                    ctx.fillStyle = '#ef4444';
                    ctx.font = `bold ${Math.max(14, width/2)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('!', 0, 0);
                }
            }

        } else if (layer.type === 'text') {
            const fontSize = getEffectiveSize(layer.fontSize, canvas.width);
            ctx.font = `700 ${fontSize}px ${layer.fontFamily}`;
            ctx.fillStyle = layer.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = Math.max(3, fontSize / 12); // Slightly thicker stroke
            ctx.lineJoin = 'round';
            ctx.textAlign = layer.textAlign;
            ctx.textBaseline = 'middle';

            const metrics = getTextMetrics(ctx, layer, canvas.width);
            width = metrics.width;
            height = metrics.height;
            showWidthHandle = true;
            
            const startY = -(height / 2) + (metrics.lineHeight / 2);
            
            metrics.lines.forEach((line, i) => {
                const lineY = startY + (i * metrics.lineHeight);
                let drawX = 0;
                if (layer.textAlign === 'left') drawX = -width / 2;
                else if (layer.textAlign === 'right') drawX = width / 2;
                else drawX = 0; 
                
                ctx.strokeText(line, drawX, lineY);
                ctx.fillText(line, drawX, lineY);
            });
        }

        // Selection Box
        if (layer.id === selectedId) {
             drawSelectionBox(ctx, width, height, true, showWidthHandle);
        }

        ctx.restore();
    });

  }, [imgElement, layers, selectedId, filter]);

  // Redraw when dependent props change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle Interaction Logic
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const pos = getPointerPos(e);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let hitFound = false;

    // Check handles of currently selected layer first
    if (selectedId) {
        const layer = layers.find(l => l.id === selectedId);
        if (layer) {
            const cx = (layer.x / 100) * canvasRef.current.width;
            const cy = (layer.y / 100) * canvasRef.current.height;
            const local = transformToLocal(pos.x, pos.y, cx, cy, layer.rotation);
            
            // Re-calculate dimensions for hit testing
            let w = 0, h = 0;
            if (layer.type === 'sticker') {
                w = getEffectiveSize(layer.width, canvasRef.current.width);
                h = getEffectiveSize(layer.height, canvasRef.current.width);
            } else {
                const m = getTextMetrics(ctx, layer, canvasRef.current.width);
                w = m.width;
                h = m.height;
            }

            const padding = 12;
            const halfW = w/2 + padding;
            const halfH = h/2 + padding;
            const handleHitSize = 35; // Easy hit target for mobile

            // Check Rotate Handle (Top)
            const rotateY = -halfH - 35;
            if (Math.abs(local.x) < handleHitSize && Math.abs(local.y - rotateY) < handleHitSize) {
                setMode('ROTATING');
                setStartPos(pos);
                setInitialDragData({ rotation: layer.rotation, angle: Math.atan2(pos.y - cy, pos.x - cx) });
                hitFound = true;
            }

            // Check Resize Handle (Bottom Right)
            if (!hitFound && Math.abs(local.x - halfW) < handleHitSize && Math.abs(local.y - halfH) < handleHitSize) {
                setMode('RESIZING');
                setStartPos(pos);
                const dist = Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
                setInitialDragData({ 
                    width: layer.type === 'sticker' ? layer.width : undefined,
                    height: layer.type === 'sticker' ? layer.height : undefined,
                    fontSize: layer.type === 'text' ? layer.fontSize : undefined,
                    boxWidth: layer.type === 'text' ? layer.boxWidth : undefined,
                    distance: dist
                });
                hitFound = true;
            }

            // Check Text Width Handle (Right Edge)
            if (!hitFound && layer.type === 'text' && Math.abs(local.x - halfW) < handleHitSize && Math.abs(local.y) < halfH) {
                setMode('RESIZING_BOX');
                setStartPos(pos);
                setInitialDragData({ boxWidth: layer.boxWidth });
                hitFound = true;
            }
        }
    }

    if (!hitFound) {
        // Hit testing for layers (reverse order)
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            const cx = (layer.x / 100) * canvasRef.current.width;
            const cy = (layer.y / 100) * canvasRef.current.height;
            const local = transformToLocal(pos.x, pos.y, cx, cy, layer.rotation);
            
            let w = 0, h = 0;
            if (layer.type === 'sticker') {
                w = getEffectiveSize(layer.width, canvasRef.current.width);
                h = getEffectiveSize(layer.height, canvasRef.current.width);
            } else {
                const m = getTextMetrics(ctx, layer, canvasRef.current.width);
                w = m.width;
                h = m.height;
            }
            
            // Simple AABB in local space
            if (Math.abs(local.x) <= w/2 + 15 && Math.abs(local.y) <= h/2 + 15) {
                onSelect(layer.id);
                setMode('DRAGGING');
                setStartPos(pos);
                setInitialDragData({ startX: layer.x, startY: layer.y, layer: layer });
                hitFound = true;
                break;
            }
        }
    }

    if (hitFound) {
        // CRITICAL: Block scrolling ONLY if we hit a layer/handle
        if (e.cancelable) {
            e.preventDefault();
            e.stopPropagation();
        }
    } else {
        // Clicked background - allow scroll, but deselect
        onSelect(null);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode === 'NONE' || !selectedId || !canvasRef.current) return;
    const pos = getPointerPos(e);
    const layer = layers.find(l => l.id === selectedId);
    if (!layer) return;

    // Prevent scrolling while interacting
    if (e.cancelable) e.preventDefault();

    if (mode === 'DRAGGING') {
        const dx = ((pos.x - startPos.x) / canvasRef.current.width) * 100;
        const dy = ((pos.y - startPos.y) / canvasRef.current.height) * 100;
        
        onUpdate(selectedId, {
            x: (initialDragData.startX || 0) + dx,
            y: (initialDragData.startY || 0) + dy
        });
    } else if (mode === 'ROTATING') {
        const cx = (layer.x / 100) * canvasRef.current.width;
        const cy = (layer.y / 100) * canvasRef.current.height;
        const currentAngle = Math.atan2(pos.y - cy, pos.x - cx);
        const startAngle = initialDragData.angle || 0;
        const startRotation = initialDragData.rotation || 0;
        
        onUpdate(selectedId, {
            rotation: startRotation + (currentAngle - startAngle)
        });
    } else if (mode === 'RESIZING') {
        const cx = (layer.x / 100) * canvasRef.current.width;
        const cy = (layer.y / 100) * canvasRef.current.height;
        const currentDist = Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
        const startDist = initialDragData.distance || 1;
        const scaleRatio = currentDist / startDist;

        if (layer.type === 'sticker') {
            const startW = initialDragData.width || 200;
            const startH = initialDragData.height || 200;
            onUpdate(selectedId, { 
                width: Math.max(50, startW * scaleRatio),
                height: Math.max(50, startH * scaleRatio)
            });
        } else {
            const startFS = initialDragData.fontSize || 40;
            const startBoxW = initialDragData.boxWidth || 400;
            const newScale = scaleRatio;
            
            onUpdate(selectedId, { 
                fontSize: Math.max(10, startFS * newScale),
                boxWidth: Math.max(50, startBoxW * newScale)
            });
        }
    } else if (mode === 'RESIZING_BOX' && layer.type === 'text') {
        const cx = (layer.x / 100) * canvasRef.current.width;
        const cy = (layer.y / 100) * canvasRef.current.height;
        const local = transformToLocal(pos.x, pos.y, cx, cy, layer.rotation);
        const REFERENCE_WIDTH = 600;
        const scaleFactor = REFERENCE_WIDTH / canvasRef.current.width;
        const newBoxWidth = (Math.abs(local.x) * 2) * scaleFactor;
        
        onUpdate(selectedId, { boxWidth: Math.max(100, newBoxWidth) });
    }
  };

  const handlePointerUp = () => {
    if (mode !== 'NONE') {
        setMode('NONE');
        onInteractionEnd();
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
       {/* touchAction: 'manipulation' allows scrolling/zooming on the element, 
           but we selectively preventDefault in handlePointerDown when hitting a layer */}
       <canvas 
         ref={canvasRef}
         onMouseDown={handlePointerDown}
         onMouseMove={handlePointerMove}
         onMouseUp={handlePointerUp}
         onMouseLeave={handlePointerUp}
         onTouchStart={handlePointerDown}
         onTouchMove={handlePointerMove}
         onTouchEnd={handlePointerUp}
         className="max-w-full max-h-full shadow-2xl"
         style={{ touchAction: 'manipulation' }}
       />
    </div>
  );
});

MemeCanvas.displayName = 'MemeCanvas';
