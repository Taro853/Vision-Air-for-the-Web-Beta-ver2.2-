import React from 'react';

interface SnapLine {
    orientation: 'vertical' | 'horizontal';
    position: number;
}

export const SnapLinesLayer = ({ lines }: { lines: SnapLine[] }) => {
    return (
        <>
            {lines.map((line, i) => (
                <div key={i} className="absolute z-[100] bg-orange-500 pointer-events-none" 
                    style={{ 
                        left: line.orientation === 'vertical' ? line.position : 0, 
                        top: line.orientation === 'horizontal' ? line.position : 0, 
                        width: line.orientation === 'vertical' ? '1px' : '100%', 
                        height: line.orientation === 'horizontal' ? '1px' : '100%' 
                    }}
                />
            ))}
        </>
    );
};