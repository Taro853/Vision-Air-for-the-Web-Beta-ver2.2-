
import React from 'react';
import { SlideElement } from '../../types';
import { RotateCw, ImagePlus } from 'lucide-react';
import { TextRenderer } from './renderers/TextRenderer';
import { ShapeRenderer } from './renderers/ShapeRenderer';
import { ImageRenderer } from './renderers/ImageRenderer';
import { motion, Variants } from 'framer-motion';

interface ElementRendererProps {
    el: SlideElement;
    readOnly: boolean;
    isSelected: boolean;
    isEditing: boolean;
    isDragging: boolean;
    scale: number;
    currentStep: number;
    onMouseDown: (e: React.MouseEvent | React.TouchEvent, el: SlideElement) => void;
    onDoubleClick: (e: React.MouseEvent, el: SlideElement) => void;
    onUpdateElement: (id: string, updates: any) => void;
    onHandleMouseDown: (e: React.MouseEvent | React.TouchEvent, handle: string, el: SlideElement) => void;
    isProcessing?: boolean;
}

const getCursor = (handle: string) => {
    switch(handle) {
        case 'n': case 's': return 'ns-resize';
        case 'e': case 'w': return 'ew-resize';
        case 'nw': case 'se': return 'nwse-resize';
        case 'ne': case 'sw': return 'nesw-resize';
        case 'rotate': return 'grab';
        default: return 'default';
    }
};

const mapEasing = (easing?: string): any => {
    switch(easing) {
        case 'ease-in': return 'easeIn';
        case 'ease-out': return 'easeOut';
        case 'ease-in-out': return 'easeInOut';
        case 'linear': return 'linear';
        case 'cubic-bezier(0.175, 0.885, 0.32, 1.275)': return [0.175, 0.885, 0.32, 1.275];
        default: return 'easeOut';
    }
};

// Advanced Animation Variants
const animationVariants: Record<string, Variants> = {
    'fade-in': { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    'slide-up': { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } },
    'slide-down': { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 } },
    'slide-left': { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } },
    'slide-right': { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } },
    'pop': { hidden: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 12 } } },
    'zoom-in': { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
    'zoom-out': { hidden: { opacity: 0, scale: 1.2 }, visible: { opacity: 1, scale: 1 } },
    'rotate-in': { hidden: { opacity: 0, rotate: -45, scale: 0.8 }, visible: { opacity: 1, rotate: 0, scale: 1 } },
    'bounce-in': { hidden: { opacity: 0, scale: 0.3 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', bounce: 0.6 } } },
    'flip-in-x': { hidden: { opacity: 0, rotateX: 90 }, visible: { opacity: 1, rotateX: 0 } },
    'flip-in-y': { hidden: { opacity: 0, rotateY: 90 }, visible: { opacity: 1, rotateY: 0 } },
    'rubber-band': { visible: { scale: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1], transition: { times: [0, 0.3, 0.4, 0.5, 0.65, 0.75, 1] } } },
    'wobble': { visible: { rotate: [0, -5, 3, -5, 2, -1, 0], x: [0, -6, 4, -4, 2, -1, 0] } },
    'swing': { visible: { rotate: [0, 15, -10, 5, -3, 0], originY: 0 } },
    'none': { hidden: {}, visible: {} }
};

export const ElementRenderer: React.FC<ElementRendererProps> = ({
    el, readOnly, isSelected, isEditing, isDragging, currentStep,
    onMouseDown, onDoubleClick, onUpdateElement, onHandleMouseDown, isProcessing
}) => {
    
    // Animation Logic
    const anim = el.animation;
    const hasAnimation = anim && anim.type !== 'none';
    const isAnimatedStep = hasAnimation && anim.step !== undefined;
    const shouldShow = !readOnly || !isAnimatedStep || (currentStep >= anim!.step!);
    
    // Determine variants
    const variants = hasAnimation ? animationVariants[anim.type] || animationVariants['fade-in'] : {};
    
    const initial = (readOnly && isAnimatedStep && currentStep < anim.step!) ? "hidden" : false;
    const animate = (readOnly && isAnimatedStep && currentStep >= anim.step!) ? "visible" : (readOnly && !hasAnimation) ? undefined : undefined;

    const isBasicShape = ['rectangle', 'circle'].includes(el.type);
    const isText = el.type === 'text';
    const isImage = el.type === 'image';
    const isPath = el.type === 'path';
    const isComplexShape = !isBasicShape && !isText && !isImage && !isPath && el.type !== 'table';

    const transformList = [
        `rotate(${el.rotation || 0}deg)`,
        el.style.transform,
        el.style.skewX ? `skewX(${el.style.skewX}deg)` : '',
        el.style.skewY ? `skewY(${el.style.skewY}deg)` : '',
        el.style.flipX ? 'scaleX(-1)' : '',
        el.style.flipY ? 'scaleY(-1)' : '',
    ].filter(Boolean).join(' ');

    const filterString = [
        el.style.filterBlur ? `blur(${el.style.filterBlur}px)` : '',
        el.style.filterBrightness !== undefined ? `brightness(${el.style.filterBrightness}%)` : '',
        el.style.filterContrast !== undefined ? `contrast(${el.style.filterContrast}%)` : '',
        el.style.filterGrayscale ? `grayscale(${el.style.filterGrayscale}%)` : '',
        el.style.filterSepia ? `sepia(${el.style.filterSepia}%)` : '',
        el.style.filterSaturate !== undefined ? `saturate(${el.style.filterSaturate}%)` : '',
        el.style.filterHueRotate ? `hue-rotate(${el.style.filterHueRotate}deg)` : '',
        el.style.filterInvert ? `invert(${el.style.filterInvert}%)` : '',
        (el.style.shadow && (isComplexShape || isPath)) 
           ? `drop-shadow(${el.style.shadowOffsetX || 0}px ${el.style.shadowOffsetY || 4}px ${el.style.shadowBlur || 4}px ${el.style.shadowColor || 'rgba(0,0,0,0.3)'})` 
           : ''
    ].filter(Boolean).join(' ');

    const wrapperStyle: React.CSSProperties = {
      position: 'absolute', 
      left: `${el.x}px`, 
      top: `${el.y}px`, 
      width: `${el.width}px`, 
      height: `${el.height}px`,
      transform: transformList, 
      zIndex: el.style.zIndex || 1,
      cursor: readOnly ? 'default' : isEditing ? 'text' : isDragging ? 'grabbing' : 'move',
      filter: filterString !== '' ? filterString : 'none',
      mixBlendMode: el.style.mixBlendMode,
      backdropFilter: el.style.backdropBlur ? `blur(${el.style.backdropBlur}px)` : 'none',
      userSelect: isEditing ? 'text' : 'none', 
      pointerEvents: readOnly ? 'none' : 'auto', 
      backgroundColor: isBasicShape ? (el.style.backgroundColor || 'transparent') : undefined,
      backgroundImage: isBasicShape ? el.style.gradient : undefined,
      border: el.style.borderWidth && !isPath ? `${el.style.borderWidth}px ${el.style.borderStyle || 'solid'} ${el.style.borderColor}` : 'none',
      borderRadius: el.type === 'circle' ? '50%' : (el.style.borderRadius || '0px'),
      boxShadow: (el.style.shadow && !isComplexShape && !isPath) 
        ? `${el.style.shadowOffsetX || 0}px ${el.style.shadowOffsetY || 4}px ${el.style.shadowBlur || 4}px ${el.style.shadowColor || 'rgba(0,0,0,0.3)'}` 
        : 'none',
      opacity: shouldShow ? (el.style.opacity ?? 1) : 0, 
    };

    const textStyle: React.CSSProperties = {
        width: '100%', height: '100%',
        color: el.style.color, 
        fontSize: `${el.style.fontSize || 16}px`, 
        fontFamily: el.style.fontFamily || '"Noto Sans JP", sans-serif',
        fontWeight: el.style.fontWeight || 'normal', 
        fontStyle: el.style.fontStyle, 
        textDecoration: el.style.textDecoration,
        textAlign: el.style.textAlign || 'left',
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: el.style.textAlign === 'center' ? 'center' : el.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
        textShadow: el.style.textShadow || 'none',
        WebkitTextStroke: el.style.outlineWidth ? `${el.style.outlineWidth}px ${el.style.outlineColor}` : (el.style.WebkitTextStroke || 'none'),
        backgroundClip: el.style.backgroundClip,
        WebkitBackgroundClip: el.style.WebkitBackgroundClip,
        WebkitTextFillColor: el.style.WebkitTextFillColor,
        backgroundImage: (isText && el.style.backgroundClip === 'text') ? el.style.gradient : undefined,
        letterSpacing: el.style.letterSpacing,
        lineHeight: el.style.lineHeight,
        overflow: 'hidden', 
        borderRadius: 'inherit',
        writingMode: el.style.writingMode as any,
    };

    const isPlaceholder = isImage && el.content === 'placeholder';

    return (
        <motion.div 
            layout={!isDragging && !readOnly}
            variants={readOnly && hasAnimation ? variants : undefined}
            initial={initial}
            animate={animate}
            transition={{ 
                duration: anim?.duration || 0.5, 
                delay: (readOnly ? (anim?.delay || 0) : 0), 
                ease: mapEasing(anim?.easing) 
            }}
            id={`el-${el.id}`} 
            style={wrapperStyle}
            onMouseDown={(e) => onMouseDown(e, el)}
            onTouchStart={(e) => onMouseDown(e, el)} 
            onDoubleClick={(e) => onDoubleClick(e, el)}
            className={`group`}
            key={readOnly ? `${el.id}-step-${currentStep}` : el.id} 
        >
            {!readOnly && <div className="absolute inset-0 z-0 bg-transparent" />}
            
            {isProcessing && (
                <div className="absolute inset-0 z-[100] rounded-lg overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -skew-x-12 animate-[shimmer_1.5s_infinite]" style={{ width: '50%', transform: 'translateX(-150%)' }}></div>
                </div>
            )}

            {!readOnly && !isSelected && !isDragging && (
                 <div className="absolute -inset-1 border border-brand-primary/40 rounded-lg transition-all duration-200 pointer-events-none opacity-0 group-hover:opacity-100"></div>
            )}

            {isText && (
                <div className="relative z-10 w-full h-full" style={{ borderRadius: 'inherit' }}>
                    <TextRenderer 
                        element={el} 
                        isEditing={isEditing} 
                        onUpdate={(id, content) => onUpdateElement(id, { content })} 
                        style={textStyle}
                    />
                </div>
            )}
            
            {isComplexShape && <ShapeRenderer element={el} />}
            
            {isPath && el.pathData && (
                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                    <path 
                        d={el.pathData} 
                        stroke={el.style.borderColor || '#000'} 
                        strokeWidth={el.style.borderWidth || 2} 
                        fill="none" 
                        strokeLinecap={el.style.strokeLinecap || 'round'}
                        strokeLinejoin={el.style.strokeLinejoin || 'round'}
                        opacity={el.style.opacity}
                    />
                </svg>
            )}
            
            {isImage && (
                <div style={{width:'100%', height:'100%', borderRadius: 'inherit', overflow:'hidden', maskImage: el.style.maskImage, WebkitMaskImage: el.style.maskImage, maskSize:'contain', WebkitMaskSize:'contain', maskRepeat:'no-repeat', WebkitMaskRepeat:'no-repeat', maskPosition:'center', WebkitMaskPosition:'center'}}>
                     {isPlaceholder ? (
                         <div className="w-full h-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                             <ImagePlus size={32} />
                             <span className="text-xs font-bold uppercase">画像を選択</span>
                         </div>
                     ) : (
                         <ImageRenderer element={el} />
                     )}
                </div>
            )}

            {el.type === 'table' && el.tableData && (
                <div style={{width: '100%', height: '100%', overflow:'hidden', borderRadius: el.style.borderRadius, fontSize: `${el.style.fontSize||16}px`, color: el.style.color}} className="relative z-10">
                    <table style={{width: '100%', height: '100%', borderCollapse: el.style.tableBorderCollapse || 'collapse', backgroundColor: el.style.backgroundColor}}>
                        <tbody>
                            {el.tableData.data.map((row, rIndex) => {
                                const isHeader = el.tableData?.hasHeader && rIndex === 0;
                                return (
                                <tr key={rIndex} style={{ backgroundColor: isHeader ? el.style.headerColor : (el.style.tableStriped && rIndex % 2 !== 0 ? (el.style.stripeColor || '#f8fafc') : 'transparent') }}>
                                    {row.map((cell, cIndex) => (
                                        <td key={`${rIndex}-${cIndex}`} 
                                            style={{ 
                                                border: `${el.style.borderWidth || 1}px ${el.style.borderStyle||'solid'} ${el.style.borderColor || '#000'}`, 
                                                paddingTop: el.style.cellPaddingY || 4, paddingBottom: el.style.cellPaddingY || 4,
                                                paddingLeft: el.style.cellPaddingX || 8, paddingRight: el.style.cellPaddingX || 8,
                                                textAlign: el.style.textAlign || 'left',
                                                verticalAlign: el.style.verticalAlign || 'middle',
                                                color: isHeader && el.style.headerTextColor ? el.style.headerTextColor : 'inherit',
                                                fontWeight: isHeader ? 'bold' : 'normal'
                                            }}
                                        >
                                             <input 
                                                defaultValue={cell} 
                                                onBlur={(e) => { 
                                                    if(!el.tableData) return; 
                                                    const nd = [...el.tableData.data.map(r => [...r])]; 
                                                    nd[rIndex][cIndex] = e.target.value; 
                                                    onUpdateElement(el.id, { tableData: { ...el.tableData, data: nd } }); 
                                                }} 
                                                style={{width: '100%', background:'transparent', border:'none', outline:'none', textAlign: 'inherit', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit'}} 
                                                disabled={readOnly} 
                                                onMouseDown={(e) => e.stopPropagation()} 
                                                onTouchStart={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}

            {isSelected && !readOnly && (
                <>
                    {/* Visual Selection Box: 
                        DISABLED FOR PATHS: Paths shouldn't have the rectangular border.
                    */}
                    {!isPath && (
                        <div 
                            className="absolute -top-px -left-px -right-px -bottom-px border-2 border-brand-primary pointer-events-none z-50 rounded-sm"
                            style={{ boxSizing: 'content-box' }}
                        ></div>
                    )}
                    
                    {!isDragging && (
                        <>
                            <div className="absolute left-1/2 -top-8 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center cursor-grab shadow-md hover:scale-110 hover:border-brand-primary z-50 transition-all" style={{ transform: 'translateX(-50%)' }} 
                                onMouseDown={(e) => onHandleMouseDown(e, 'rotate', el)}
                                onTouchStart={(e) => onHandleMouseDown(e, 'rotate', el)}
                            >
                                <RotateCw size={12} className="text-slate-600" />
                            </div>
                            
                            {!isPath && <div className="absolute left-1/2 top-0 h-0 w-px bg-brand-primary z-40" style={{ transform: 'translateX(-50%)', height: '-8px' }}></div>}
                            
                            {/* Resize Handles: FIXED POSITIONING using transform translate -50% -50% for perfect centering */}
                            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => (
                                <div key={h} 
                                    className="absolute w-3 h-3 bg-white border-2 border-brand-primary rounded-full z-50 shadow-sm transition-transform hover:scale-125"
                                    style={{ 
                                        top: h.includes('n') ? '0%' : h.includes('s') ? '100%' : '50%', 
                                        left: h.includes('w') ? '0%' : h.includes('e') ? '100%' : '50%', 
                                        transform: 'translate(-50%, -50%)', 
                                        cursor: getCursor(h) 
                                    }}
                                    onMouseDown={(e) => onHandleMouseDown(e, h, el)} 
                                    onTouchStart={(e) => onHandleMouseDown(e, h, el)}
                                />
                            ))}
                        </>
                    )}
                </>
            )}
        </motion.div>
    );
};
