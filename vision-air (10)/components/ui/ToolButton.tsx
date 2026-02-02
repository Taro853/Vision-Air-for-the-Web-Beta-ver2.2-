import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ToolButtonProps {
    onClick: () => void;
    icon: React.ElementType;
    label?: string;
    title?: string;
    colorClass?: string;
    bgClass?: string;
    disabled?: boolean;
    active?: boolean;
    hasDropdown?: boolean;
}

export const ToolButton = ({ 
  onClick, icon: Icon, label, title,
  colorClass = "text-slate-600", bgClass = "hover:bg-slate-100/80", 
  disabled = false, active = false, hasDropdown = false
}: ToolButtonProps) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`
        relative group flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[3rem]
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-95 hover:shadow-sm'}
        ${active ? 'bg-orange-50 text-brand-primary' : bgClass}
      `}
      title={title || label}
    >
      <div className={`flex items-center gap-0.5 ${active ? 'text-brand-primary' : colorClass}`}>
         <Icon size={20} strokeWidth={active ? 2.5 : 2} />
         {hasDropdown && <ChevronDown size={10} className="opacity-50" />}
      </div>
      {label && <span className="text-[9px] font-bold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 bg-slate-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-50">{label}</span>}
    </button>
);