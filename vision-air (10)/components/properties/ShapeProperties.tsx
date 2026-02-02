
import React from 'react';
import { SlideElement } from '../../types';
import { PaintBucket, Grid, MoveHorizontal, MoveVertical } from 'lucide-react';
import { ColorPicker } from '../ui/ColorPicker';
import { Section } from '../ui/Section';

interface ShapePropertiesProps {
  element: SlideElement;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean; // New prop
}

export const ShapeProperties: React.FC<ShapePropertiesProps> = ({ element, onChange, readOnly = false }) => {
  const s = element.style;

  const applyGradient = (start: string, end: string, angle: number) => {
      if (readOnly) { alert("閲覧モードではグラデーションを適用できません。"); return; }
      onChange('gradient', `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`);
      onChange('backgroundColor', 'transparent'); 
  };

  // Helper to extract colors from existing gradient string if possible, else default
  const getGradientValues = () => {
      if (!s.gradient || !s.gradient.includes('linear-gradient')) return { start: '#FF9A9E', end: '#FECFEF', angle: 135 };
      try {
          // Very basic parsing for linear-gradient(135deg, #start 0%, #end 100%)
          const match = s.gradient.match(/(\d+)deg,\s*(#[a-fA-F0-9]{3,6}).*?,\s*(#[a-fA-F0-9]{3,6})/);
          if (match) return { angle: parseInt(match[1]), start: match[2], end: match[3] };
      } catch(e) {}
      return { start: '#FF9A9E', end: '#FECFEF', angle: 135 };
  };

  const currentGrad = getGradientValues();

  return (
    <>
    <Section title="塗りつぶし・線">
        <ColorPicker label="塗りつぶし" color={s.backgroundColor} onChange={(c) => { onChange('backgroundColor', c); onChange('gradient', undefined); }} icon={PaintBucket} readOnly={readOnly} />
        
        <div className="mt-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
             <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block">グラデーション作成</label>
             <div className="flex gap-2 mb-2">
                 <div className="flex-1">
                     <span className="text-[8px] text-slate-400 block mb-1">開始色</span>
                     <input type="color" value={currentGrad.start} onChange={(e) => applyGradient(e.target.value, currentGrad.end, currentGrad.angle)} className="w-full h-6 rounded cursor-pointer" disabled={readOnly}/>
                 </div>
                 <div className="flex-1">
                     <span className="text-[8px] text-slate-400 block mb-1">終了色</span>
                     <input type="color" value={currentGrad.end} onChange={(e) => applyGradient(currentGrad.start, e.target.value, currentGrad.angle)} className="w-full h-6 rounded cursor-pointer" disabled={readOnly}/>
                 </div>
             </div>
             <div className="flex items-center gap-2">
                 <span className="text-[8px] text-slate-400 w-6">角度</span>
                 <input type="range" min="0" max="360" value={currentGrad.angle} onChange={(e) => applyGradient(currentGrad.start, currentGrad.end, parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none" disabled={readOnly}/>
                 <span className="text-[8px] text-slate-500 w-6 text-right">{currentGrad.angle}°</span>
             </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
            <div className="flex-1">
                 <ColorPicker label="枠線" color={s.borderColor} onChange={(c) => { onChange('borderColor', c); if (!s.borderWidth) onChange('borderWidth', 2); }} readOnly={readOnly} />
            </div>
        </div>
        {s.borderColor && (
            <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                     <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">太さ</label>
                     <input type="number" value={s.borderWidth || 0} onChange={(e) => onChange('borderWidth', parseInt(e.target.value))} className="w-full text-xs border border-slate-200 rounded py-1 px-1 bg-white outline-none focus:border-brand-primary" disabled={readOnly} />
                </div>
                <div>
                     <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">種類</label>
                     <select value={s.borderStyle || 'solid'} onChange={(e) => onChange('borderStyle', e.target.value)} className="w-full text-xs border border-slate-200 rounded py-1 px-1 bg-white outline-none" disabled={readOnly}>
                        <option value="solid">実線</option>
                        <option value="dashed">破線</option>
                        <option value="dotted">点線</option>
                        <option value="double">二重線</option>
                     </select>
                </div>
            </div>
        )}
        <div className="mb-2">
            <div className="flex justify-between mb-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">角丸</label>
                <span className="text-[9px] text-slate-400">{parseInt(s.borderRadius || '0')}px</span>
            </div>
            <input type="range" min="0" max="100" value={parseInt(s.borderRadius || '0')} onChange={(e) => onChange('borderRadius', `${e.target.value}px`)} className="w-full accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly} />
        </div>
    </Section>

    {(element.type === 'arrow' || element.type === 'bubble') && (
        <Section title="形状調整">
             <div className="mb-2">
                 <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">
                     {element.type === 'arrow' ? '矢印の太さ' : 'しっぽの位置'}
                 </label>
                 <input 
                    type="range" min="10" max="90" 
                    value={s.shapeDetail1 || 70} 
                    onChange={(e) => onChange('shapeDetail1', parseInt(e.target.value))} 
                    className="w-full accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" 
                    disabled={readOnly}
                />
             </div>
             <div className="mb-2">
                 <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">
                     {element.type === 'arrow' ? '柄の太さ' : 'しっぽの幅'}
                 </label>
                 <input 
                    type="range" min="10" max="90" 
                    value={s.shapeDetail2 || 60} 
                    onChange={(e) => onChange('shapeDetail2', parseInt(e.target.value))} 
                    className="w-full accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" 
                    disabled={readOnly}
                />
             </div>
        </Section>
    )}

    <Section title="効果・エフェクト">
        <div className="mb-3">
             <div className="flex items-center justify-between mb-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Grid size={10}/> ドロップシャドウ</label>
                 <input type="checkbox" checked={!!s.shadow} onChange={(e) => onChange('shadow', e.target.checked)} className="accent-brand-primary" disabled={readOnly}/>
             </div>
             {s.shadow && (
                 <div className="pl-2 border-l-2 border-slate-100 space-y-2 animate-in fade-in">
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 w-8">色</span>
                        <input type="color" value={s.shadowColor || '#000000'} onChange={(e) => onChange('shadowColor', e.target.value)} className="h-6 flex-1 cursor-pointer rounded" disabled={readOnly} />
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 w-8">X/Y</span>
                        <input type="number" value={s.shadowOffsetX || 0} onChange={(e) => onChange('shadowOffsetX', parseInt(e.target.value))} className="flex-1 w-full text-xs border border-slate-200 rounded p-1" disabled={readOnly} />
                        <input type="number" value={s.shadowOffsetY || 4} onChange={(e) => onChange('shadowOffsetY', parseInt(e.target.value))} className="flex-1 w-full text-xs border border-slate-200 rounded p-1" disabled={readOnly} />
                     </div>
                 </div>
             )}
        </div>
        <div>
            <div className="flex justify-between mb-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">不透明度</label>
                <span className="text-[9px] text-slate-400">{Math.round((s.opacity ?? 1) * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={s.opacity ?? 1} onChange={(e) => onChange('opacity', parseFloat(e.target.value))} className="w-full accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly} />
        </div>
    </Section>

    <Section title="変形・回転">
        <div className="grid grid-cols-2 gap-3 mb-3">
             <button onClick={() => onChange('flipX', !s.flipX)} className={`flex items-center justify-center gap-1 py-1.5 rounded border text-[10px] font-bold ${s.flipX ? 'bg-orange-50 border-brand-primary text-brand-primary' : 'bg-white border-slate-200 text-slate-500'}`} disabled={readOnly}>
                 <MoveHorizontal size={12}/> 左右反転
             </button>
             <button onClick={() => onChange('flipY', !s.flipY)} className={`flex items-center justify-center gap-1 py-1.5 rounded border text-[10px] font-bold ${s.flipY ? 'bg-orange-50 border-brand-primary text-brand-primary' : 'bg-white border-slate-200 text-slate-500'}`} disabled={readOnly}>
                 <MoveVertical size={12}/> 上下反転
             </button>
        </div>
    </Section>
    </>
  );
};
