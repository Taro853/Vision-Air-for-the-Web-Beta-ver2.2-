
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button 
        onClick={() => onChange(!checked)} 
        className={`w-11 h-6 rounded-full transition-all duration-300 relative shadow-inner-soft ${checked ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

interface Option { label: string; value: string | number; }

export const CustomSelect = ({ value, options, onChange }: { value: string | number, options: Option[], onChange: (v: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full min-w-[120px] px-3 py-2bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-primary transition-colors"
            >
                <span className="truncate mr-2">{currentLabel}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-max min-w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${value === opt.value ? 'text-brand-primary bg-orange-50 dark:bg-slate-700/50' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                            {opt.label}
                            {value === opt.value && <Check size={12} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CustomInput = ({ value, onChange, type = "text", className = "" }: { value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, className?: string }) => (
    <input 
        type={type}
        value={value}
        onChange={onChange}
        className={`bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all ${className}`}
    />
);
