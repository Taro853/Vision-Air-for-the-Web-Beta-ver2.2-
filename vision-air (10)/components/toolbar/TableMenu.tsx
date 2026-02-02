import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TableMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (r: number, c: number) => void;
    position: { top: number, left: number };
}

export const TableMenu: React.FC<TableMenuProps> = ({ isOpen, onClose, onSelect, position }) => {
    const [grid, setGrid] = useState({ r: 0, c: 0 });

    if (!isOpen) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[999]" onClick={onClose} />
            <div className="table-menu-popup fixed bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-floating z-[1000]" style={{ top: position.top, left: position.left - 80 }}>
                <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500">テーブルサイズ</span>
                <span className="text-xs font-bold text-brand-primary bg-orange-50 px-2 py-0.5 rounded">{grid.r || 1} x {grid.c || 1}</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5" onMouseLeave={() => setGrid({r:0,c:0})}>
                    {[1,2,3,4,5,6].map(r => ( [1,2,3,4,5,6].map(c => (
                        <div key={`${r}-${c}`} className={`w-6 h-6 rounded-md cursor-pointer border transition-all duration-100 ${r <= grid.r && c <= grid.c ? 'bg-brand-primary border-brand-primary shadow-sm scale-105' : 'bg-slate-50 border-slate-200 hover:bg-orange-100'}`} onMouseEnter={() => setGrid({r,c})} onClick={() => { onSelect(r,c); onClose(); }} />
                    ))))}
                </div>
            </div>
        </>, 
        document.body
    );
};