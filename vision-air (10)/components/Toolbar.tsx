
import React, { useRef, useState, useEffect } from 'react';
import { 
  Type, Square, Image as ImageIcon, Sparkles, Undo2, Redo2,
  MessageCircle, ImagePlus, Table as TableIcon, Layout, MonitorPlay,
  Edit2, Edit3, Download, Maximize2, Plus, Check, Settings, PenTool, Ruler, Brush, Highlighter, Pen, FileOutput, Share2, Link
} from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { ElementType } from '../types';
import { ToolButton } from './ui/ToolButton';
import { ShapeMenu } from './toolbar/ShapeMenu';
import { TableMenu } from './toolbar/TableMenu';
import { VisionAirLogo } from './SplashScreen';

interface ToolbarProps {
  onAddSlide: () => void;
  onAddText: () => void;
  onAddShape: (type: ElementType) => void;
  onAddTable: (rows: number, cols: number) => void;
  onAddImage: (fileOrUrl: File | string) => void;
  onDeleteSlide: () => void;
  onPresent: () => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeTab: 'properties' | 'chat' | 'animation' | 'settings';
  onTabChange: (tab: 'properties' | 'chat' | 'animation' | 'settings') => void;
  onGoHome: () => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
  onOpenSettings: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onSetTheme: () => void;
  onExportImage: () => void;
  onExportPptx: () => void;
  onShareProject: () => void;
  onFitToScreen: () => void;
  isDrawing: boolean;
  onToggleDrawing: () => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  penType: 'pen' | 'marker' | 'highlighter';
  onSetPenType: (type: 'pen' | 'marker' | 'highlighter') => void;
  readOnly?: boolean; // New prop
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddSlide, onAddText, onAddShape, onAddTable, onAddImage, onPresent, onGenerateAI, isGenerating,
  onUndo, onRedo, canUndo, canRedo, activeTab, onTabChange, onGoHome, title, onTitleChange,
  onExportImage, onExportPptx, onShareProject, onFitToScreen, isDrawing, onToggleDrawing, showRuler, onToggleRuler,
  penType, onSetPenType, readOnly = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Image State
  const [showAiImgModal, setShowAiImgModal] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgStyle, setImgStyle] = useState('Photorealistic');
  const [imgAspect, setImgAspect] = useState('1:1');
  const [isImgGenLoading, setIsImgGenLoading] = useState(false);
  
  const shapeBtnRef = useRef<HTMLDivElement>(null);
  const tableBtnRef = useRef<HTMLDivElement>(null);
  const penBtnRef = useRef<HTMLDivElement>(null);
  const exportBtnRef = useRef<HTMLDivElement>(null);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showPenMenu, setShowPenMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => { setTempTitle(title); }, [title]);

  const handleTitleCommit = () => { onTitleChange(tempTitle); setIsEditingTitle(false); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onAddImage(e.target.files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenImage = async () => {
    if(readOnly) { alert("閲覧モードではAI画像生成できません。"); return; }
    if(!imgPrompt.trim()) return;
    setIsImgGenLoading(true);
    const fullPrompt = `${imgPrompt}, Style: ${imgStyle}, Aspect Ratio: ${imgAspect}`;
    const base64 = await generateImage(fullPrompt, true);
    if (base64) {
      onAddImage(base64);
      setShowAiImgModal(false);
      setImgPrompt('');
    }
    setIsImgGenLoading(false);
  };

  const getPopupPos = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (!ref.current) return { top: 0, left: 0 };
      const rect = ref.current.getBoundingClientRect();
      return { top: rect.bottom + 12, left: rect.left };
  };

  const Divider = () => <div className="h-5 w-px bg-slate-200/60 mx-1 self-center"></div>;

  return (
    <>
    <div className="absolute top-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
        <div className="glass-panel pointer-events-auto flex items-center p-1.5 rounded-2xl shadow-floating bg-white/90 backdrop-blur-xl border border-white/40 gap-1 max-w-[95vw] transition-all duration-300 hover:bg-white">
            
            {/* Left: Home & Title */}
            <div className="flex items-center gap-1 pl-1 pr-2">
                 <button onClick={onGoHome} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="ホームに戻る">
                    <VisionAirLogo className="w-5 h-5"/>
                 </button>
                 <div className="h-6 w-px bg-slate-200 mx-1"></div>
                 <div className="flex flex-col justify-center min-w-[100px]">
                    {isEditingTitle && !readOnly ? (
                         <input 
                            value={tempTitle} 
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleTitleCommit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleCommit()}
                            autoFocus
                            className="font-bold text-slate-800 text-sm bg-transparent border-b border-brand-primary focus:outline-none w-32 px-1"
                         />
                    ) : (
                        <div className={`group cursor-pointer flex items-center gap-2 ${readOnly ? 'cursor-default' : ''}`} onClick={() => !readOnly && setIsEditingTitle(true)} title={readOnly ? "閲覧モード" : "タイトルを編集"}>
                            <h1 className="font-bold text-slate-800 text-sm hover:text-brand-primary transition-colors truncate max-w-[140px]">
                                {title}
                            </h1>
                            {!readOnly && <Edit2 size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                    )}
                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                        <Check size={8} className="text-green-500" strokeWidth={3}/> 自動保存済み
                    </span>
                 </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            {/* Center: Tools */}
            <div className="flex items-center gap-0.5">
                 <ToolButton onClick={onUndo} icon={Undo2} disabled={!canUndo || readOnly} title="元に戻す" />
                 <ToolButton onClick={onRedo} icon={Redo2} disabled={!canRedo || readOnly} title="やり直す" />
                 
                 <Divider />
                 
                 <ToolButton onClick={onAddSlide} icon={Plus} label="スライド" colorClass="text-brand-primary" title="スライド追加" disabled={readOnly} />
                 <ToolButton onClick={onAddText} icon={Type} label="テキスト" title="テキスト追加" disabled={readOnly} />
                 <div ref={shapeBtnRef}><ToolButton onClick={() => !readOnly && setShowShapeMenu(!showShapeMenu)} icon={Square} label="図形" hasDropdown title="図形メニュー" disabled={readOnly} /></div>
                 <div ref={tableBtnRef}><ToolButton onClick={() => !readOnly && setShowTableMenu(!showTableMenu)} icon={TableIcon} label="表" hasDropdown title="テーブル追加" disabled={readOnly} /></div>
                 
                 <div ref={penBtnRef} className="relative">
                     <ToolButton onClick={() => { if(readOnly) {alert("閲覧モードでは描画できません。"); return;} if(isDrawing) setShowPenMenu(!showPenMenu); else onToggleDrawing(); }} icon={penType === 'highlighter' ? Highlighter : penType === 'marker' ? Brush : PenTool} label="ペン" active={isDrawing} title="描画ツール" hasDropdown disabled={readOnly}/>
                 </div>
                 
                 <div className="relative">
                    <ToolButton onClick={() => !readOnly && fileInputRef.current?.click()} icon={ImageIcon} label="画像" title="画像をアップロード" disabled={readOnly} />
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </div>
                 
                 <Divider />

                 <div className="flex items-center gap-1 px-1">
                     <button onClick={() => !readOnly && setShowAiImgModal(true)} disabled={readOnly} className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title="AI画像生成">
                        <ImagePlus size={20} />
                     </button>
                     
                     <button onClick={onGenerateAI} disabled={isGenerating || readOnly}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold border
                            ${isGenerating || readOnly 
                                ? 'bg-slate-100 cursor-not-allowed text-slate-400 border-slate-200' 
                                : 'bg-gradient-to-r from-brand-primary to-orange-500 hover:shadow-glow-primary text-white border-transparent active:scale-95 shadow-sm'}
                        `}
                        title="AI構成生成"
                    >
                        <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} fill="currentColor" />
                        AI構成
                    </button>
                 </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            {/* Right: Mode & Actions */}
            <div className="flex items-center gap-1 pr-1">
                 <div className="flex bg-slate-100/50 rounded-lg p-0.5 gap-0.5">
                     <ToolButton onClick={onToggleRuler} icon={Ruler} active={showRuler} title="定規を表示" />
                     <ToolButton onClick={() => onTabChange('chat')} icon={MessageCircle} active={activeTab === 'chat'} title="AIアシスタント" />
                     <ToolButton onClick={() => onTabChange('properties')} icon={Edit3} active={activeTab === 'properties'} title="プロパティ" />
                 </div>

                 <Divider />

                 <ToolButton onClick={onShareProject} icon={Share2} title="リンクで共有" disabled={readOnly} />
                 
                 <div ref={exportBtnRef}>
                    <ToolButton onClick={() => setShowExportMenu(!showExportMenu)} icon={Download} title="エクスポート" hasDropdown disabled={readOnly} />
                 </div>
                 
                 <button 
                    onClick={onPresent} 
                    className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95 ml-1"
                    title="プレゼンテーション開始"
                 >
                    <MonitorPlay size={18} />
                 </button>
            </div>
        </div>
    </div>

    {/* Pen Menu */}
    {showPenMenu && (
        <div className="absolute z-50 bg-white shadow-xl rounded-xl p-2 border border-slate-100 flex flex-col gap-2 animate-in fade-in zoom-in-95" style={{ top: getPopupPos(penBtnRef).top, left: getPopupPos(penBtnRef).left }}>
            <button onClick={() => { onSetPenType('pen'); setShowPenMenu(false); if(!isDrawing && !readOnly) onToggleDrawing(); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${penType === 'pen' ? 'bg-orange-50 text-brand-primary' : 'hover:bg-slate-50 text-slate-600'}`}>
                <Pen size={14}/> ペン (細)
            </button>
            <button onClick={() => { onSetPenType('marker'); setShowPenMenu(false); if(!isDrawing && !readOnly) onToggleDrawing(); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${penType === 'marker' ? 'bg-orange-50 text-brand-primary' : 'hover:bg-slate-50 text-slate-600'}`}>
                <Brush size={14}/> マーカー (太)
            </button>
            <button onClick={() => { onSetPenType('highlighter'); setShowPenMenu(false); if(!isDrawing && !readOnly) onToggleDrawing(); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${penType === 'highlighter' ? 'bg-orange-50 text-brand-primary' : 'hover:bg-slate-50 text-slate-600'}`}>
                <Highlighter size={14}/> 蛍光ペン (半透明)
            </button>
        </div>
    )}

    {/* Export Menu */}
    {showExportMenu && (
        <div className="absolute z-50 bg-white shadow-xl rounded-xl p-2 border border-slate-100 flex flex-col gap-2 animate-in fade-in zoom-in-95" style={{ top: getPopupPos(exportBtnRef).top, left: getPopupPos(exportBtnRef).left - 100 }}>
            <button onClick={() => { onExportImage(); setShowExportMenu(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 text-slate-600">
                <ImageIcon size={14}/> 画像として保存 (PNG)
            </button>
            <button onClick={() => { onExportPptx(); setShowExportMenu(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 text-slate-600">
                <FileOutput size={14}/> PowerPoint (PPTX)
            </button>
        </div>
    )}

    {/* Detailed AI Image Modal */}
    {showAiImgModal && (
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-floating border border-white/50 w-96 z-[60] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><Sparkles size={16} /></div>
                <h4 className="text-sm font-bold text-slate-700 uppercase">AI画像生成 (詳細)</h4>
            </div>
            
            <div className="space-y-4 mb-4">
                <textarea 
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none shadow-inner"
                    placeholder="生成したい画像の説明を入力..."
                    rows={3}
                />
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">スタイル</label>
                        <select value={imgStyle} onChange={e => setImgStyle(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white">
                            <option value="Photorealistic">写真リアル</option>
                            <option value="Anime">アニメ調</option>
                            <option value="3D Render">3Dレンダリング</option>
                            <option value="Oil Painting">油絵</option>
                            <option value="Sketch">スケッチ</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">比率</label>
                        <select value={imgAspect} onChange={e => setImgAspect(e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white">
                            <option value="1:1">スクエア (1:1)</option>
                            <option value="16:9">ワイド (16:9)</option>
                            <option value="4:3">標準 (4:3)</option>
                            <option value="3:4">縦長 (3:4)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={() => setShowAiImgModal(false)} className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">キャンセル</button>
                <button onClick={handleGenImage} disabled={isImgGenLoading || !imgPrompt.trim()} className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-200">
                    {isImgGenLoading ? '生成中...' : '生成する'}
                </button>
            </div>
        </div>
    )}

    <ShapeMenu 
        isOpen={showShapeMenu} 
        onClose={() => setShowShapeMenu(false)} 
        onSelect={onAddShape} 
        position={getPopupPos(shapeBtnRef)} 
    />

    <TableMenu 
        isOpen={showTableMenu} 
        onClose={() => setShowTableMenu(false)} 
        onSelect={onAddTable} 
        position={getPopupPos(tableBtnRef)} 
    />
    </>
  );
};
