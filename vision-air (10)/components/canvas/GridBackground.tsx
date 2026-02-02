import React from 'react';

export const GridBackground = ({ showGrid }: { showGrid: boolean }) => {
    if (!showGrid) return null;
    return (
        <div className="absolute inset-0 pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', 
                 backgroundSize: '20px 20px', 
                 opacity: 0.5 
             }} 
        />
    );
};