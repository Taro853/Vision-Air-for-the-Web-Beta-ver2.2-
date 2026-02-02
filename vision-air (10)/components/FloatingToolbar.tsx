import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Underline, Copy, Layers, Trash2, AlignLeft, AlignCenter, AlignRight, Highlighter, Palette, Wand2, X, Plus, Minus, Lock, Unlock, ArrowUp, ArrowDown, Type, ArrowDownToLine } from 'lucide-react';
import { SlideElement } from '../types';
import { completeText } from '../services/geminiService';
import { FONT_COLLECTION } from '../data/fonts';

interface FloatingToolbarProps {
  element: SlideElement;
  zoom: number;
  onUpdate: (id: string, updates: any) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLayerChange: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  readOnly?: boolean; // New prop
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ 
  element, zoom, onUpdate, onDuplicate, onDelete, onLayerChange, readOnly = false
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const aiBtnRef = useRef<HTMLButtonElement>(null);
  const fontBtnRef = useRef<HTMLButtonElement>(null);

  const [isCompleting, setIsCompleting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAiOptions, setShowAiOptions] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [selectionState, setSelectionState] = useState({
      bold: false, italic: false, underline: false, 
      align: 'left'
  });
  const [style, setStyle] = useState<React.CSSProperties>({ display: 'none' });

  useLayoutEffect(() => {
    if (!element || !toolbarRef.current) return;

    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    const padding = 16;
    
    // Position calculations
    let top = element.y - (toolbarRect.height / zoom) - padding;
    let left = element.x + (element.width / 2) - (toolbarRect.width / 2 / zoom);

    // Prevent top overflow
    if (top < 0) {
        top = element.y + element.height + padding;
    }
    
    // Prevent left overflow
    if (left < 0) left = 0;
    
    setStyle({
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: `scale(${1/zoom})`,
        transformOrigin: top > element.y ? 'top center' : 'bottom center',
    });
  }, [element.x, element.y, element.height, element.width, element.id, zoom, showColorPicker, showAiOptions, element.style]);

  useEffect(() => {
      const checkSelection = () => {
          setSelectionState({
              bold: document.queryCommandState('bold'),
              italic: document.queryCommandState('italic'),
              underline: document.queryCommandState('underline'),
              align: document.queryCommandState('justifyCenter') ? 'center' : document.queryCommandState('justifyRight') ? 'right' : 'left'
          });
      };
      document.addEventListener('selectionchange', checkSelection);
      return () => document.removeEventListener('selectionchange', checkSelection);
  }, []);

  if (!element || readOnly) return null; // Hide if readOnly

  const exec = (command: string, value?: string) => {
      if (readOnly) { alert("閲覧モードでは編集できません。"); return; }
      // Check if there is a partial selection in the active element
      const sel = window.getSelection();
      const hasPartialSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.toString().length > 0;

      document.execCommand(command, false, value);
      
      if (hasPartialSelection && element.type === 'text') {
          return; 
      }

      if(command === 'bold') onUpdate(element.id, { style: { fontWeight: element.style.fontWeight === 'bold' ? 'normal' : 'bold' } });
      if(command === 'italic') onUpdate(element.id, { style: { fontStyle: element.style.fontStyle === 'italic' ? 'normal' : 'italic' } });
      if(command === 'underline') {
          const hasUl = element.style.textDecoration?.includes('underline');
          onUpdate(element.id, { style: { textDecoration: hasUl ? element.style.textDecoration?.replace('underline','') : (element.style.textDecoration || '') + ' underline' } });
      }
      if(command === 'justifyLeft') onUpdate(element.id, { style: { textAlign: 'left' } });
      if(command === 'justifyCenter') onUpdate(element.id, { style: { textAlign: 'center' } });
      if(command === 'justifyRight') onUpdate(element.id, { style: { textAlign: 'right' } });
      if(command === 'foreColor') onUpdate(element.id, { style: { color: value } });
  };

  const changeFontSize = (delta: number) => {
      if (readOnly) { alert("閲覧モードではフォントサイズを変更できません。"); return; }
      const current = element.style.fontSize || 16;
      onUpdate(element.id, { style: { fontSize: Math.max(8, current + delta) } });
  };

  const toggleVertical = () => {
      if (readOnly) { alert("閲覧モードでは縦書きを切り替えできません。"); return; }
      onUpdate(element.id, { style: { writingMode: element.style.writingMode === 'vertical-rl' ? 'horizontal-tb' : 'vertical-rl' } });
  };

  const handleAIComplete = async (instruction?: string) => {
      if (readOnly) { alert("閲覧モードではAIアシストを使用できません。"); return; }
      if (element.type !== 'text' || !element.content) return;
      setIsCompleting(true);
      setShowAiOptions(false);
      
      const div = document.createElement('div');
      div.innerHTML = element.content;
      const plainText = div.innerText;
      
      const promptText = instruction ? `${plainText} (Instruction: ${instruction})` : plainText;
      const addedText = await completeText(promptText);
      
      if (addedText) {
          exec('insertText', addedText);
          onUpdate(element.id, { content: element.content + addedText });
      }
      setIsCompleting(false);
  };

  const btnClass = (active: boolean) => 
      `p-2 rounded-lg transition-colors relative group flex items-center justify-center ${active ? 'bg-orange-100 text-brand-primary shadow-inner' : 'hover:bg-slate-100 text-slate-600'}`;

  const onBtnClick = (fn: () => void) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!readOnly) fn(); // Ensure function is only called if not readOnly
  };

  const getPopupStyle = (ref: React.RefObject<HTMLElement | null>) => {
      if (!ref.current) return {};
      const rect = ref.current.getBoundingClientRect();
      return { top: rect.bottom + 10, left: rect.left };
  };

  const currentFontName = FONT_COLLECTION.find(f => f.value === element.style.fontFamily)?.name || 'Font';
  const fontSize = element.style.fontSize || 16;

  return (
    <>
    <div 
        ref={toolbarRef}
        style={style}
        onMouseDown={(e) => e.stopPropagation()} 
        className="pointer-events-none"
    >
        {/* Main Toolbar */}
        <div className="glass-panel items-center gap-0.5 rounded-xl px-2 py-1.5 animate-in fade-in zoom-in-95 duration-200 select-none flex shadow-floating border-white/50 backdrop-blur-md bg-white/95 pointer-events-auto">
            {/* Font Family */}
            {element.type === 'text' && (
                <>
                    <button ref={fontBtnRef} onMouseDown={onBtnClick(() => setShowFontPicker(!showFontPicker))} className="px-2 py-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-xs font-bold text-slate-700 max-w-[100px] truncate" title="フォント変更" disabled={readOnly}>
                        {currentFontName.split(' ')[0]}
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                </>
            )}

            {/* Font Size */}
            {element.type === 'text' && (
                <>
                    <button onMouseDown={onBtnClick(() => changeFontSize(-2))} className={btnClass(false)} title="縮小" disabled={readOnly}><Minus size={14}/></button>
                    <span className="text-[10px] font-bold w-6 text-center text-slate-600">{fontSize}</span>
                    <button onMouseDown={onBtnClick(() => changeFontSize(2))} className={btnClass(false)} title="拡大" disabled={readOnly}><Plus size={14}/></button>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                </>
            )}

            {/* Text Style */}
            {element.type === 'text' && (
                <>
                    <button onMouseDown={onBtnClick(() => exec('bold'))} className={btnClass(selectionState.bold)} title="太字" disabled={readOnly}><Bold size={16}/></button>
                    <button onMouseDown={onBtnClick(() => exec('italic'))} className={btnClass(selectionState.italic)} title="斜体" disabled={readOnly}><Italic size={16}/></button>
                    <button onMouseDown={onBtnClick(toggleVertical)} className={btnClass(element.style.writingMode === 'vertical-rl')} title="縦書き" disabled={readOnly}><ArrowDownToLine size={16}/></button>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                </>
            )}

            {/* Color */}
            <div className="relative group">
                <button ref={colorBtnRef} onMouseDown={onBtnClick(() => setShowColorPicker(!showColorPicker))} className={btnClass(showColorPicker)} title="色変更" disabled={readOnly}>
                    <Palette size={16}/>
                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-brand-primary ring-1 ring-white"></div>
                </button>
            </div>

            <div className="w-px h-5 bg-slate-200 mx-1"></div>

            {/* Layers & Lock */}
            <button onMouseDown={onBtnClick(() => onLayerChange('front'))} className={btnClass(false)} title="前面へ" disabled={readOnly}><ArrowUp size={16}/></button>
            <button onMouseDown={onBtnClick(() => onLayerChange('back'))} className={btnClass(false)} title="背面へ" disabled={readOnly}><ArrowDown size={16}/></button>
            
            <button onMouseDown={onBtnClick(() => onUpdate(element.id, { locked: !element.locked }))} className={btnClass(!!element.locked)} title="ロック" disabled={readOnly}>
                {element.locked ? <Lock size={14} className="text-orange-500"/> : <Unlock size={14}/>}
            </button>
            <button onMouseDown={onBtnClick(onDuplicate)} className={btnClass(false)} title="複製" disabled={readOnly}><Copy size={14}/></button>
            <button onMouseDown={onBtnClick(onDelete)} className={`p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors hover:shadow-sm`} title="削除" disabled={readOnly}><Trash2 size={14}/></button>

            {/* AI */}
            {element.type === 'text' && (
                <>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                    <button 
                        ref={aiBtnRef}
                        onMouseDown={onBtnClick(() => setShowAiOptions(!showAiOptions))} 
                        className={`p-2 rounded-lg transition-all flex items-center gap-1 ${isCompleting ? 'bg-purple-100 text-purple-600 animate-pulse' : 'hover:bg-purple-50 text-purple-600 hover:shadow-sm'}`} 
                        title="AI続きを書く"
                        disabled={readOnly}
                    >
                        <Wand2 size={16}/>
                    </button>
                </>
            )}
        </div>
    </div>

    {/* Font Picker Portal */}
    {showFontPicker && createPortal(
        <>
            <div className="fixed inset-0 z-[1001]" onClick={() => setShowFontPicker(false)}></div>
            <div 
                className="fixed bg-white border border-slate-200 shadow-xl rounded-xl w-48 max-h-64 overflow-y-auto z-[1002] animate-in fade-in zoom-in-95 custom-scrollbar"
                style={getPopupStyle(fontBtnRef)}
            >
                {FONT_COLLECTION.map(font => (
                    <button 
                        key={font.name}
                        onMouseDown={onBtnClick(() => { onUpdate(element.id, { style: { fontFamily: font.value } }); setShowFontPicker(false); })}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 block truncate"
                        