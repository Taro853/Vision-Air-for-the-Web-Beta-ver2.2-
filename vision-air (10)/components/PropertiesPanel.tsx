import React, { useState } from 'react';
import { SlideElement, Slide } from '../types';
import { AlignCenter, Layers, Lock, Type, Droplet, Image as ImageIcon, Square, Play, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, List, RefreshCw, Sparkles, Home, Settings, Film, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, ArrowUpToLine, ArrowDownToLine, Move, GripVertical, ArrowUp, ArrowDown as ArrowDownIcon, Palette, ArrowDown, Lightbulb, Unlock, Layout } from 'lucide-react';
import { ColorPicker } from './ui/ColorPicker';
import { Section } from './ui/Section';
import { TextProperties } from './properties/TextProperties';
import { ShapeProperties } from './properties/ShapeProperties';
import { ImageProperties } from './properties/ImageProperties';
import { TableProperties } from './properties/TableProperties';

interface PropertiesPanelProps {
  element: SlideElement | null;
  currentSlide: Slide;
  onChange: (updates: Partial<SlideElement> | Partial<SlideElement['style']> | { animation: SlideElement['animation'] } | { tableData: any }) => void;
  onLayerChange: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onSlideChange: (updates: Partial<Slide>) => void;
  activeTab: string; 
  projectWidth: number;
  projectHeight: number;
  onResizeProject: (w: number, h: number) => void;
  onSelectElement: (id: string) => void;
  onDeleteElement: () => void;
  onPlayPreview?: () => void;
  multiSelected?: boolean;
  onAlign?: (type: 'left'|'center'|'right'|'top'|'middle'|'bottom'|'distribute-h'|'distribute-v') => void;
  onLayerReorder?: (dragIndex: number, hoverIndex: number) => void;
  onDesignIdeas?: () => void;
  readOnly?: boolean; // New prop
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
    element, currentSlide, onChange, onLayerChange, onSlideChange, activeTab, 
    projectWidth, projectHeight, onResizeProject, onSelectElement, onDeleteElement, onPlayPreview,
    multiSelected, onAlign, onLayerReorder, onDesignIdeas, readOnly = false
}) => {
  
  const [settingsTab, setSettingsTab] = useState<'home'|'layers'|'anim'>('home');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedAnimIndex, setDraggedAnimIndex] = useState<number | null>(null);

  const handleAnimDragStart = (e: React.DragEvent, index: number) => { 
    if (readOnly) { e.preventDefault(); return; }
    setDraggedAnimIndex(index); e.dataTransfer.effectAllowed = 'move'; 
  };
  const handleAnimDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const handleAnimDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (readOnly) return;
      if (draggedAnimIndex === null || draggedAnimIndex === dropIndex) return;
      const animatedEls = currentSlide.elements.filter(el => el.animation && el.animation.type !== 'none').sort((a, b) => (a.animation?.step || 0) - (b.animation?.step || 0));
      const movedEl = animatedEls[draggedAnimIndex];
      const newOrder = [...animatedEls];
      newOrder.splice(draggedAnimIndex, 1);
      newOrder.splice(dropIndex, 0, movedEl);
      const newElements = currentSlide.elements.map(el => {
          const newIdx = newOrder.findIndex(o => o.id === el.id);
          if (newIdx !== -1) return { ...el, animation: { ...el.animation!, step: newIdx + 1 } };
          return el;
      });
      onSlideChange({ elements: newElements });
      setDraggedAnimIndex(null);
  };

  // Helper to prevent focus loss on Canvas
  const onMouseDownPrevent = (e: React.MouseEvent) => {
      // Allow input focus but prevent button clicks from blurring the canvas
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      // Do NOT prevent default for interactive elements inside panel
  };

  const renderAnimationControl = (el: SlideElement, isGlobal = false) => (
       <div className="bg-slate-50 rounded-2xl p-4 mb-2 shadow-inner border border-slate-100" onMouseDown={onMouseDownPrevent}>
           {!isGlobal && (
                <div className="mb-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">アニメーション種類</span>
                    <select 
                        value={el.animation?.type || 'none'} 
                        onChange={(e) => {
                            if (readOnly) { alert("閲覧モードではアニメーションを変更できません。"); return; }
                            const maxStep = Math.max(0, ...currentSlide.elements.map(e => e.animation?.step || 0));
                            const currentStep = el.animation?.step !== undefined ? el.animation.step : maxStep + 1;
                            onChange({ animation: { ...(el.animation || { duration: 1, delay: 0 }), type: e.target.value as any, step: currentStep } });
                        }}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-brand-primary/20"
                        disabled={readOnly}
                    >
                        <option value="none">なし</option>
                        <option value="fade-in">フェードイン</option>
                        <option value="slide-up">スライドイン (下)</option>
                        <option value="slide-down">スライドイン (上)</option>
                        <option value="slide-left">スライドイン (左)</option>
                        <option value="slide-right">スライドイン (右)</option>
                        <option value="pop">ポップ</option>
                        <option value="zoom-in">ズームイン</option>
                        <option value="zoom-out">ズームアウト</option>
                        <option value="rubber-band">ラバーバンド</option>
                        <option value="rotate-in">回転イン</option>
                        <option value="bounce-in">バウンスイン</option>
                        <option value="wobble">揺れ (Wobble)</option>
                        <option value="swing">スイング</option>
                        <option value="flip-in-x">回転 (X軸)</option>
                        <option value="flip-in-y">回転 (Y軸)</option>
                    </select>
                </div>
           )}
           {el.animation?.type !== 'none' && (
               <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] text-slate-400 block mb-1">秒数</label>
                        <input type="number" step="0.1" value={el.animation?.duration || 1} onChange={(e) => { if (readOnly) { alert("閲覧モードではアニメーションを変更できません。"); return; } onChange({ animation: { ...el.animation!, duration: parseFloat(e.target.value) } }); }} className="w-full text-xs border border-slate-200 rounded-lg p-2 text-center" disabled={readOnly} />
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-400 block mb-1">遅延</label>
                        <input type="number" step="0.1" value={el.animation?.delay || 0} onChange={(e) => { if (readOnly) { alert("閲覧モードではアニメーションを変更できません。"); return; } onChange({ animation: { ...el.animation!, delay: parseFloat(e.target.value) } }); }} className="w-full text-xs border border-slate-200 rounded-lg p-2 text-center" disabled={readOnly} />
                    </div>
               </div>
           )}
       </div>
  );
  
  const handleDragStart = (e: React.DragEvent, index: number) => { 
    if (readOnly) { e.preventDefault(); return; }
    setDraggedItemIndex(index); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index.toString()); 
  };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => { 
    e.preventDefault(); 
    if (readOnly) return;
    if (draggedItemIndex !== null && onLayerReorder) { 
        const total = currentSlide.elements.length; 
        const actualDragIdx = total - 1 - draggedItemIndex; 
        const actualDropIdx = total - 1 - dropIndex; 
        onLayerReorder(actualDragIdx, actualDropIdx); 
        setDraggedItemIndex(null); 
    } 
  };

  // --- MULTI-SELECTION VIEW ---
  if (multiSelected) {
      return (
          <div className={`flex flex-col h-full bg-slate-50/50 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`} onMouseDown={onMouseDownPrevent}>
               <div className="p-4 bg-white border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm mb-1">Multi Selection</h3><p className="text-xs text-slate-400">複数要素を選択中</p></div>
               <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                    <Section title="整列・配置">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                             <button onClick={() => onAlign && onAlign('left')} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 flex justify-center shadow-sm" title="左揃え"><AlignLeft size={16}/></button>
                             <button onClick={() => onAlign && onAlign('center')} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 flex justify-center shadow-sm" title="左右中央揃え"><AlignHorizontalJustifyCenter size={16}/></button>
                             <button onClick={() => onAlign && onAlign('right')} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 flex justify-center shadow-sm" title="右揃え"><AlignRight size={16}/></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                             <button onClick={() => onAlign && onAlign('top')} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 flex justify-center shadow-sm" title="上揃え"><ArrowUpToLine size={16}/></button>
                             <button onClick={() => onAlign && onAlign('middle')} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 flex justify-center shadow-sm" title="上下中央揃え"><AlignVerticalJustifyCenter size={16}/></button>
                             <button onClick={() => onAlign && onAlign('bottom')} className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 flex justify-center shadow-sm" title="下揃え"><ArrowDownToLine size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => onAlign && onAlign('distribute-h')} className="px-2 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs flex items-center gap-1 justify-center shadow-sm" title="左右等間隔"><AlignHorizontalJustifyCenter size={14}/> 左右等間隔</button>
                             <button onClick={() => onAlign && onAlign('distribute-v')} className="px-2 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs flex items-center gap-1 justify-center shadow-sm" title="上下等間隔"><AlignVerticalJustifyCenter size={14}/> 上下等間隔</button>
                        </div>
                    </Section>
                    <Section title="スタイル一括変更">
                        {/* Fix: Pass the readOnly prop */}
                        <ColorPicker label="背景色 (塗り)" onChange={(c) => onChange({ style: { backgroundColor: c } })} readOnly={readOnly} />
                        <ColorPicker label="枠線色" onChange={(c) => onChange({ style: { borderColor: c, borderWidth: 2 } })} readOnly={readOnly} />
                        <div className="mt-2"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">不透明度</label><input type="range" min="0" max="1" step="0.1" onChange={(e) => onChange({ style: { opacity: parseFloat(e.target.value) } })} className="w-full accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly} /></div>
                    </Section>
                    <button onClick={onDeleteElement} className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-sm"><Trash2 size={16}/> まとめて削除</button>
               </div>
          </div>
      );
  }

  // --- GLOBAL SETTINGS VIEW ---
  if (!element) {
      const reversedElementsWithIndex = currentSlide.elements.map((el, i) => ({ el, i })).reverse();
      const animatedElements = currentSlide.elements.filter(el => el.animation && el.animation.type !== 'none').sort((a, b) => (a.animation?.step || 0) - (b.animation?.step || 0));
      return (
          <div className={`flex flex-col h-full bg-slate-50/50 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`} onMouseDown={onMouseDownPrevent}>
              <div className="flex px-4 pt-4 gap-2 mb-2">
                  <button onClick={() => setSettingsTab('home')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${settingsTab === 'home' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:bg-white/50'}`}>設定</button>
                  <button onClick={() => setSettingsTab('layers')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${settingsTab === 'layers' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:bg-white/50'}`}>レイヤー</button>
                  <button onClick={() => setSettingsTab('anim')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${settingsTab === 'anim' ? 'bg-white text-brand-primary shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:bg-white/50'}`}>アニメ</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {settingsTab === 'home' && (
                      <div className="space-y-4">
                           <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
                               <div className="relative z-10">
                                   <div className="flex items-center gap-2 mb-2 font-bold text-sm"><Lightbulb size={16} className="text-yellow-300 fill-yellow-300"/> デザインアイデア</div>
                                   <p className="text-[10px] opacity-90 mb-3 leading-relaxed">AIがスライドの内容を分析し、最適なレイアウトを提案します。</p>
                                   <button onClick={onDesignIdeas} className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2" disabled={readOnly}><Sparkles size={12}/> アイデアを表示</button>
                               </div>
                               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                           </div>

                           <Section title="スライド背景">
                               {/* Fix: Pass the readOnly prop */}
                               <ColorPicker label="背景色" color={currentSlide.background} onChange={(c) => onSlideChange({ background: c, backgroundGradient: undefined })} readOnly={readOnly} />
                               <div className="mt-3">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">グラデーション</label>
                                   <div className="grid grid-cols-4 gap-2">
                                       {['linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)', 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)', 'linear-gradient(to right, #fa709a 0%, #fee140 100%)', 'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)', 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)'].map((g, i) => (
                                           <button key={i} onClick={() => { if(readOnly) {alert("閲覧モードでは背景を変更できません。"); return;} onSlideChange({backgroundGradient: g}); }} className="aspect-square rounded-lg border border-slate-200 hover:ring-2 ring-brand-primary transition-all shadow-sm" style={{ background: g }} disabled={readOnly} />
                                       ))}
                                   </div>
                               </div>
                               <button onClick={() => { if(readOnly) {alert("閲覧モードでは背景をリセットできません。"); return;} onSlideChange({ background: '#ffffff', backgroundGradient: undefined }); }} className="mt-3 w-full py-2 text-xs text-slate-500 font-bold border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors" disabled={readOnly}>背景リセット</button>
                           </Section>
                           
                           <Section title="レイアウト">
                               <div className="space-y-2">
                                   {['title', 'title-body', 'two-col', 'center'].map(l => (
                                       <button key={l} className="w-full text-left p-2 rounded-lg hover:bg-white text-xs font-bold text-slate-600 border border-transparent hover:border-slate-200 transition-all" disabled={readOnly}>
                                           {l}
                                       </button>
                                   ))}
                               </div>
                           </Section>

                           <Section title="キャンバスサイズ">
                               <div className="grid grid-cols-2 gap-2">
                                   <div><label className="text-[9px] text-slate-400">幅</label><input type="number" value={projectWidth} onChange={(e) => onResizeProject(parseInt(e.target.value), projectHeight)} className="w-full text-xs border border-slate-200 rounded p-1" disabled={readOnly} /></div>
                                   <div><label className="text-[9px] text-slate-400">高さ</label><input type="number" value={projectHeight} onChange={(e) => onResizeProject(projectWidth, parseInt(e.target.value))} className="w-full text-xs border border-slate-200 rounded p-1" disabled={readOnly} /></div>
                               </div>
                           </Section>
                      </div>
                  )}

                  {settingsTab === 'layers' && (
                      <div className="space-y-2">
                          {reversedElementsWithIndex.map(({el, i}) => (
                              <div 
                                key={el.id} 
                                draggable={!readOnly}
                                onDragStart={(e) => handleDragStart(e, i)}
                                onDragOver={(e) => handleDragOver(e, i)}
                                onDrop={(e) => handleDrop(e, i)}
                                onClick={() => onSelectElement(el.id)} 
                                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 cursor-pointer hover:border-brand-primary group transition-all"
                              >
                                  <div className="text-slate-300 cursor-grab active:cursor-grabbing"><GripVertical size={12}/></div>
                                  <div className="p-1.5 rounded bg-slate-100 text-slate-500">{el.type === 'text' ? <Type size={14}/> : el.type === 'image' ? <ImageIcon size={14}/> : <Square size={14}/>}</div>
                                  <span className="text-xs font-bold text-slate-600 truncate flex-1">{el.type === 'text' ? (el.content?.replace(/<[^>]*>/g, '').substring(0,10) || 'Text') : el.type}</span>
                                  {el.locked && <Lock size={12} className="text-orange-400"/>}
                              </div>
                          ))}
                          {reversedElementsWithIndex.length === 0 && <p className="text-xs text-slate-400 text-center py-4">要素がありません</p>}
                      </div>
                  )}

                  {settingsTab === 'anim' && (
                      <div>
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-bold text-slate-500 uppercase">アニメーション順序</h4>
                              <button onClick={onPlayPreview} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors" title="プレビュー再生" disabled={readOnly}><Play size={14} fill="currentColor"/></button>
                          </div>
                          {animatedElements.map((el, idx) => (
                              <div key={el.id} draggable={!readOnly} onDragStart={(e) => handleAnimDragStart(e, idx)} onDragOver={(e) => handleAnimDragOver(e, idx)} onDrop={(e) => handleAnimDrop(e, idx)} className="bg-white p-3 rounded-xl border border-slate-200 mb-2 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2">
                                      <div className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                                      <span className="text-xs font-bold text-slate-700 truncate flex-1">{el.type === 'text' ? el.content?.substring(0, 10) : el.type}</span>
                                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{el.animation?.type}</span>
                                  </div>
                                  {renderAnimationControl(el, true)}
                              </div>
                          ))}
                          {animatedElements.length === 0 && <p className="text-xs text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">アニメーションが設定されている要素がありません</p>}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- ELEMENT SPECIFIC PROPERTIES ---
  return (
    <div className={`flex flex-col h-full bg-slate-50/50 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`} onMouseDown={onMouseDownPrevent}>
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {element.type === 'text' && <Type size={16} className="text-brand-primary"/>}
                {element.type === 'image' && <ImageIcon size={16} className="text-brand-primary"/>}
                {element.type === 'table' && <List size={16} className="text-brand-primary"/>}
                {!['text','image','table'].includes(element.type) && <Square size={16} className="text-brand-primary"/>}
                <span className="capitalize">{element.type}</span>
            </h3>
            <div className="flex gap-1">
                <button onClick={() => onChange({ locked: !element.locked })} className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${element.locked ? 'text-orange-500' : 'text-slate-400'}`} title={element.locked ? "ロック解除" : "ロック"} disabled={readOnly}>
                    {element.locked ? <Lock size={14}/> : <Unlock size={14}/>}
                </button>
                <button onClick={onDeleteElement} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="削除" disabled={readOnly}>
                    <Trash2 size={14}/>
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
            {element.type === 'text' && (
                <TextProperties element={element} onStyleChange={(updates) => onChange({ style: { ...element.style, ...updates } })} readOnly={readOnly} />
            )}

            {element.type === 'image' && (
                <ImageProperties element={element} onChange={(k, v) => onChange({ style: { ...element.style, [k]: v } })} readOnly={readOnly} />
            )}

            {element.type === 'table' && (
                <TableProperties element={element} onChange={(k, v) => k === 'tableData' ? onChange({ tableData: v }) : onChange({ style: { ...element.style, [k]: v } })} renderAnimationUI={renderAnimationControl} readOnly={readOnly} />
            )}

            {/* Shape Properties (Shared including Path) */}
            {['rectangle', 'circle', 'triangle', 'star', 'diamond', 'hexagon', 'arrow', 'bubble', 'path'].includes(element.type) && (
                <ShapeProperties element={element} onChange={(k, v) => onChange({ style: { ...element.style, [k]: v } })} readOnly={readOnly} />
            )}

            {/* Common Animation Section (Except Table which handles it internally) */}
            {element.type !== 'table' && (
                <Section title="アニメーション" defaultOpen={!!element.animation?.type && element.animation.type !== 'none'}>
                    {renderAnimationControl(element)}
                </Section>
            )}
        </div>
    </div>
  );
};