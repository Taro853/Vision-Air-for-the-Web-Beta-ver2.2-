
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Slide, SlideElement } from '../types';
import { GridBackground } from './canvas/GridBackground';
import { SnapLinesLayer } from './canvas/SnapLinesLayer';
import { ElementRenderer } from './canvas/ElementRenderer';

interface CanvasProps {
  slide: Slide;
  selectedIds: string[];
  onSelect: (ids: string[] | string | null, isMulti?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement> | { style: Partial<SlideElement['style']> }) => void;
  onContextMenu: (e: React.MouseEvent, id: string | null, type: SlideElement['type'] | 'slide' | 'canvas') => void;
  scale?: number;
  readOnly?: boolean;
  currentStep?: number;
  showGrid?: boolean;
  projectWidth?: number;
  projectHeight?: number;
  isDrawing?: boolean;
  onDrawComplete?: (path: string) => void;
  onDoubleClick?: (e: React.MouseEvent, el: SlideElement) => void;
  processingElementIds?: string[];
  enableSelectionBox?: boolean;
}

interface SnapLine {
    orientation: 'vertical' | 'horizontal';
    position: number;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  slide, 
  selectedIds, 
  onSelect, 
  onUpdateElement,
  onContextMenu,
  scale = 1,
  readOnly = false,
  currentStep = 999,
  showGrid = false,
  projectWidth = 960,
  projectHeight = 540,
  isDrawing = false,
  onDrawComplete,
  onDoubleClick,
  processingElementIds = [],
  enableSelectionBox = true
}) => {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [selectionBox, setSelectionBox] = useState<{startX: number, startY: number, currentX: number, currentY: number} | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    type: 'dragging' | 'resizing' | 'rotating' | 'selection' | 'none';
    handle?: string;
    startX: number;
    startY: number;
    initialEls: { id: string, x: number, y: number, w: number, h: number, r: number }[];
  }>({ type: 'none', startX: 0, startY: 0, initialEls: [] });

  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const getRelativeCoords = useCallback((e: any) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      return {
          x: (clientX - rect.left) / scale,
          y: (clientY - rect.top) / scale
      };
  }, [scale]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, element: SlideElement) => {
    if (readOnly || isDrawing || element.locked) return;
    
    e.stopPropagation();
    if ('button' in e && (e as React.MouseEvent).button === 2) { 
        e.preventDefault();
        onSelect(element.id);
        onContextMenu(e as React.MouseEvent, element.id, element.type);
        return; 
    }
    
    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
    if (!selectedIds.includes(element.id)) {
        onSelect(element.id, isMulti);
    }

    const { x, y } = getRelativeCoords(e);
    const idsToDrag = isMulti || selectedIds.includes(element.id) ? (selectedIds.includes(element.id) ? selectedIds : [...selectedIds, element.id]) : [element.id];
    
    dragRef.current = { 
        type: 'dragging', 
        startX: x, 
        startY: y, 
        initialEls: slide.elements.filter(el => idsToDrag.includes(el.id)).map(el => ({
            id: el.id, x: el.x, y: el.y, w: el.width, h: el.height, r: el.rotation
        }))
    };
    setIsDraggingUI(true);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      if (readOnly) return;
      const { x, y } = getRelativeCoords(e);

      if (e.target === e.currentTarget) {
          onSelect(null);
          if (enableSelectionBox && !isDrawing) {
              dragRef.current = { type: 'selection', startX: x, startY: y, initialEls: [] };
              setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
          }
      }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
      if (dragRef.current.type === 'none') return;
      const { x: relX, y: relY } = getRelativeCoords(e);

      if (dragRef.current.type === 'dragging') {
          const dx = relX - dragRef.current.startX;
          const dy = relY - dragRef.current.startY;
          
          const newSnapLines: SnapLine[] = [];
          
          dragRef.current.initialEls.forEach(initial => {
              let nextX = initial.x + dx;
              let nextY = initial.y + dy;

              // スナップロジック (簡易実装: キャンバス端と中央)
              const snapDist = 5;
              const midX = projectWidth! / 2;
              const midY = projectHeight! / 2;

              if (Math.abs(nextX) < snapDist) { nextX = 0; newSnapLines.push({ orientation: 'vertical', position: 0 }); }
              if (Math.abs(nextX + initial.w - projectWidth!) < snapDist) { nextX = projectWidth! - initial.w; newSnapLines.push({ orientation: 'vertical', position: projectWidth! }); }
              if (Math.abs(nextX + initial.w/2 - midX) < snapDist) { nextX = midX - initial.w/2; newSnapLines.push({ orientation: 'vertical', position: midX }); }
              
              if (Math.abs(nextY) < snapDist) { nextY = 0; newSnapLines.push({ orientation: 'horizontal', position: 0 }); }
              if (Math.abs(nextY + initial.h - projectHeight!) < snapDist) { nextY = projectHeight! - initial.h; newSnapLines.push({ orientation: 'horizontal', position: projectHeight! }); }
              if (Math.abs(nextY + initial.h/2 - midY) < snapDist) { nextY = midY - initial.h/2; newSnapLines.push({ orientation: 'horizontal', position: midY }); }

              onUpdateElement(initial.id, { x: nextX, y: nextY });
          });
          setSnapLines(newSnapLines);

      } else if (dragRef.current.type === 'resizing' && dragRef.current.handle) {
          const h = dragRef.current.handle;
          const initial = dragRef.current.initialEls[0];
          const dx = relX - dragRef.current.startX;
          const dy = relY - dragRef.current.startY;
          
          let updates: any = {};
          if (h.includes('e')) updates.width = Math.max(5, initial.w + dx);
          if (h.includes('s')) updates.height = Math.max(5, initial.h + dy);
          if (h.includes('w')) { updates.x = initial.x + dx; updates.width = Math.max(5, initial.w - dx); }
          if (h.includes('n')) { updates.y = initial.y + dy; updates.height = Math.max(5, initial.h - dy); }
          
          onUpdateElement(initial.id, updates);
      } else if (dragRef.current.type === 'rotating') {
          const initial = dragRef.current.initialEls[0];
          const centerX = initial.x + initial.w / 2;
          const centerY = initial.y + initial.h / 2;
          const angle = Math.atan2(relY - centerY, relX - centerX) * (180 / Math.PI) + 90;
          onUpdateElement(initial.id, { rotation: angle });
      } else if (dragRef.current.type === 'selection') {
          setSelectionBox(prev => prev ? { ...prev, currentX: relX, currentY: relY } : null);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragRef.current.type === 'selection' && selectionBox) {
          const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
          const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
          const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
          const y2 = Math.max(selectionBox.startY, selectionBox.currentY);
          
          const ids = slide.elements.filter(el => 
              el.x < x2 && el.x + el.width > x1 && el.y < y2 && el.y + el.height > y1
          ).map(e => e.id);
          onSelect(ids);
      }
      dragRef.current = { type: 'none', startX: 0, startY: 0, initialEls: [] };
      setIsDraggingUI(false);
      setSelectionBox(null);
      setSnapLines([]);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove as any, { passive: false });
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove as any);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [scale, slide.elements, selectionBox, getRelativeCoords, projectWidth, projectHeight, onUpdateElement, onSelect]);

  const handleHandleMouseDown = (e: React.MouseEvent | React.TouchEvent, handle: string, element: SlideElement) => {
      if (readOnly || element.locked) return;
      e.stopPropagation();
      const { x, y } = getRelativeCoords(e);
      dragRef.current = {
          type: handle === 'rotate' ? 'rotating' : 'resizing',
          handle, startX: x, startY: y,
          initialEls: [{ id: element.id, x: element.x, y: element.y, w: element.width, h: element.height, r: element.rotation }]
      };
      setIsDraggingUI(true);
  };

  return (
    <div 
      ref={canvasRef}
      className="relative bg-white overflow-hidden shadow-lg select-none"
      style={{ 
          width: projectWidth, height: projectHeight, 
          backgroundColor: slide.background, backgroundImage: slide.backgroundGradient,
          cursor: isDraggingUI ? 'grabbing' : 'default',
          touchAction: 'none'
      }}
      onMouseDown={handleCanvasMouseDown}
      onTouchStart={handleCanvasMouseDown}
    >
        <GridBackground showGrid={showGrid} />
        <SnapLinesLayer lines={snapLines} />
        
        {slide.elements.map(el => (
            <ElementRenderer 
                key={el.id} el={el} readOnly={readOnly}
                isSelected={selectedIds.includes(el.id)}
                isEditing={el.id === editingTextId}
                isDragging={isDraggingUI} scale={scale} currentStep={currentStep}
                onMouseDown={handleMouseDown} onDoubleClick={(e, element) => {
                    if (element.type === 'text') setEditingTextId(element.id);
                    onDoubleClick?.(e, element);
                }}
                onUpdateElement={onUpdateElement} onHandleMouseDown={handleHandleMouseDown}
            />
        ))}

        {selectionBox && (
            <div className="absolute border border-brand-primary bg-brand-primary/10 pointer-events-none"
                 style={{
                     left: Math.min(selectionBox.startX, selectionBox.currentX),
                     top: Math.min(selectionBox.startY, selectionBox.currentY),
                     width: Math.abs(selectionBox.startX - selectionBox.currentX),
                     height: Math.abs(selectionBox.startY - selectionBox.currentY),
                     zIndex: 1000
                 }}
            />
        )}
    </div>
  );
};
