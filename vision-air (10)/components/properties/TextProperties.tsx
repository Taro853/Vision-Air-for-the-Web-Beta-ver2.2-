
import React from 'react';
import { SlideElement } from '../../types';
import { Type, Minus, Plus, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Strikethrough, MoveVertical, ChevronsUpDown, PaintBucket, Highlighter, Grid, ArrowDown, X } from 'lucide-react';
import { ColorPicker } from '../ui/ColorPicker';
import { Section } from '../ui/Section';
import { FONT_COLLECTION } from '../../data/fonts';
import { WORD_ART_PRESETS } from '../../data/wordArt';

interface TextPropertiesProps {
  element: SlideElement;
  onStyleChange: (updates: Partial<SlideElement['style']>) => void;
  readOnly?: boolean; // New prop
}

const GRADIENT_PRESETS = [
    'linear-gradient(to right, #F97316, #3B82F6)',
    'linear-gradient(to right, #EC4899, #8B5CF6)',
    'linear-gradient(to right, #10B981, #3B82F6)',
    'linear-gradient(to right, #F59E0B, #EF4444)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
    'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)',
];

export const TextProperties: React.FC<TextPropertiesProps> = ({ element, onStyleChange, readOnly = false }) => {
  const s = element.style;

  const toggleStyle = (key: keyof SlideElement['style'], onVal: any, offVal: any = 'normal') => {
      if (readOnly) { alert("閲覧モードではスタイルを変更できません。"); return; }
      onStyleChange({ [key]: s[key] === onVal ? offVal : onVal });
  };

  const getResetStyle = (): Partial<SlideElement['style']> => ({
      textShadow: 'none',
      WebkitTextStroke: 'none',
      gradient: undefined,
      backgroundClip: undefined,
      WebkitBackgroundClip: undefined,
      WebkitTextFillColor: undefined,
      fontFamily: '"Noto Sans JP", sans-serif',
      color: '#334155',
      fontWeight: 'normal',
      fontStyle: 'normal',
      wordArtId: undefined
  });

  const applyWordArt = (preset: any) => {
      if (readOnly) { alert("閲覧モードではワードアートを適用できません。"); return; }
      const resetProps = getResetStyle();
      const newStyles = { ...preset.style };
      onStyleChange({ ...resetProps, ...newStyles, wordArtId: preset.id });
  };

  const resetWordArt = () => {
      if (readOnly) { alert("閲覧モードではワードアートをリセットできません。"); return; }
      onStyleChange(getResetStyle());
  };
  
  const applyGradient = (grad: string) => {
      if (readOnly) { alert("閲覧モードではグラデーションを適用できません。"); return; }
      onStyleChange({
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          gradient: grad
      });
  };

  return (
    <>
    <Section title="フォント & スタイル">
        <select 
            value={s.fontFamily || '"Noto Sans JP", sans-serif'} 
            onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
            className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-primary mb-3"
            disabled={readOnly}
        >
            {FONT_COLLECTION.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
        </select>

        <div className="flex items-center gap-2 mb-3">
             <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white flex-1">
                <button onClick={() => onStyleChange({ fontSize: Math.max(8, (s.fontSize || 16) - 2) })} className="p-2 hover:bg-slate-50 text-slate-500" disabled={readOnly}><Minus size={12}/></button>
                <input type="number" value={s.fontSize || 16} onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value) })} className="flex-1 text-center text-xs font-bold text-slate-700 outline-none w-8" disabled={readOnly}/>
                <button onClick={() => onStyleChange({ fontSize: Math.min(300, (s.fontSize || 16) + 2) })} className="p-2 hover:bg-slate-50 text-slate-500" disabled={readOnly}><Plus size={12}/></button>
            </div>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-3">
            <button onClick={() => toggleStyle('fontWeight', 'bold')} className={`flex-1 p-1.5 rounded hover:bg-white transition-all flex items-center justify-center ${s.fontWeight === 'bold' || s.fontWeight === '700' || s.fontWeight === '900' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500'}`} disabled={readOnly}><Bold size={14}/></button>
            <button onClick={() => toggleStyle('fontStyle', 'italic')} className={`flex-1 p-1.5 rounded hover:bg-white transition-all flex items-center justify-center ${s.fontStyle === 'italic' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500'}`} disabled={readOnly}><Italic size={14}/></button>
            <button onClick={() => toggleStyle('textDecoration', 'underline', 'none')} className={`flex-1 p-1.5 rounded hover:bg-white transition-all flex items-center justify-center ${s.textDecoration?.includes('underline') ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500'}`} disabled={readOnly}><Underline size={14}/></button>
            <button onClick={() => toggleStyle('textDecoration', 'line-through', 'none')} className={`flex-1 p-1.5 rounded hover:bg-white transition-all flex items-center justify-center ${s.textDecoration?.includes('line-through') ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500'}`} disabled={readOnly}><Strikethrough size={14}/></button>
        </div>

        <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><ArrowDown size={12}/> 縦書き</label>
            <input type="checkbox" checked={s.writingMode === 'vertical-rl'} onChange={(e) => onStyleChange({ writingMode: e.target.checked ? 'vertical-rl' : 'horizontal-tb' })} className="accent-brand-primary" disabled={readOnly}/>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
             <ColorPicker label="文字色" color={s.color} onChange={(c) => onStyleChange({ color: c })} icon={PaintBucket} readOnly={readOnly} />
             <ColorPicker label="ハイライト" color={s.backgroundColor} onChange={(c) => onStyleChange({ backgroundColor: c })} icon={Highlighter} readOnly={readOnly} />
        </div>
    </Section>

    <Section title="文字の塗りつぶし">
         <div className="flex items-center justify-between mb-2">
             <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><PaintBucket size={10}/> グラデーション文字</label>
             <input type="checkbox" checked={s.backgroundClip === 'text'} onChange={(e) => {
                 if (readOnly) { alert("閲覧モードでは文字の塗りつぶしを変更できません。"); return; }
                 if(e.target.checked) applyGradient(GRADIENT_PRESETS[0]);
                 else {
                     onStyleChange({
                         backgroundClip: undefined,
                         WebkitBackgroundClip: undefined,
                         WebkitTextFillColor: undefined
                     });
                 }
             }} className="accent-brand-primary" disabled={readOnly}/>
         </div>
         
         {s.backgroundClip === 'text' && (
             <div className="pl-2 border-l-2 border-slate-100 space-y-2 animate-in fade-in">
                 <div className="grid grid-cols-4 gap-1">
                     {GRADIENT_PRESETS.map((g, i) => (
                         <button key={i} onClick={() => applyGradient(g)} className="h-6 rounded border border-slate-200 hover:scale-110 transition-transform shadow-sm" style={{ background: g }} disabled={readOnly} />
                     ))}
                 </div>
                 <div className="mt-2">
                     <label className="text-[9px] text-slate-400 block mb-1">カスタムCSS</label>
                     <input 
                        type="text" 
                        value={s.gradient || ''} 
                        onChange={(e) => applyGradient(e.target.value)}
                        className="w-full text-[10px] border border-slate-200 rounded p-1"
                        placeholder="linear-gradient(...)"
                        disabled={readOnly}
                     />
                 </div>
             </div>
         )}
    </Section>

    <Section title="段落・間隔">
        <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">配置</label>
        <div className="flex bg-slate-100 rounded-lg p-0.5 mb-3">
            {['left', 'center', 'right', 'justify'].map(align => (
                <button key={align} onClick={() => onStyleChange({ textAlign: align as any })} className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${s.textAlign === align ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400'}`} disabled={readOnly}>
                    {align === 'left' ? <AlignLeft size={14}/> : align === 'center' ? <AlignCenter size={14}/> : align === 'right' ? <AlignRight size={14}/> : <AlignJustify size={14}/>}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
                 <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><ChevronsUpDown size={10} className="rotate-90"/> 文字間隔</label>
                 <div className="flex items-center gap-2">
                     <input type="range" min="-2" max="20" step="0.5" value={parseFloat(s.letterSpacing || '0')} onChange={(e) => onStyleChange({ letterSpacing: `${e.target.value}px` })} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none accent-brand-primary" disabled={readOnly}/>
                     <span className="text-[9px] text-slate-400 w-6 text-right">{s.letterSpacing || 0}</span>
                 </div>
            </div>
            <div>
                 <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><MoveVertical size={10}/> 行間</label>
                 <div className="flex items-center gap-2">
                     <input type="range" min="0.8" max="3.0" step="0.1" value={parseFloat(s.lineHeight || '1.5')} onChange={(e) => onStyleChange({ lineHeight: e.target.value })} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none accent-brand-primary" disabled={readOnly}/>
                     <span className="text-[9px] text-slate-400 w-6 text-right">{s.lineHeight || 1.5}</span>
                 </div>
            </div>
        </div>
    </Section>

    <Section title="ワードアート & エフェクト">
        <div className="grid grid-cols-3 gap-2 mb-4">
            <button 
                onClick={resetWordArt} 
                className={`h-12 rounded-lg border flex flex-col items-center justify-center text-sm transition-all hover:scale-105 active:scale-95 ${!s.wordArtId ? 'border-brand-primary bg-slate-50 ring-2 ring-brand-primary/20' : 'border-slate-200 bg-white hover:border-brand-primary'}`}
                title="標準 (なし)"
                disabled={readOnly}
            >
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center mb-1"><X size={14} className="text-slate-400"/></div>
            </button>
            {WORD_ART_PRESETS.map(wa => (
                <button 
                    key={wa.id} 
                    onClick={() => applyWordArt(wa)} 
                    className={`h-12 rounded-lg border flex items-center justify-center text-sm transition-all hover:scale-105 active:scale-95 overflow-hidden relative ${s.wordArtId === wa.id ? 'border-brand-primary bg-orange-50 ring-2 ring-brand-primary/20' : 'border-slate-200 bg-white hover:border-brand-primary'}`}
                    title={wa.name}
                    disabled={readOnly}
                >
                    <span style={{...wa.style as any, fontSize: '16px', whiteSpace: 'nowrap'}}>Aa</span>
                    {s.wordArtId === wa.id && <div className="absolute top-0 right-0 w-3 h-3 bg-brand-primary rounded-bl-lg"></div>}
                </button>
            ))}
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-50">
             <div className="flex items-center justify-between">
                 <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><Grid size={10}/> ドロップシャドウ</label>
                 <input type="checkbox" checked={!!s.textShadow && s.textShadow !== 'none'} onChange={(e) => onStyleChange({ textShadow: e.target.checked ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none' })} className="accent-brand-primary" disabled={readOnly}/>
             </div>
        </div>
    </Section>
    </>
  );
};
