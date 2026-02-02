import React, { useState, useRef, useEffect } from 'react';
import { Slide, SlideElement, Project, UserProfile, AppSettings } from '../../types';
import { Canvas } from '../Canvas';
import { PropertiesPanel } from '../PropertiesPanel';
import { ChatPanel } from '../ChatPanel';
import { Home, Undo2, Redo2, Play, Plus, Layers, MessageCircle, SlidersHorizontal, Image as ImageIcon, Type, Square, X, Check, ChevronDown, MonitorPlay, Trash2, Copy, StickyNote, Bold, Italic, Minus, Plus as PlusIcon, Palette, AlignLeft, AlignCenter, AlignRight, Replace, Maximize, Underline, Table, ChevronUp, GripHorizontal, ZoomIn, ZoomOut, Lock, Unlock, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';

interface MobileEditorLayoutProps {
    project: Project;
    slides: Slide[];
    currentSlideId: string;
    setCurrentSlideId: (id: string) => void;
    selectedElementIds: string[];
    handleSelect: (ids: string[] | string | null, isMulti?: boolean) => void;
    updateElement: (id: string, updates: any) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onGoHome: () => void;
    onPresent: () => void;
    addElement: (type: any, content?: string, style?: any, extra?: any) => void;
    addSlide: () => void;
    onDeleteElement: () => void;
    userProfile: UserProfile;
    onVisiotAction: (call: any) => Promise<void>;
    handleLayerChange: (action: string) => void;
    handleAlign: (type: string) => void;
    handleExportImage: () => void;
    activeTab: any;
    setActiveTab: (t: any) => void;
    isGenerating: boolean;
    playPreview: () => void;
    appSettings: AppSettings;
    readOnly?: boolean;
}

// デザイン統一されたクイックアクションボタン
const QuickActionBtn = ({ icon: Icon, label, active, onClick, destructive, disabled }: any) => (
    <button 
        onClick={(e) => { e.stopPropagation(); if(!disabled) onClick(); }}
        disabled={disabled}
        className={`
            flex flex-col items-center justify-center gap-1 min-w-[3.5rem] h-14 rounded-2xl transition-all shrink-0
            ${active 
                ? 'bg-slate-800 text-white shadow-md transform scale-105' 
                : destructive 
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-white hover:bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-100 dark:border-slate-700 shadow-sm'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
    >
        <Icon size={20} strokeWidth={2} />
        {label && <span className="text-[9px] font-bold tracking-tight">{label}</span>}
    </button>
);

// Fix: Use React.FC to properly handle the 'key' prop and ensure strict prop typing.
const ColorDot: React.FC<{ color: string, active: boolean, onClick: () => void, disabled?: boolean }> = ({ color, active, onClick, disabled }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); if(!disabled) onClick(); }}
        disabled={disabled}
        className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 shadow-sm ${active ? 'border-brand-primary scale-110 ring-2 ring-brand-primary/20' : 'border-slate-200 dark:border-slate-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ backgroundColor: color }}
    />
);

const COLORS = ['#000000', '#FFFFFF', '#F97316', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'];

export const MobileEditorLayout: React.FC<MobileEditorLayoutProps> = ({
    project, slides, currentSlideId, selectedElementIds, updateElement,
    undo, redo, canUndo, canRedo, onGoHome, onPresent, addElement, addSlide, onDeleteElement,
    handleSelect, setCurrentSlideId, userProfile, onVisiotAction, handleLayerChange,
    activeTab, setActiveTab, isGenerating, playPreview, appSettings, readOnly = false
}) => {
    const currentSlide = slides.find(s => s.id === currentSlideId) || slides[0];
    const selectedElement = selectedElementIds.length === 1 ? currentSlide.elements.find(e => e.id === selectedElementIds[0]) : null;
    
    // Zoom & Pan State
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.4);
    const [isPinching, setIsPinching] = useState(false);
    const lastTouchDistance = useRef<number | null>(null);
    
    // Sheet State
    const [sheetMode, setSheetMode] = useState<'collapsed' | 'expanded'>('collapsed');
    const sheetRef = useRef<HTMLDivElement>(null);
    
    // Context Management
    useEffect(() => {
        if (selectedElementIds.length > 0) {
            setActiveTab('properties');
            // 選択時は邪魔にならないように最初はcollapsed
            setSheetMode('collapsed');
        } else {
            setActiveTab('main');
            setSheetMode('collapsed');
        }
    }, [selectedElementIds, setActiveTab]);

    // Initial Scale
    useEffect(() => {
        if (containerRef.current) {
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            const s = Math.min((w - 32) / project.width, (h - 200) / project.height); // Bottom space reserved
            setScale(Math.max(0.1, s));
        }
    }, [project.width, project.height]);

    // --- Zoom Logic ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            setIsPinching(true);
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            lastTouchDistance.current = dist;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance.current) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = dist / lastTouchDistance.current;
            const newScale = Math.min(Math.max(0.1, scale * delta), 3.0);
            setScale(newScale);
            lastTouchDistance.current = dist;
        }
    };

    const handleTouchEnd = () => {
        setIsPinching(false);
        lastTouchDistance.current = null;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (readOnly) return;
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if(ev.target?.result) addElement('image', ev.target.result as string, {}, {width: 300, height: 300});
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Sheet Drag Handler
    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.y < -50 || info.velocity.y < -300) {
            setSheetMode('expanded');
        } else if (info.offset.y > 50 || info.velocity.y > 300) {
            setSheetMode('collapsed');
        }
    };

    const renderQuickActions = () => {
        if (activeTab === 'main') {
            return (
                <div className="flex items-center justify-around w-full h-full px-4">
                    <button onClick={() => !readOnly && addElement('text')} disabled={readOnly} className="flex flex-col items-center gap-1 text-slate-600 disabled:opacity-50">
                        <div className="p-3 bg-slate-100 rounded-2xl"><Type size={24}/></div>
                        <span className="text-[10px] font-bold">テキスト</span>
                    </button>
                    <button onClick={() => !readOnly && addElement('rectangle')} disabled={readOnly} className="flex flex-col items-center gap-1 text-slate-600 disabled:opacity-50">
                        <div className="p-3 bg-slate-100 rounded-2xl"><Square size={24}/></div>
                        <span className="text-[10px] font-bold">図形</span>
                    </button>
                    <button onClick={() => !readOnly && document.getElementById('mobile-img-upload')?.click()} disabled={readOnly} className="flex flex-col items-center gap-1 text-slate-600 disabled:opacity-50">
                        <div className="p-3 bg-slate-100 rounded-2xl"><ImageIcon size={24}/></div>
                        <span className="text-[10px] font-bold">画像</span>
                    </button>
                    <button onClick={() => setActiveTab('layers')} className="flex flex-col items-center gap-1 text-slate-600">
                        <div className="p-3 bg-slate-100 rounded-2xl"><Layers size={24}/></div>
                        <span className="text-[10px] font-bold">レイヤー</span>
                    </button>
                    <button onClick={() => setActiveTab('chat')} className="flex flex-col items-center gap-1 text-brand-primary">
                        <div className="p-3 bg-orange-100 rounded-2xl"><MessageCircle size={24}/></div>
                        <span className="text-[10px] font-bold">AI</span>
                    </button>
                </div>
            );
        }

        if (activeTab === 'properties' && selectedElement) {
            const s = selectedElement.style;
            return (
                <div className="flex items-center gap-3 px-4 w-full h-full overflow-x-auto no-scrollbar mask-gradient-right">
                    <div className="flex items-center gap-2 pr-2 border-r border-slate-100 shrink-0">
                        <QuickActionBtn icon={Trash2} destructive onClick={onDeleteElement} disabled={readOnly} />
                        <QuickActionBtn icon={selectedElement.locked ? Lock : Unlock} active={selectedElement.locked} onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })} disabled={readOnly} />
                        <QuickActionBtn icon={Copy} onClick={() => {}} disabled={readOnly} /> {/* Duplicate logic needed if copied */}
                    </div>

                    {selectedElement.type === 'text' && (
                        <>
                            <div className="flex items-center gap-2 shrink-0">
                                <QuickActionBtn icon={Bold} active={s.fontWeight === 'bold'} onClick={() => updateElement(selectedElement.id, { style: { fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold' } })} disabled={readOnly} />
                                <QuickActionBtn icon={Minus} onClick={() => updateElement(selectedElement.id, { style: { fontSize: Math.max(8, (s.fontSize || 16) - 2) } })} disabled={readOnly} />
                                <span className="font-mono font-bold text-xs w-6 text-center">{s.fontSize || 16}</span>
                                <QuickActionBtn icon={PlusIcon} onClick={() => updateElement(selectedElement.id, { style: { fontSize: Math.min(200, (s.fontSize || 16) + 2) } })} disabled={readOnly} />
                            </div>
                            <div className="w-px h-8 bg-slate-200 shrink-0 mx-1"></div>
                            <div className="flex gap-2 shrink-0">
                                {/* Fix: Wrap updateElement in a closure to ensure a void return type to match prop expectations. */}
                                {COLORS.map(c => <ColorDot key={c} color={c} active={s.color === c} onClick={() => { updateElement(selectedElement.id, { style: { color: c } }); }} disabled={readOnly} />)}
                            </div>
                        </>
                    )}

                    {['rectangle', 'circle', 'triangle', 'star', 'diamond', 'hexagon', 'arrow', 'bubble', 'path'].includes(selectedElement.type) && (
                        <div className="flex gap-2 shrink-0">
                            {/* Fix: Wrap updateElement in a closure to ensure a void return type to match prop expectations. */}
                            {COLORS.map(c => <ColorDot key={c} color={c} active={s.backgroundColor === c} onClick={() => { updateElement(selectedElement.id, { style: { backgroundColor: c } }); }} disabled={readOnly} />)}
                        </div>
                    )}
                    
                    <div className="shrink-0 pl-2">
                        <button onClick={() => setSheetMode('expanded')} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500">詳細...</button>
                    </div>
                </div>
            );
        }
        
        // Fallback or other tabs in collapsed mode
        return (
            <div className="flex items-center justify-center w-full">
                <button onClick={() => setSheetMode('expanded')} className="flex flex-col items-center text-slate-400">
                    <ChevronUp size={20} className="animate-bounce"/>
                    <span className="text-[10px]">メニューを開く</span>
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 z-50 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={onGoHome} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"><Home size={18}/></button>
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{project.name}</span>
                </div>
                
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-1">
                    <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1 text-slate-500"><ZoomOut size={14}/></button>
                    <span className="text-[10px] font-mono w-8 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(3.0, s + 0.1))} className="p-1 text-slate-500"><ZoomIn size={14}/></button>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={undo} disabled={!canUndo || readOnly} className="p-1.5 text-slate-500 disabled:opacity-30"><Undo2 size={18}/></button>
                    <button onClick={redo} disabled={!canRedo || readOnly} className="p-1.5 text-slate-500 disabled:opacity-30"><Redo2 size={18}/></button>
                    <button onClick={onPresent} className="p-1.5 bg-brand-primary text-white rounded-lg shadow-sm ml-1"><Play size={16} fill="currentColor"/></button>
                </div>
            </div>

            {/* Canvas Area */}
            <div 
                ref={containerRef}
                className="flex-1 relative overflow-hidden bg-slate-200/50 dark:bg-slate-900 touch-none flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => { handleSelect(null); setSheetMode('collapsed'); }}
            >
                <div 
                    className="pointer-events-auto relative shadow-2xl transition-transform duration-75 ease-out origin-center"
                    style={{
                        transform: `scale(${scale})`,
                        width: project.width,
                        height: project.height,
                        // Ensure it doesn't get hidden behind toolbars
                        marginBottom: sheetMode === 'expanded' ? '400px' : '100px',
                        transition: 'margin-bottom 0.3s ease'
                    }}
                >
                    <Canvas 
                        slide={currentSlide} 
                        selectedIds={selectedElementIds} 
                        onSelect={handleSelect} 
                        onUpdateElement={updateElement} 
                        onContextMenu={() => {}} 
                        scale={scale}
                        projectWidth={project.width} 
                        projectHeight={project.height}
                        currentStep={999}
                        showGrid={appSettings.showGrid}
                        enableSelectionBox={false}
                        readOnly={readOnly}
                    />
                </div>
            </div>

            {/* Unified Bottom Sheet */}
            <motion.div 
                className={`fixed left-0 right-0 bottom-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 flex flex-col border-t border-slate-100 dark:border-slate-700`}
                initial={{ height: 100 }}
                animate={{ height: sheetMode === 'collapsed' ? 100 : '75vh' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y"
                dragControls={useDragControls()}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
            >
                {/* Drag Handle */}
                <div 
                    className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0" 
                    onClick={() => setSheetMode(sheetMode === 'collapsed' ? 'expanded' : 'collapsed')}
                >
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>

                {/* Collapsed Content (Quick Actions) */}
                <div className={`h-20 shrink-0 border-b border-slate-100 dark:border-slate-700 transition-opacity duration-200 ${sheetMode === 'expanded' ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                    {renderQuickActions()}
                </div>

                {/* Expanded Content (Details) */}
                <div className="flex-1 overflow-y-auto p-4 pb-12 custom-scrollbar bg-slate-50/50 dark:bg-slate-800/50">
                    {/* Header in Expanded Mode */}
                    {sheetMode === 'expanded' && (
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                                {activeTab === 'properties' ? '詳細設定' : activeTab === 'chat' ? 'AIアシスタント' : activeTab === 'layers' ? 'スライド一覧' : 'メニュー'}
                            </h3>
                            <button onClick={() => setSheetMode('collapsed')} className="p-2 bg-slate-100 rounded-full"><ChevronDown size={20}/></button>
                        </div>
                    )}

                    {activeTab === 'main' && sheetMode === 'expanded' && (
                        <div className="grid grid-cols-3 gap-4">
                            <button onClick={() => { setActiveTab('chat'); }} className="p-4 bg-white rounded-2xl shadow-sm flex flex-col items-center gap-2">
                                <MessageCircle size={32} className="text-brand-primary"/> <span className="font-bold text-sm">AIチャット</span>
                            </button>
                            <button onClick={() => { setActiveTab('layers'); }} className="p-4 bg-white rounded-2xl shadow-sm flex flex-col items-center gap-2">
                                <Layers size={32} className="text-slate-600"/> <span className="font-bold text-sm">レイヤー/スライド</span>
                            </button>
                            <button onClick={() => { setActiveTab('properties'); }} className="p-4 bg-white rounded-2xl shadow-sm flex flex-col items-center gap-2">
                                <SlidersHorizontal size={32} className="text-slate-600"/> <span className="font-bold text-sm">設定</span>
                            </button>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <PropertiesPanel 
                            element={selectedElement} currentSlide={currentSlide} 
                            onChange={(u) => selectedElement && updateElement(selectedElement.id, u)} 
                            onLayerChange={handleLayerChange} 
                            onSlideChange={() => {}} 
                            activeTab="properties" 
                            projectWidth={project.width} projectHeight={project.height} 
                            onResizeProject={() => {}} 
                            onSelectElement={handleSelect} 
                            onDeleteElement={onDeleteElement} 
                            readOnly={readOnly}
                        />
                    )}

                    {activeTab === 'chat' && (
                        <ChatPanel currentSlide={currentSlide} userProfile={userProfile} selectedElement={selectedElement} onVisiotAction={onVisiotAction} readOnly={readOnly} />
                    )}

                    {activeTab === 'layers' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-500 text-xs uppercase">スライド</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {slides.map((s, i) => (
                                    <div key={s.id} onClick={() => { setCurrentSlideId(s.id); setSheetMode('collapsed'); }} className={`aspect-video rounded-xl border-2 ${s.id === currentSlideId ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-200'} bg-white relative overflow-hidden shadow-sm`}>
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-slate-900/80 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">{i+1}</div>
                                    </div>
                                ))}
                                <button onClick={() => { if(!readOnly) { addSlide(); setSheetMode('collapsed'); } }} disabled={readOnly} className="aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2 disabled:opacity-50">
                                    <Plus size={24}/> <span className="text-xs font-bold">追加</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
            
            <input type="file" id="mobile-img-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={readOnly} />
        </div>
    );
};