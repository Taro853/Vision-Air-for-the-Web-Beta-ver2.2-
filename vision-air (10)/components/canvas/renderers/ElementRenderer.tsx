
import React from 'react';
import { SlideElement } from '../../../types';
import { RotateCw } from 'lucide-react';
import { TextRenderer } from './TextRenderer';
import { ShapeRenderer } from './ShapeRenderer';
import { ImageRenderer } from './ImageRenderer';
import { motion, Variants } from 'framer-motion';

interface ElementRendererProps {
    el: SlideElement;
    readOnly: boolean;
    isSelected: boolean;
    isEditing: boolean;
    isDragging: boolean;
    scale: number;
    currentStep: number;
    onMouseDown: (e: any, el: SlideElement) => void;
    onDoubleClick: (e: any, el: SlideElement) => void;
    onUpdateElement: (id: string, updates: any) => void;
    onHandleMouseDown: (e: any, handle: string, el: SlideElement) => void;
}

const animationVariants: Record<string, Variants> = {
    'fade-in': { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    'slide-up': { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } },
    'pop': { hidden: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1 } },
    'none': { hidden: {}, visible: {} }
};

export const ElementRenderer: React.FC<ElementRendererProps> = ({
    el, readOnly, isSelected, isEditing, isDragging, scale, currentStep,
    onMouseDown, onDoubleClick, onUpdateElement, onHandleMouseDown
}) => {
    const anim = el.animation;
    const shouldShow = !readOnly || !anim || anim.type === 'none' || (currentStep >= (anim.step || 0));
    
    const wrapperStyle: React.CSSProperties = {
      position: 'absolute', 
      left: el.x, top: el.y, width: el.width, height: el.height,
      transform: `rotate(${el.rotation || 0}deg)`, 
      zIndex: el.style.zIndex || 1,
      opacity: shouldShow ? (el.style.opacity ?? 1) : 0,
      backgroundColor: ['rectangle', 'circle'].includes(el.type) ? el.style.backgroundColor : 'transparent',
      border: el.style.borderWidth ? `${el.style.borderWidth}px solid ${el.style.borderColor}` : 'none',
      borderRadius: el.type === 'circle' ? '50%' : el.style.borderRadius,
      pointerEvents: readOnly ? 'none' : 'auto'
    };

    // Correcting handle size to stay consistent regardless of zoom
    const handleSize = 10 / scale;
    const handleStyle: React.CSSProperties = {
        position: 'absolute', width: handleSize, height: handleSize,
        backgroundColor: 'white', border: `${2/scale}px solid var(--brand-primary)`,
        borderRadius: '50%', zIndex: 100, transform: 'translate(-50%, -50%)'
    };

    return (
        <div 
            style={wrapperStyle}
            onMouseDown={(e) => onMouseDown(e, el)}
            onDoubleClick={(e) => onDoubleClick(e, el)}
            className={`group ${isSelected ? 'ring-2 ring-brand-primary' : ''}`}
        >
            {el.type === 'text' && <TextRenderer element={el} isEditing={isEditing} onUpdate={(id, c) => onUpdateElement(id, {content: c})} style={{...el.style, width: '100%', height: '100%'}} />}
            {el.type === 'image' && <ImageRenderer element={el} />}
            {['rectangle', 'circle', 'triangle', 'star', 'diamond', 'hexagon', 'arrow', 'bubble'].includes(el.type) && <ShapeRenderer element={el} />}

            {isSelected && !readOnly && !isDragging && (
                <>
                    {/* Handles */}
                    {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(h => (
                        <div 
                            key={h} style={{
                                ...handleStyle,
                                left: h.includes('w') ? '0%' : h.includes('e') ? '100%' : '50%',
                                top: h.includes('n') ? '0%' : h.includes('s') ? '100%' : '50%',
                                cursor: `${h}-resize`
                            }}
                            onMouseDown={(e) => onHandleMouseDown(e, h, el)}
                        />
                    ))}
                    {/* Rotation Handle */}
                    <div 
                        style={{ ...handleStyle, top: -20/scale, left: '50%', cursor: 'grab' }}
                        onMouseDown={(e) => onHandleMouseDown(e, 'rotate', el)}
                    >
                        <RotateCw size={12/scale} />
                    </div>
                </>
            )}
        </div>
    );
};
