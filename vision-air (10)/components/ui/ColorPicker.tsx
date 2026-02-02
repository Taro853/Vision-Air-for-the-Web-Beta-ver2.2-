
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const COLORS = [
    '#000000', '#1E293B', '#334155', '#64748B', '#CBD5E1', '#ffffff',
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'
];

export const ColorPicker = ({ label, color, onChange, icon: Icon, readOnly = false }: { label: string, color?: string, onChange: (c: string) => void, icon?: any, readOnly?: boolean }) => {
    const [showPresets, setShowPresets] = useState(false);
    return (
        <div className="mb-2">
             <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    {Icon && <Icon size={10} />} {label}
                </label>
             </div>
             <div className="flex gap-2 relative">
                 <div className={`flex-1 flex items-center h-8 bg-white rounded-lg border border-slate-200 px-2 transition-colors ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-primary'}`} onClick={() => !readOnly && setShowPresets(!showPresets)}>
                     <div className="w-5 h-5 rounded border border-slate-100 shadow-sm mr-2" style={{ backgroundColor: color || 'transparent' }}></div>
                     <span className="text-xs text-slate-600 font-sans flex-1 truncate">{color || 'なし'}</span>
                     <ChevronDown size={12} className="text-slate-400"/>
                 </div>
                 {showPresets && !readOnly && (
                     <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)}></div>
                        <div className="absolute top-9 left-0 w-60 bg-white border border-slate-200 shadow-floating rounded-xl p-3 z-50 grid grid-cols-8 gap-1 animate-in fade-in zoom-in-95">
                            {COLORS.map(c => (
                                <button key={c} onClick={() => { onChange(c); setShowPresets(false); }} className="w-6 h-6 rounded-full border border-slate-100 hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} />
                            ))}
                            <div className="col-span-8 border-t border-slate-100 my-1"></div>
                            <div className="col-span-8 flex items-center gap-2">
                                <span className="text-[9px] text-slate-400">Custom</span>
                                <input type="color" value={color || '#000000'} onChange={(e) => onChange(e.target.value)} className="flex-1 h-6 cursor-pointer rounded" />
                            </div>
                        </div>
                     </>
                 )}
             </div>
        </div>
    );
};
