
import React, { useState } from 'react';
import { SlideElement } from '../../types';
import { Table, AlignLeft, AlignCenter, AlignRight, MoveVertical, Type, Grid, PlusSquare, MinusSquare, Layout, Film, AlignJustify, ArrowUp, ArrowDown, Columns, Rows, PaintBucket, ALargeSmall } from 'lucide-react';
import { ColorPicker } from '../ui/ColorPicker';
import { Section } from '../ui/Section';

interface TablePropertiesProps {
  element: SlideElement;
  onChange: (key: string, value: any) => void;
  renderAnimationUI?: (el: SlideElement) => React.ReactNode;
  readOnly?: boolean; // New prop
}

export const TableProperties: React.FC<TablePropertiesProps> = ({ element, onChange, renderAnimationUI, readOnly = false }) => {
  const s = element.style;
  const [tab, setTab] = useState<'struct'|'style'|'text'|'anim'>('struct');

  return (
    <>
    <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
        <button onClick={() => setTab('struct')} className={`flex-1 text-[10px] font-bold py-1.5 rounded ${tab==='struct' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`} disabled={readOnly}>構造</button>
        <button onClick={() => setTab('style')} className={`flex-1 text-[10px] font-bold py-1.5 rounded ${tab==='style' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`} disabled={readOnly}>デザイン</button>
        <button onClick={() => setTab('text')} className={`flex-1 text-[10px] font-bold py-1.5 rounded ${tab==='text' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`} disabled={readOnly}>テキスト</button>
        <button onClick={() => setTab('anim')} className={`flex-1 text-[10px] font-bold py-1.5 rounded ${tab==='anim' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500'}`}><Film size={10} className="inline"/></button>
    </div>

    {tab === 'struct' && (
        <div className="space-y-4 animate-in fade-in">
            <Section title="行と列">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1"><Rows size={12}/> 行 (Row)</span>
                        <div className="flex gap-1">
                            <button onClick={() => document.getElementById('btn-add-table-row')?.click()} className="flex-1 py-2 border border-slate-200 rounded bg-white hover:bg-slate-50 flex items-center justify-center gap-1 text-[10px] text-slate-600 shadow-sm" disabled={readOnly}><PlusSquare size={12}/>追加</button>
                            <button onClick={() => document.getElementById('btn-remove-table-row')?.click()} className="flex-1 py-2 border border-slate-200 rounded bg-white hover:bg-red-50 hover:text-red-500 flex items-center justify-center gap-1 text-[10px] text-slate-600 shadow-sm" disabled={readOnly}><MinusSquare size={12}/>削除</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1"><Columns size={12}/> 列 (Col)</span>
                        <div className="flex gap-1">
                            <button onClick={() => document.getElementById('btn-add-table-col')?.click()} className="flex-1 py-2 border border-slate-200 rounded bg-white hover:bg-slate-50 flex items-center justify-center gap-1 text-[10px] text-slate-600 shadow-sm" disabled={readOnly}><PlusSquare size={12}/>追加</button>
                            <button onClick={() => document.getElementById('btn-remove-table-col')?.click()} className="flex-1 py-2 border border-slate-200 rounded bg-white hover:bg-red-50 hover:text-red-500 flex items-center justify-center gap-1 text-[10px] text-slate-600 shadow-sm" disabled={readOnly}><MinusSquare size={12}/>削除</button>
                        </div>
                    </div>
                </div>
            </Section>
            
            <Section title="セル・パディング">
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">横パディング</label>
                          <input type="number" min="0" max="40" value={s.cellPaddingX || 8} onChange={(e) => onChange('cellPaddingX', parseInt(e.target.value))} className="w-full text-xs border border-slate-200 rounded p-1.5" disabled={readOnly}/>
                     </div>
                     <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">縦パディング</label>
                          <input type="number" min="0" max="40" value={s.cellPaddingY || 4} onChange={(e) => onChange('cellPaddingY', parseInt(e.target.value))} className="w-full text-xs border border-slate-200 rounded p-1.5" disabled={readOnly}/>
                     </div>
                 </div>
            </Section>
            
            <Section title="枠線・結合">
                <div className="flex items-center gap-2 mb-2">
                     <label className="text-[9px] font-bold text-slate-500 uppercase w-16">ボーダー結合</label>
                     <select value={s.tableBorderCollapse || 'collapse'} onChange={(e) => onChange('tableBorderCollapse', e.target.value)} className="flex-1 text-xs border border-slate-200 rounded p-1.5 bg-white" disabled={readOnly}>
                         <option value="collapse">結合 (Collapse)</option>
                         <option value="separate">分離 (Separate)</option>
                     </select>
                </div>
            </Section>
        </div>
    )}

    {tab === 'style' && (
        <div className="space-y-4 animate-in fade-in">
             <Section title="ヘッダー設定">
                 <div className="flex items-center justify-between mb-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Table size={12}/> ヘッダー行を表示</label>
                     <input type="checkbox" checked={!!element.tableData?.hasHeader} onChange={(e) => onChange('tableData', { ...element.tableData, hasHeader: e.target.checked })} className="accent-brand-primary" disabled={readOnly}/>
                 </div>
                 {element.tableData?.hasHeader && (
                     <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-slate-100">
                         <ColorPicker label="背景色" color={s.headerColor} onChange={(c) => onChange('headerColor', c)} readOnly={readOnly} />
                         <ColorPicker label="文字色" color={s.headerTextColor} onChange={(c) => onChange('headerTextColor', c)} readOnly={readOnly} />
                     </div>
                 )}
             </Section>
             
             <Section title="ボディ・縞模様">
                 <ColorPicker label="全体背景" color={s.backgroundColor} onChange={(c) => onChange('backgroundColor', c)} readOnly={readOnly} />
                 <div className="flex items-center justify-between mt-3 mb-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Grid size={12}/> 縞模様 (ゼブラ)</label>
                     <input type="checkbox" checked={!!s.tableStriped} onChange={(e) => onChange('tableStriped', e.target.checked)} className="accent-brand-primary" disabled={readOnly}/>
                 </div>
                 {s.tableStriped && <div className="pl-2"><ColorPicker label="縞の色" color={s.stripeColor} onChange={(c) => onChange('stripeColor', c)} readOnly={readOnly} /></div>}
             </Section>
             
             <Section title="罫線スタイル">
                 <ColorPicker label="罫線色" color={s.borderColor} onChange={(c) => onChange('borderColor', c)} readOnly={readOnly} />
                 <div className="grid grid-cols-2 gap-2 mt-2">
                     <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">太さ</label>
                         <input type="number" min="0" max="10" value={s.borderWidth || 1} onChange={(e) => onChange('borderWidth', parseInt(e.target.value))} className="w-full text-xs border border-slate-200 rounded p-1.5" disabled={readOnly}/>
                     </div>
                     <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">種類</label>
                         <select value={s.borderStyle || 'solid'} onChange={(e) => onChange('borderStyle', e.target.value)} className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white" disabled={readOnly}>
                             <option value="solid">実線</option>
                             <option value="dashed">破線</option>
                             <option value="dotted">点線</option>
                             <option value="double">二重</option>
                         </select>
                     </div>
                 </div>
             </Section>
        </div>
    )}

    {tab === 'text' && (
        <div className="space-y-4 animate-in fade-in">
             <Section title="文字スタイル">
                 <div className="grid grid-cols-2 gap-3 mb-3">
                     <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><ALargeSmall size={10}/>サイズ</label>
                         <input type="number" value={s.fontSize || 16} onChange={(e) => onChange('fontSize', parseInt(e.target.value))} className="w-full text-xs border border-slate-200 rounded p-1.5" disabled={readOnly}/>
                     </div>
                     <ColorPicker label="文字色" color={s.color} onChange={(c) => onChange('color', c)} readOnly={readOnly} />
                 </div>
             </Section>

             <Section title="配置">
                 <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">水平方向</label>
                 <div className="flex bg-slate-100 rounded-lg p-0.5 mb-3">
                    {['left', 'center', 'right'].map(align => (
                        <button key={align} onClick={() => onChange('textAlign', align)} className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${s.textAlign === align ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400'}`} disabled={readOnly}>
                            {align === 'left' ? <AlignLeft size={14}/> : align === 'center' ? <AlignCenter size={14}/> : <AlignRight size={14}/>}
                        </button>
                    ))}
                 </div>
                 
                 <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">垂直方向</label>
                 <div className="flex bg-slate-100 rounded-lg p-0.5">
                    {['top', 'middle', 'bottom'].map(align => (
                        <button key={align} onClick={() => onChange('verticalAlign', align)} className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${s.verticalAlign === align ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400'}`} disabled={readOnly}>
                            <MoveVertical size={14} className={align === 'top' ? '-translate-y-0.5' : align === 'bottom' ? 'translate-y-0.5' : ''}/>
                        </button>
                    ))}
                 </div>
             </Section>
        </div>
    )}
    
    {tab === 'anim' && (
        <div className="space-y-4 animate-in fade-in">
            {renderAnimationUI ? renderAnimationUI(element) : <p className="text-xs text-slate-400">アニメーション設定は利用できません</p>}
        </div>
    )}
    </>
  );
};