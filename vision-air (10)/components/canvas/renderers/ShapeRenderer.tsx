
import React from 'react';
import { SlideElement } from '../../../types';

interface ShapeRendererProps {
  element: SlideElement;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ element }) => {
  const getClipPath = (type: string, s1?: number, s2?: number) => {
    // s1 (shapeDetail1): Primary param (e.g. Arrow Head Start, Bubble Tail X)
    // s2 (shapeDetail2): Secondary param (e.g. Arrow Shaft Width, Bubble Tail Y)
    
    switch (type) {
      case 'triangle': return 'polygon(50% 0%, 0% 100%, 100% 100%)';
      case 'star': return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      case 'hexagon': return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
      
      case 'arrow': 
        const headStart = s1 || 70; // Default 70%
        const shaftThick = s2 || 60; // Default 60% (meaning 20% top/bottom gap)
        const gap = (100 - shaftThick) / 2;
        return `polygon(0% ${gap}%, ${headStart}% ${gap}%, ${headStart}% 0%, 100% 50%, ${headStart}% 100%, ${headStart}% ${100-gap}%, 0% ${100-gap}%)`;

      case 'bubble':
        // Tail position X (s1), Tail Width (s2) - Simplified for clip-path
        const tailX = s1 || 70;
        const tailW = s2 ? s2/2 : 10;
        return `polygon(0% 0%, 100% 0%, 100% 80%, ${Math.min(100, tailX + tailW)}% 80%, ${tailX}% 100%, ${Math.max(0, tailX - tailW)}% 80%, 0% 80%)`;

      default: return 'none';
    }
  };

  const isBasicShape = element.type === 'rectangle' || element.type === 'circle';
  const clipPath = getClipPath(element.type, element.style.shapeDetail1, element.style.shapeDetail2);
  
  if (isBasicShape) return null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: element.style.backgroundColor || '#F97316',
        backgroundImage: element.style.gradient,
        clipPath: clipPath,
        opacity: element.style.opacity,
      }}
    />
  );
};
