
import React from 'react';
import { createPortal } from 'react-dom';
import { Square, Circle, Triangle, Star, Hexagon, ArrowRight, MessageCircle, Diamond } from 'lucide-react';
import { ElementType } from '../../types';

interface ShapeMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: ElementType) => void;
    position: { top: number, left: number };
}

export const ShapeMenu: React.FC<ShapeMenuProps> = ({ isOpen, onClose, onSelect, position }) => {
    if (!isOpen) return null;

    const shapes = [
        { type: 'rectangle', icon: Square, label: '四角' }, { type: 'circle', icon: Circle, label: '円' }, 
        { type: 'triangle', icon: Triangle, label: '三角' }, { type: 'star', icon: Star, label: '星' }, 
        { type: 'diamond', icon: Diamond, label: 'ひし形' }, { type: 'hexagon', icon: Hexagon, label: '六角形' }, 
        { type: 'arrow', icon: ArrowRight, label: '矢印' }, { type: 'bubble', icon: MessageCircle, label: '吹き出し' }
    ];

    return createPortal(
        <>
            <div className="fixed inset-0 z-[999]" onClick={onClose} />
            <div className="shape-menu-popup fixed bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-floating z-[1000] w-[280px]" style={{ top: position.top, left: position.left - 120 }}>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 px-1">基本図形</h4>
                <div className="grid grid-cols-4 gap-2">
                {shapes.map((shape: any) => (
                <button key={shape.type} onClick={() => {onSelect(shape.type); onClose();}} className="flex flex-col items-center gap-2 p-2 hover:bg-orange-50 rounded-xl transition-colors text-slate-600 hover:text-brand-primary group">
                    <shape.icon size={24} strokeWidth={1.5} className="group-hover:scale-110 transition-transform"/> 
                </button>
                ))}
                </div>
            </div>
        </>, 
        document.body
    );
};
