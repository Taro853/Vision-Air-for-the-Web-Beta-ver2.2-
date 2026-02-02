import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const Section = ({ title, children, defaultOpen = true }: { title: string, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-slate-100 py-3 last:border-0">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full mb-2 group">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-brand-primary transition-colors">{title}</span>
                {isOpen ? <ChevronDown size={14} className="text-slate-300"/> : <ChevronRight size={14} className="text-slate-300"/>}
            </button>
            {isOpen && <div className="animate-in slide-in-from-top-1">{children}</div>}
        </div>
    );
};