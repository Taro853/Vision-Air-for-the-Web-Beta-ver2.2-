
import React from 'react';
import { SlideElement } from '../../../types';
import { ImagePlus } from 'lucide-react';

interface ImageRendererProps {
  element: SlideElement;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({ element }) => {
  if (element.content === 'placeholder') {
      return (
         <div className="w-full h-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-slate-50 transition-colors group">
             <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                 <ImagePlus size={32} className="text-brand-primary" />
             </div>
             <span className="text-xs font-bold uppercase tracking-wider text-slate-500">画像を選択</span>
         </div>
      );
  }

  if (!element.content) return <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">No Image</div>;

  return (
    <img
      src={element.content}
      alt="slide content"
      className="w-full h-full pointer-events-none select-none block"
      style={{
        objectFit: element.style.objectFit || 'cover',
        borderRadius: element.style.borderRadius,
        opacity: element.style.opacity,
      }}
    />
  );
};
