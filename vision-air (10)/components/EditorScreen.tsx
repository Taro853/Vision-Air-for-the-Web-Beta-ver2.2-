
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { Canvas } from './Canvas';
import { ContextMenu } from './ContextMenu';
import { ChatPanel } from './ChatPanel';
import { FloatingToolbar } from './FloatingToolbar';
import { BottomBar } from './BottomBar';
import { Slide, SlideElement, Project, UserProfile, AppSettings, AnimationType } from '../types';
import { Plus, Heading, Type as TypeIcon, Columns, AlignCenter, Square, Lock, Crown, X, CheckCircle } from 'lucide-react';
import { completeText } from '../services/geminiService';
import { AnimatePresence, motion } from 'framer-motion';
import { MobileEditorLayout } from './mobile/MobileEditorLayout';
import { useMediaQuery } from './hooks/useMediaQuery';
import { VisionAirLogo } from './SplashScreen';

interface EditorScreenProps {
    project: Project;
    slides: Slide[];
    setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
    onUpdateProject: (p: Project) => void;
    onGoHome: () => void;
    userProfile: UserProfile;
    onPresent: () => void;
    onGenerateAI: () => void;
    isGenerating: boolean;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    pushHistory: (s: Slide[]) => void;
    currentSlideId: string;
    setCurrentSlideId: (id: string) => void;
    loadingMessage: string | null;
    setLoadingMessage: (msg: string | null) => void;
    appSettings: AppSettings;
    onSettingsChange?: (s: AppSettings) => void; 
    onExportPptx?: () => void;
    onShareProject?: () => void;
    readOnly?: boolean;
}

// --- Helper Components for Premium Lock ---

const UpgradeModal = ({ onClose }: { onClose: () => void }) => (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full relative"
            onClick={e => e.stopPropagation()}
        >
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>
            <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10">
                <X size={20} />
            </button>
            
            <div className="pt-12 px-8 pb-8 relative z-0">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6 relative">
                    <Crown size={40} className="text-purple-600" fill="currentColor" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white">
                        <Lock size={14} className="text-white" />
                    </div>
                </div>
                
                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-black text-slate-800">プレミアム機能です</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        高度な編集ツール、AIアシスタント、書き出し機能を利用するには、<br/>
                        <strong>Express Suite コンプリートプラン</strong>への<br/>アップグレードが必要です。
                    </p>
                    
                    <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 border border-slate-100 my-6">
                        <div className="flex items-center gap-3 text-sm text-slate-700 font-bold">
                            <CheckCircle size={16} className="text-green-500" /> 高度なアニメーション編集
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-700 font-bold">
                            <CheckCircle size={16} className="text-green-500" /> AI アシスタント (Visiot)
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-700 font-bold">
                            <CheckCircle size={16} className="text-green-500" /> PowerPoint / PDF 書き出し
                        </div>
                    </div>

                    <button 
                        onClick={() => window.open('https://example.com/', '_blank')}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Crown size={18} /> アップグレードする
                    </button>
                    <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                        今はしない
                    </button>
                </div>
            </div>
        </motion.div>
    </motion.div>
);

export const EditorScreen: React.FC<EditorScreenProps> = ({
    project, slides, setSlides, onUpdateProject, onGoHome, userProfile,
    onPresent, onGenerateAI, isGenerating: propIsGenerating, undo, redo, canUndo, canRedo, pushHistory,
    currentSlideId, setCurrentSlideId, loadingMessage, setLoadingMessage, appSettings, onSettingsChange,
    onExportPptx, onShareProject, readOnly = false
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'properties' | 'chat' | 'animation' | 'settings'>('properties');
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 0.8 });
    const [contextMenu, setContextMenu] = useState<any>(null);
    const [showAddSlideModal, setShowAddSlideModal] = useState(false);
    const [clipboard, setClipboard] = useState<SlideElement[]>([]);
    
    // Premium Lock State
    const [showUpgrade, setShowUpgrade] = useState(false);
    
    const isFreePlan = userProfile.plan === 'free';
    const isUiLocked = isFreePlan && !readOnly; 

    const currentSlide = slides.find(s => s.id === currentSlideId) || slides[0];

    const handleSelect = (ids: string[] | string | null, isMulti = false) => {
        if (readOnly) return;
        if (ids === null) { setSelectedElementIds([]); return; }
        if (Array.isArray(ids)) { setSelectedElementIds(ids); } 
        else {
            if (isMulti) setSelectedElementIds(prev => prev.includes(ids) ? prev.filter(i => i !== ids) : [...prev, ids]);
            else setSelectedElementIds([ids]);
        }
    };

    const updateElement = useCallback((elementId: string, updates: any) => {
        if (readOnly || isUiLocked) { 
            if(isUiLocked) setShowUpgrade(true);
            return; 
        }
        setSlides(prevSlides => prevSlides.map(s => {
            if (s.id !== currentSlideId) return s;
            return { ...s, elements: s.elements.map(el => { 
                if (el.id === elementId) { 
                    const newEl = { ...el, ...updates };
                    if (updates.style) newEl.style = { ...el.style, ...updates.style };
                    return newEl;
                }
                return el;
            }) };
        }));
    }, [currentSlideId, setSlides, readOnly, isUiLocked]);

    const deleteSelected = useCallback(() => {
        if (readOnly || selectedElementIds.length === 0) return;
        if (isUiLocked) { setShowUpgrade(true); return; }
        const updated = slides.map(s => s.id === currentSlideId 
            ? { ...s, elements: s.elements.filter(el => !selectedElementIds.includes(el.id)) } 
            : s
        );
        setSlides(updated); pushHistory(updated); setSelectedElementIds([]);
    }, [selectedElementIds, currentSlideId, slides, setSlides, pushHistory, readOnly, isUiLocked]);

    const duplicateSelected = useCallback(() => {
        if (readOnly || selectedElementIds.length === 0) return;
        if (isUiLocked) { setShowUpgrade(true); return; }
        const newEls: SlideElement[] = [];
        const toDup = currentSlide.elements.filter(el => selectedElementIds.includes(el.id));
        toDup.forEach(el => {
            const newId = `el-${Date.now()}-${Math.random()}`;
            newEls.push({ ...el, id: newId, x: el.x + 20, y: el.y + 20 });
        });
        const updated = slides.map(s => s.id === currentSlideId ? { ...s, elements: [...s.elements, ...newEls] } : s);
        setSlides(updated); pushHistory(updated); setSelectedElementIds(newEls.map(n => n.id));
    }, [selectedElementIds, currentSlide, slides, setSlides, pushHistory, currentSlideId, readOnly, isUiLocked]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (readOnly || isUiLocked) return;
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) return;
            const isMod = e.ctrlKey || e.metaKey;
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); }
            if (isMod && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
            if (isMod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            if (isMod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
            if (isMod && e.key === 'c') { e.preventDefault(); setClipboard(currentSlide.elements.filter(el => selectedElementIds.includes(el.id))); }
            if (isMod && e.key === 'v') {
                e.preventDefault();
                if (clipboard.length > 0) {
                    const newEls = clipboard.map(el => ({ ...el, id: `el-${Date.now()}-${Math.random()}`, x: el.x + 20, y: el.y + 20 }));
                    const updated = slides.map(s => s.id === currentSlideId ? { ...s, elements: [...s.elements, ...newEls] } : s);
                    setSlides(updated); pushHistory(updated); setSelectedElementIds(newEls.map(n => n.id));
                }
            }
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                const delta = e.shiftKey ? 10 : 1;
                selectedElementIds.forEach(id => {
                    const el = currentSlide.elements.find(item => item.id === id);
                    if (el) {
                        let nx = el.x, ny = el.y;
                        if (e.key === 'ArrowLeft') nx -= delta;
                        if (e.key === 'ArrowRight') nx += delta;
                        if (e.key === 'ArrowUp') ny -= delta;
                        if (e.key === 'ArrowDown') ny += delta;
                        updateElement(id, { x: nx, y: ny });
                    }
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteSelected, duplicateSelected, undo, redo, selectedElementIds, currentSlide, slides, clipboard, currentSlideId, setSlides, pushHistory, updateElement, readOnly, isUiLocked]);

    const addElement = (type: any, content = '', style = {}, extra = {}) => {
        if (readOnly || isUiLocked) { 
            if(isUiLocked) setShowUpgrade(true);
            return; 
        }
        const newEl: SlideElement = {
            id: `el-${Date.now()}-${Math.floor(Math.random()*1000)}`, type, x: 100, y: 100, width: type === 'text' ? 400 : 200, height: type === 'text' ? 100 : 200, rotation: 0, content,
            animation: { type: 'fade-in', duration: 0.5, delay: 0 },
            style: { zIndex: 10, backgroundColor: type === 'text' ? 'transparent' : 'var(--brand-primary)', fontSize: 24, fontFamily: '"Noto Sans JP"', ...style }, 
            ...extra
        };
        const updated = slides.map(s => s.id === currentSlideId ? { ...s, elements: [...s.elements, newEl] } : s);
        setSlides(updated); pushHistory(updated); setSelectedElementIds([newEl.id]);
    };

    if (isMobile) {
        return (
            <MobileEditorLayout 
                project={project} slides={slides} currentSlideId={currentSlideId} setCurrentSlideId={setCurrentSlideId}
                selectedElementIds={selectedElementIds} handleSelect={handleSelect} updateElement={updateElement}
                undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} onGoHome={onGoHome} onPresent={onPresent}
                addElement={addElement} addSlide={() => {}} onDeleteElement={deleteSelected}
                userProfile={userProfile} onVisiotAction={async () => {}}
                handleLayerChange={() => {}} handleAlign={() => {}} handleExportImage={() => {}}
                activeTab={activeTab} setActiveTab={setActiveTab} isGenerating={propIsGenerating} playPreview={() => {}}
                appSettings={appSettings}
                readOnly={readOnly} 
            />
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900 font-sans relative">
            
            {/* --- LOCKED OVERLAY FOR FREE PLAN --- */}
            {isUiLocked && (
                <>
                    {/* The Blur Cover for EVERYTHING except the home button location */}
                    <div className="absolute inset-0 z-[9990] bg-white/20 dark:bg-black/20 backdrop-blur-lg cursor-pointer" onClick={() => setShowUpgrade(true)}>
                    </div>
                    
                    {/* Floating Home Button (Escape Hatch) */}
                    <div className="absolute top-6 left-6 z-[9999] pointer-events-auto">
                        <div className="glass-panel p-1.5 rounded-2xl shadow-floating bg-white/90 backdrop-blur-xl border border-white/40">
                            <button onClick={onGoHome} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="ホームに戻る">
                                <VisionAirLogo className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* --- Normal Editor Content --- */}
            {/* We blur this whole container if locked, so the user can see structure but not interact */}
            <div className={`flex flex-col h-full w-full ${isUiLocked ? 'blur-[8px] pointer-events-none select-none' : ''}`}>
                
                {/* Top Toolbar */}
                <div className="z-50">
                    <div className={readOnly ? "pointer-events-none opacity-50" : ""}>
                        <Toolbar 
                            title={project?.name || "Untitled"} onTitleChange={(t) => onUpdateProject({ ...project, name: t })}
                            onAddSlide={() => setShowAddSlideModal(true)} onAddText={() => addElement('text', 'テキストを入力')}
                            onAddShape={(t) => addElement(t)} onAddTable={(r, c) => {}}
                            onAddImage={() => {}} onDeleteSlide={() => {}} onPresent={onPresent} 
                            onGenerateAI={() => {}} isGenerating={propIsGenerating}
                            onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
                            activeTab={activeTab} onTabChange={setActiveTab} onGoHome={onGoHome}
                            onOpenSettings={() => setActiveTab('properties')} zoom={viewport.zoom} onZoomChange={(z) => setViewport(p => ({...p, zoom: z}))} onSetTheme={() => {}}
                            onExportImage={() => {}} onFitToScreen={() => setViewport({x:0, y:0, zoom: 0.8})}
                            isDrawing={false} onToggleDrawing={() => {}}
                            showRuler={appSettings.showRuler} onToggleRuler={() => {}}
                            penType="pen" onSetPenType={() => {}}
                            onExportPptx={onExportPptx || (() => {})}
                            onShareProject={onShareProject || (() => {})}
                            readOnly={readOnly || isUiLocked} 
                        />
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Left Sidebar (Thumbnails) */}
                    <div className="flex-shrink-0 z-20 h-full flex flex-col">
                        <aside className="mt-16 w-64 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col py-4 px-3 overflow-y-auto">
                            <div className="space-y-3 pb-20">
                                {slides.map((slide, index) => (
                                    <div key={slide.id} onClick={() => !isUiLocked && setCurrentSlideId(slide.id)} className={`group relative cursor-pointer rounded-xl transition-all p-1 ${currentSlideId === slide.id ? 'ring-2 ring-brand-primary bg-brand-primary/5' : 'hover:bg-slate-50'}`}>
                                        <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-white relative">
                                            <div style={{ transform: `scale(${180 / project.width})`, transformOrigin: 'top left', width: project.width, height: project.height }}>
                                                <Canvas slide={slide} selectedIds={[]} onSelect={() => {}} onUpdateElement={() => {}} onContextMenu={() => {}} readOnly projectWidth={project.width} projectHeight={project.height} />
                                            </div>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between px-1">
                                            <span className="text-[10px] font-bold text-slate-400">{index + 1}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>

                    {/* Main Canvas Area */}
                    <main ref={canvasContainerRef} className="flex-1 relative overflow-auto bg-slate-200 dark:bg-slate-900 p-20 custom-scrollbar">
                        <div className="min-w-max min-h-max flex items-center justify-center">
                            <div style={{ transform: `scale(${viewport.zoom})`, transformOrigin: 'center center' }} className="shadow-2xl">
                                <Canvas 
                                    slide={currentSlide} selectedIds={selectedElementIds}
                                    onSelect={handleSelect} onUpdateElement={updateElement}
                                    onContextMenu={(e, id, type) => { if(!isUiLocked && !readOnly) { if(id) handleSelect(id); setContextMenu({ x: e.clientX, y: e.clientY, targetId: id, type }); }}}
                                    scale={viewport.zoom} projectWidth={project.width} projectHeight={project.height}
                                    readOnly={readOnly || isUiLocked} // Canvas itself is readonly if UI is locked (Free plan)
                                />
                                {/* Floating toolbar is also locked via readOnly prop */}
                                {!readOnly && !isUiLocked && selectedElementIds.length === 1 && (
                                    <FloatingToolbar 
                                        element={currentSlide.elements.find(e => e.id === selectedElementIds[0])!} 
                                        zoom={viewport.zoom} onUpdate={updateElement} onDuplicate={duplicateSelected} onDelete={deleteSelected} onLayerChange={() => {}} 
                                    />
                                )}
                            </div>
                        </div>
                    </main>

                    {/* Right Sidebar (Properties/Chat) */}
                    <div className="flex-shrink-0 z-20 h-full flex flex-col">
                        <aside className="mt-16 w-80 h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
                            <AnimatePresence mode="wait">
                                {activeTab === 'chat' ? (
                                    <ChatPanel key="chat" currentSlide={currentSlide} userProfile={userProfile} selectedElement={null} onVisiotAction={async () => {}} readOnly={readOnly || isUiLocked} />
                                ) : (
                                    <div className={(readOnly || isUiLocked) ? "opacity-50 pointer-events-none h-full" : "h-full"}>
                                        <PropertiesPanel 
                                            key="props"
                                            element={currentSlide.elements.find(e => e.id === selectedElementIds[0]) || null} 
                                            currentSlide={currentSlide}
                                            onChange={(u) => selectedElementIds[0] && updateElement(selectedElementIds[0], u)}
                                            onLayerChange={() => {}}
                                            onSlideChange={(u) => { if(readOnly || isUiLocked) return; setSlides(prev => prev.map(s => s.id === currentSlideId ? {...s, ...u} : s))} }
                                            activeTab={activeTab}
                                            projectWidth={project.width} projectHeight={project.height}
                                            onResizeProject={(w, h) => { if(readOnly || isUiLocked) return; onUpdateProject({...project, width: w, height: h})}}
                                            onSelectElement={(id) => handleSelect(id)}
                                            onDeleteElement={deleteSelected}
                                            readOnly={readOnly || isUiLocked} 
                                        />
                                    </div>
                                )}
                            </AnimatePresence>
                        </aside>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="z-50">
                    <BottomBar zoom={viewport.zoom} onZoomChange={(z) => setViewport(v => ({...v, zoom: z}))} slideNote={currentSlide.notes || ''} onNoteChange={(n) => { if(readOnly || isUiLocked) return; }} slideSizeLabel={`${project.width}x${project.height}`} />
                </div>
                
                {contextMenu && !readOnly && !isUiLocked && (
                    <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} onDuplicate={duplicateSelected} onDelete={deleteSelected} onBringFront={() => {}} onSendBack={() => {}} onLock={() => {}} onAlign={() => {}} onPaste={() => {}} onNewSlide={() => {}} onSelectAll={() => {}} />
                )}
            </div>

            {/* Upgrade Modal */}
            <AnimatePresence>
                {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
            </AnimatePresence>
        </div>
    );
}
