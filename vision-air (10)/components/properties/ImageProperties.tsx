
import React from 'react';
import { SlideElement } from '../../types';
import { Image as ImageIcon, Crop, Layers, Sun, Eye, Droplet, RefreshCcw, Frame, Maximize, Replace } from 'lucide-react';
import { Section } from '../ui/Section';
import { ColorPicker } from '../ui/ColorPicker';

interface ImagePropertiesProps {
  element: SlideElement;
  onChange: (key: string, value: any) => void;
  readOnly?: boolean; // New prop
}

export const ImageProperties: React.FC<ImagePropertiesProps> = ({ element, onChange, readOnly = false }) => {
  const s = element.style;

  const cleanStyle = () => {
      if (readOnly) { alert("閲覧モードでは画像を編集できません。"); return; }
      const resetProps: Partial<SlideElement['style']> = {
          border: undefined,
          borderWidth: 0,
          borderColor: undefined,
          borderStyle: undefined,
          borderRadius: '0px',
          shadow: false,
          shadowColor: undefined,
          shadowBlur: 0,
          shadowOffsetY: 0,
          shadowOffsetX: 0,
          maskImage: undefined,
          objectFit: 'cover',
          filterGrayscale: 0,
          filterSepia: 0,
          transform: undefined
      };
      Object.entries(resetProps).forEach(([k, v]) => onChange(k, v));
  };

  const applyFrame = (type: string) => {
      if (readOnly) { alert("閲覧モードでは画像を編集できません。"); return; }
      cleanStyle();
      setTimeout(() => {
          if (type === 'polaroid') {
              onChange('borderWidth', 12);
              onChange('borderStyle', 'solid');
              onChange('borderColor', '#ffffff');
              onChange('shadow', true);
              onChange('shadowColor', 'rgba(0,0,0,0.2)');
              onChange('shadowBlur', 10);
              onChange('shadowOffsetY', 4);
          } else if (type === 'circle') {
              onChange('borderRadius', '50%');
          } else if (type === 'rounded') {
              onChange('borderRadius', '24px');
          } else if (type === 'neon') {
              onChange('borderWidth', 4);
              onChange('borderStyle', 'solid');
              onChange('borderColor', '#00ff00');
              onChange('shadow', true);
              onChange('shadowColor', '#00ff00');
              onChange('shadowBlur', 20);
          } else if (type === 'blob') {
               onChange('maskImage', 'radial-gradient(circle at 50% 50%, black 50%, transparent 100%)');
               onChange('borderRadius', '40% 60% 70% 30% / 40% 50% 60% 50%');
          } else if (type === '3d') {
              onChange('transform', 'perspective(500px) rotateY(15deg)');
              onChange('shadow', true);
              onChange('shadowOffsetX', 10);
              onChange('shadowBlur', 20);
              onChange('shadowColor', 'rgba(0,0,0,0.4)');
          } else if (type === 'grayscale') {
              onChange('filterGrayscale', 100);
          } else if (type === 'sepia') {
              onChange('filterSepia', 100);
          } else if (type === 'border') {
              onChange('borderWidth', 8);
              onChange('borderColor', '#1e293b');
          } else if (type === 'shadow') {
              onChange('shadow', true);
              onChange('shadowBlur', 30);
              onChange('shadowOffsetY', 10);
              onChange('shadowColor', 'rgba(0,0,0,0.3)');
          }
      }, 10);
  };

  const PreviewBox = ({ label, style, onClick, active }: any) => (
      <div className="flex flex-col items-center gap-1 cursor-pointer group w-[22%]" onClick={onClick}>
          <div className={`w-full aspect-square bg-slate-200 rounded overflow-hidden relative border transition-all ${active ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-300 group-hover:border-brand-primary'}`}>
               <div className="w-full h-full bg-slate-400" style={style}></div>
          </div>
          <span className={`text-[8px] truncate w-full text-center ${active ? 'text-brand-primary font-bold' : 'text-slate-500 group-hover:text-brand-primary'}`}>{label}</span>
      </div>
  );

  return (
    <>
    <div className="mb-4">
        <button 
            onClick={() => document.getElementById('replace-image-input')?.click()}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            disabled={readOnly}
        >
            <Replace size={14}/> 画像を置換
        </button>
    </div>

    <Section title="トリミング">
        <div className="space-y-3 mb-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1"><Crop size={10}/> クロップ (内側余白)</label>
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 w-8">上下</span>
                <input 
                    type="range" min="0" max="40" 
                    onChange={(e) => {
                        if (readOnly) { alert("閲覧モードでは画像を編集できません。"); return; }
                        const val = parseInt(e.target.value);
                        // Store padding as custom property for now since we manipulate mask/clip path
                        onChange('padding', val);
                        onChange('maskImage', `linear-gradient(to right, transparent ${val}%, black ${val}%, black ${100-val}%), linear-gradient(to bottom, transparent ${val}%, black ${val}%, black ${100-val}%, transparent ${100-val}%)`);
                        onChange('WebkitMaskComposite', 'source-in');
                    }}
                    className="flex-1 accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none"
                    disabled={readOnly}
                />
            </div>
        </div>
    </Section>

    <Section title="スタイルプリセット">
        <div className="flex flex-wrap gap-2 justify-between">
             <PreviewBox label="標準" onClick={() => applyFrame('none')} />
             <PreviewBox label="角丸" style={{borderRadius: '8px'}} onClick={() => applyFrame('rounded')} />
             <PreviewBox label="円形" style={{borderRadius: '50%'}} onClick={() => applyFrame('circle')} />
             <PreviewBox label="ポラロイド" style={{border: '3px solid white', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'}} onClick={() => applyFrame('polaroid')} />
             <PreviewBox label="有機的" style={{borderRadius: '40% 60% / 50%'}} onClick={() => applyFrame('blob')} />
             <PreviewBox label="ネオン" style={{border: '1px solid #0f0', boxShadow: '0 0 3px #0f0'}} onClick={() => applyFrame('neon')} />
             <PreviewBox label="3D回転" style={{transform: 'perspective(50px) rotateY(10deg)'}} onClick={() => applyFrame('3d')} />
             <PreviewBox label="白黒" style={{filter: 'grayscale(100%)'}} onClick={() => applyFrame('grayscale')} />
             <PreviewBox label="セピア" style={{filter: 'sepia(100%)'}} onClick={() => applyFrame('sepia')} />
             <PreviewBox label="太枠" style={{border: '3px solid #333'}} onClick={() => applyFrame('border')} />
        </div>
    </Section>

    <Section title="詳細設定">
        <div className="flex items-center gap-2 mb-2">
            <ColorPicker label="枠線色" color={s.borderColor} onChange={(c) => { onChange('borderColor', c); if(!s.borderWidth) onChange('borderWidth', 4); }} readOnly={readOnly} />
        </div>
        {s.borderColor && (
             <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                     <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">太さ</label>
                     <input type="number" value={s.borderWidth || 0} onChange={(e) => onChange('borderWidth', parseInt(e.target.value))} className="w-full text-xs border border-slate-200 rounded py-1 px-1" disabled={readOnly} />
                </div>
                <div>
                     <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">線種</label>
                     <select value={s.borderStyle || 'solid'} onChange={(e) => onChange('borderStyle', e.target.value)} className="w-full text-xs border border-slate-200 rounded py-1 px-1" disabled={readOnly}>
                        <option value="solid">実線</option>
                        <option value="dashed">破線</option>
                        <option value="double">二重</option>
                     </select>
                </div>
            </div>
        )}
        
        <div className="mb-2">
            <div className="flex justify-between mb-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">角丸</label>
                <span className="text-[9px] text-slate-400">{s.borderRadius || '0px'}</span>
            </div>
            <input type="range" min="0" max="100" value={parseInt(s.borderRadius || '0')} onChange={(e) => onChange('borderRadius', `${e.target.value}px`)} className="w-full accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly} />
        </div>

        <div className="flex items-center gap-2 mt-3">
             <label className="text-[9px] font-bold text-slate-500 uppercase flex-1 flex items-center gap-1"><Maximize size={10}/> フィット</label>
             <select value={s.objectFit || 'cover'} onChange={(e) => onChange('objectFit', e.target.value)} className="text-xs border border-slate-200 rounded p-1 bg-white" disabled={readOnly}>
                 <option value="cover">切り抜き (Cover)</option>
                 <option value="contain">全体 (Contain)</option>
                 <option value="fill">引き伸ばし (Fill)</option>
             </select>
        </div>
    </Section>

    <Section title="フィルター">
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase w-16">グレースケール</span>
                <input type="range" min="0" max="100" value={s.filterGrayscale || 0} onChange={(e) => onChange('filterGrayscale', parseInt(e.target.value))} className="flex-1 accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly}/>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase w-16">セピア</span>
                <input type="range" min="0" max="100" value={s.filterSepia || 0} onChange={(e) => onChange('filterSepia', parseInt(e.target.value))} className="flex-1 accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly}/>
            </div>
            <div className="flex items-center gap-2">
                <Sun size={12} className="text-slate-400"/>
                <label className="text-[9px] font-bold text-slate-500 uppercase w-12">明るさ</label>
                <input type="range" min="0" max="200" value={s.filterBrightness ?? 100} onChange={(e) => onChange('filterBrightness', parseInt(e.target.value))} className="flex-1 accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly}/>
            </div>
             <div className="flex items-center gap-2">
                <RefreshCcw size={12} className="text-slate-400"/>
                <label className="text-[9px] font-bold text-slate-500 uppercase w-12">色相</label>
                <input type="range" min="0" max="360" value={s.filterHueRotate || 0} onChange={(e) => onChange('filterHueRotate', parseInt(e.target.value))} className="flex-1 accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly}/>
            </div>
        </div>
    </Section>

    <Section title="効果">
         <div className="mb-3">
             <div className="flex items-center justify-between mb-2">
                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Layers size={10}/> ブレンドモード</label>
                 <select value={s.mixBlendMode || 'normal'} onChange={(e) => onChange('mixBlendMode', e.target.value)} className="text-xs border border-slate-200 rounded p-1 bg-white" disabled={readOnly}>
                    <option value="normal">通常</option>
                    <option value="multiply">乗算</option>
                    <option value="screen">スクリーン</option>
                    <option value="overlay">オーバーレイ</option>
                 </select>
             </div>
        </div>
         <div className="mb-3">
             <div className="flex justify-between mb-1">
                 <label className="text-[9px] font-bold text-slate-500 uppercase">透明度</label>
                 <span className="text-[9px] text-slate-400">{Math.round((s.opacity ?? 1) * 100)}%</span>
             </div>
             <input type="range" min="0" max="1" step="0.1" value={s.opacity ?? 1} onChange={(e) => onChange('opacity', parseFloat(e.target.value))} className="w-full accent-brand-primary h-1.5 bg-slate-200 rounded-lg appearance-none" disabled={readOnly} />
        </div>
    </Section>
    </>
  );
};
