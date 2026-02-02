
import React, { useEffect, useRef, useState } from 'react';
import { Copy, Trash2, Layers, BringToFront, AlignLeft, AlignCenter, AlignRight, Lock, ClipboardPaste, FilePlus, Maximize, Bot, LockOpen, Group, Paintbrush, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, Scissors, Palette, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Bold, Italic, Minus, Plus, Type, MoreHorizontal, Ungroup, EyeOff, Layout, RefreshCw, ZoomIn, ZoomOut, Grid, Home, RefreshCcw, Table, PlusSquare, MinusSquare, Crop, Replace, ArrowDownToLine, Ruler, Lightbulb, Type as TextIcon, MessageSquare, MonitorPlay, Save, Globe } from 'lucide-react';
import { SlideElement } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  type: SlideElement['type'] | 'slide' | 'canvas';
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringFront: () => void;
  onSendBack: () => void;
  onLock: () => void;
  onAlign: (align: any) => void;
  onPaste: () => void;
  onNewSlide: () => void;
  onSelectAll: () => void;
  onAskVisiot?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onCopyStyle?: () => void;
  onPasteStyle?: () => void;
  onResetStyle?: () => void;
  onSaveImage?: () => void;
  onForward?: () => void;
  onBackward?: () => void;
  onGroup?: () => void;
  onFontSizeChange?: (delta: number) => void;
  onBold?: () => void;
  onItalic?: () => void;
  onVerticalText?: () => void;
  onGoHome?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onToggleGrid?: () => void;
  onToggleRuler?: () => void;
  showGrid?: boolean;
  showRuler?: boolean;
  onTableAction?: (action: 'addRow' | 'addCol' | 'removeRow' | 'removeCol') => void;
  onImageAction?: (action: 'replace' | 'placeholder' | 'generate') => void;
  onDesignIdeas?: () => void;
  element?: SlideElement;
}

const Section = ({ children, label }: { children?: React.ReactNode, label?: string }) => (
    <div className="p-1 border-b border-slate-100 last:border-0 mb-1 last:mb-0">
        {label && <div className="text-[9px] text-slate-400 font-bold px-2 py-1 uppercase">{label}</div>}
        {children}
    </div>
);

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, y, type, element,
  onClose, onDuplicate, onDelete, onBringFront, onSendBack, onLock, onAlign,
  onPaste, onNewSlide, onSelectAll, onAskVisiot, onCopy, onCut, 
  onCopyStyle, onPasteStyle, onResetStyle, onSaveImage, onForward, onBackward, onGroup,
  onFontSizeChange, onBold, onItalic, onVerticalText, onGoHome, onZoomIn, onZoomOut, onToggleGrid, onToggleRuler, showGrid, showRuler,
  onTableAction, onImageAction, onDesignIdeas
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const CMD = IS_MAC ? 'Cmd' : 'Ctrl';

  useEffect(() => {
     if (menuRef.current) {
         const rect = menuRef.current.getBoundingClientRect();
         let newX = x;
         let newY = y;
         // Prevent menu from going off-screen
         if (x + rect.width > window.innerWidth) newX = window.innerWidth - rect.width - 20;
         if (y + rect.height > window.innerHeight) newY = window.innerHeight - rect.height - 20;
         // Prevent negative coordinates
         setPos({ x: Math.max(10, newX), y: Math.max(10, newY) });
     }
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { onClose(); }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose, true);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        window.removeEventListener('scroll', onClose, true);
        window.removeEventListener('resize', onClose, true);
    };
  }, [onClose]);

  const MenuItem = ({ icon, text, onClick, kbd, destructive, highlight }: any) => (
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); onClose(); }} 
        className={`
            w-full px-2 py-1.5 rounded text-left flex items-center justify-between group transition-all duration-200 text-xs
            ${destructive ? 'text-red-500 hover:bg-red-50' : highlight ? 'bg-gradient-to-r from-purple-50 to-orange-50 text-slate-800 hover:shadow-sm' : 'text-slate-700 hover:bg-slate-100'}
        `}
      >
         <div className="flex items-center gap-2.5">
             {React.cloneElement(icon, { size: 14, className: highlight ? 'text-purple-500' : destructive ? 'text-red-500' : 'text-slate-500' })} 
             <span className={`font-medium ${highlight ? 'font-bold' : ''}`}>{text}</span>
         </div>
         {kbd && <span className={`text-[9px] font-mono opacity-50 px-1 py-0.5 rounded ml-2 ${highlight ? 'bg-white/50' : 'bg-slate-100'}`}>{kbd}</span>}
      </button>
  );

  return (
    <div 
      ref={menuRef}
      className="fixed z-[99999] rounded-xl w-60 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-left shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-200 bg-white ring-1 ring-black/5 overflow-hidden"
      style={{ top: pos.y, left: pos.x }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* TEXT CONTEXT MENU */}
      {type === 'text' && (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <Section label="AI アシスト">
                  <MenuItem icon={<Sparkles />} text="リライト (丁寧)" onClick={() => onAskVisiot && onAskVisiot()} highlight />
                  <MenuItem icon={<Bot />} text="要約・短縮" onClick={() => onAskVisiot && onAskVisiot()} highlight />
              </Section>
              <Section label="書式設定">
                   <div className="flex gap-1 px-2 mb-1">
                       <button onClick={() => {onBold && onBold(); onClose();}} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex justify-center text-slate-700 transition-colors" title="太字"><Bold size={14}/></button>
                       <button onClick={() => {onItalic && onItalic(); onClose();}} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex justify-center text-slate-700 transition-colors" title="斜体"><Italic size={14}/></button>
                       <button onClick={() => {onVerticalText && onVerticalText(); onClose();}} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded flex justify-center text-slate-700 transition-colors" title="縦書き"><ArrowDownToLine size={14}/></button>
                   </div>
                   <MenuItem icon={<Plus />} text="文字サイズ拡大" onClick={() => onFontSizeChange && onFontSizeChange(2)} />
                   <MenuItem icon={<Minus />} text="文字サイズ縮小" onClick={() => onFontSizeChange && onFontSizeChange(-2)} />
              </Section>
              <Section label="クリップボード">
                  <MenuItem icon={<Copy />} text="コピー" onClick={() => onCopy && onCopy()} kbd={`${CMD}+C`} />
                  <MenuItem icon={<Type />} text="テキストのみコピー" onClick={() => { navigator.clipboard.writeText(element?.content?.replace(/<[^>]*>/g, '') || ''); }} />
                  <MenuItem icon={<Trash2 />} text="削除" onClick={onDelete} destructive kbd="Del" />
              </Section>
              <Section>
                  <MenuItem icon={<Layers />} text="順序・配置..." onClick={() => {}} />
              </Section>
          </div>
      )}

      {/* IMAGE CONTEXT MENU */}
      {type === 'image' && (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <Section label="画像操作">
                  <MenuItem icon={<Sparkles />} text="AI画像生成" onClick={() => onImageAction && onImageAction('generate')} highlight />
                  <MenuItem icon={<Replace />} text="画像を置換..." onClick={() => onImageAction && onImageAction('replace')} />
                  <MenuItem icon={<ImageIcon />} text="プレースホルダー" onClick={() => onImageAction && onImageAction('placeholder')} />
                  <MenuItem icon={<Save />} text="画像を保存" onClick={() => onSaveImage && onSaveImage()} />
              </Section>
              <Section label="配置・スタイル">
                   <MenuItem icon={<BringToFront />} text="最前面へ" onClick={onBringFront} />
                   <MenuItem icon={<Layers />} text="最背面へ" onClick={onSendBack} />
                   <div className="border-t border-slate-100 my-1"></div>
                   <MenuItem icon={<Paintbrush />} text="スタイルのコピー" onClick={() => onCopyStyle && onCopyStyle()} />
                   <MenuItem icon={<Palette />} text="スタイルの貼り付け" onClick={() => onPasteStyle && onPasteStyle()} />
              </Section>
              <Section>
                  <MenuItem icon={<Copy />} text="コピー" onClick={() => onCopy && onCopy()} kbd={`${CMD}+C`} />
                  <MenuItem icon={<Trash2 />} text="削除" onClick={onDelete} destructive kbd="Del" />
              </Section>
          </div>
      )}

      {/* TABLE CONTEXT MENU */}
      {type === 'table' && (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <Section label="テーブル操作">
                  <MenuItem icon={<PlusSquare className="text-blue-500"/>} text="下に行を追加" onClick={() => onTableAction && onTableAction('addRow')} />
                  <MenuItem icon={<PlusSquare className="text-blue-500"/>} text="右に列を追加" onClick={() => onTableAction && onTableAction('addCol')} />
                  <div className="border-t border-slate-100 my-1"></div>
                  <MenuItem icon={<MinusSquare className="text-red-400"/>} text="行を削除" onClick={() => onTableAction && onTableAction('removeRow')} />
                  <MenuItem icon={<MinusSquare className="text-red-400"/>} text="列を削除" onClick={() => onTableAction && onTableAction('removeCol')} />
              </Section>
              <Section>
                  <MenuItem icon={<Copy />} text="コピー" onClick={() => onCopy && onCopy()} kbd={`${CMD}+C`} />
                  <MenuItem icon={<Trash2 />} text="削除" onClick={onDelete} destructive kbd="Del" />
              </Section>
          </div>
      )}

      {/* DEFAULT ELEMENT CONTEXT MENU (Shapes) */}
      {(type !== 'text' && type !== 'image' && type !== 'table' && type !== 'slide' && type !== 'canvas') && (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <Section label="図形操作">
                  <MenuItem icon={<Paintbrush />} text="スタイルのコピー" onClick={() => onCopyStyle && onCopyStyle()} />
                  <MenuItem icon={<Palette />} text="スタイルの貼り付け" onClick={() => onPasteStyle && onPasteStyle()} />
                  <MenuItem icon={<RefreshCcw />} text="スタイルリセット" onClick={() => onResetStyle && onResetStyle()} />
              </Section>
              <Section label="順序">
                   <MenuItem icon={<BringToFront />} text="最前面へ" onClick={onBringFront} />
                   <MenuItem icon={<Layers />} text="最背面へ" onClick={onSendBack} />
              </Section>
              <Section>
                  <MenuItem icon={<Copy />} text="コピー" onClick={() => onCopy && onCopy()} kbd={`${CMD}+C`} />
                  <MenuItem icon={<Trash2 />} text="削除" onClick={onDelete} destructive kbd="Del" />
              </Section>
          </div>
      )}

      {/* CANVAS/SLIDE CONTEXT MENU */}
      {(type === 'canvas' || type === 'slide') && (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
            <Section label="スライド">
                <MenuItem icon={<FilePlus />} text="新しいスライド" onClick={onNewSlide} kbd={`${CMD}+Enter`}/>
                <MenuItem icon={<Copy />} text="スライドを複製" onClick={onDuplicate} />
                <MenuItem icon={<ClipboardPaste />} text="貼り付け" onClick={onPaste} kbd={`${CMD}+V`} />
                {type === 'slide' && <MenuItem icon={<Trash2 />} text="スライド削除" onClick={onDelete} destructive kbd="Del"/>}
            </Section>
            {type === 'canvas' && (
                <Section label="表示">
                    <MenuItem icon={<Lightbulb />} text="デザインアイデア" onClick={() => onDesignIdeas && onDesignIdeas()} highlight />
                    <MenuItem icon={<Grid />} text={showGrid ? "グリッドを隠す" : "グリッドを表示"} onClick={() => onToggleGrid && onToggleGrid()} kbd="'"/>
                    <MenuItem icon={<Ruler />} text={showRuler ? "ルーラーを隠す" : "ルーラーを表示"} onClick={() => onToggleRuler && onToggleRuler()} kbd="R"/>
                    <MenuItem icon={<Maximize />} text="全体を表示" onClick={() => {}} kbd={`${CMD}+0`} />
                </Section>
            )}
            <Section>
                <MenuItem icon={<ImageIcon />} text="画像として保存" onClick={() => onSaveImage && onSaveImage()} />
                <MenuItem icon={<Home />} text="ホームに戻る" onClick={() => onGoHome && onGoHome()} />
            </Section>
          </div>
      )}
    </div>
  );
};
