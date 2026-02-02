
import React, { useState } from 'react';
import { ZoomIn, ZoomOut, FileText, Layout, ChevronUp, ChevronDown, Grid } from 'lucide-react';

interface BottomBarProps {
    zoom: number;
    onZoomChange: (z: number) => void;
    slideNote: string;
    onNoteChange: (t: string) => void;
    slideSizeLabel: string;
    showGrid?: boolean;
    onToggleGrid?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ zoom, onZoomChange, slideNote, onNoteChange, slideSizeLabel, showGrid, onToggleGrid }) => {
    const [showNotes, setShowNotes] = useState(false);

    return (
        <div className="bg-white border-t border-slate-200 z-50 flex flex-col shrink-0">
            {showNotes && (
                <div className="h-40 border-b border-slate-200 bg-slate-50 p-4 flex flex-col animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><FileText size={14}/> スピーカーノート</span>
                         <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-slate-600"><ChevronDown size={16}/></button>
                    </div>
                    <textarea 
                        value={slideNote || ''}
                        onChange={(e) => onNoteChange(e.target.value)}
                        className="flex-1 w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
                        placeholder="ここに発表用メモを入力..."
                    />
                </div>
            )}
            <div className="h-10 px-4 flex items-center justify-between bg-white text-slate-600 text-xs">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowNotes(!showNotes)} 
                        className={`flex items-center gap-2 hover:bg-slate-100 px-2 py-1 rounded transition-colors ${showNotes ? 'bg-orange-50 text-brand-primary font-bold' : ''}`}
                    >
                        <FileText size={14} /> <span>ノート</span>
                        {showNotes ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}
                    </button>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Layout size={14}/>
                        <span>{slideSizeLabel}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={onToggleGrid} 
                        className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-orange-50 text-brand-primary shadow-inner' : 'hover:bg-slate-100 text-slate-400'}`} 
                        title="グリッド表示切替"
                    >
                        <Grid size={14} />
                    </button>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="w-32 flex items-center gap-2">
                        <button onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))} className="p-1 hover:bg-slate-100 rounded"><ZoomOut size={14}/></button>
                        <input 
                            type="range" min="10" max="200" value={zoom * 100} 
                            onChange={(e) => onZoomChange(parseInt(e.target.value) / 100)} 
                            className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none accent-brand-primary"
                        />
                        <button onClick={() => onZoomChange(Math.min(4.0, zoom + 0.1))} className="p-1 hover:bg-slate-100 rounded"><ZoomIn size={14}/></button>
                    </div>
                    <span className="w-10 text-right font-mono">{Math.round(zoom * 100)}%</span>
                </div>
            </div>
        </div>
    );
};
