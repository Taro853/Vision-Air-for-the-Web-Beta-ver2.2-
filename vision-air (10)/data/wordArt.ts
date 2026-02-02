
import { SlideElement } from '../types';

export interface WordArtStyle {
    id: string;
    name: string;
    style: Partial<SlideElement['style']>;
}

export const WORD_ART_PRESETS: WordArtStyle[] = [
    {
        id: 'neon-blue',
        name: 'Neon Blue',
        style: {
            color: '#FFFFFF',
            WebkitTextStroke: '2px #0EA5E9',
            textShadow: '0 0 10px #0EA5E9, 0 0 20px #0EA5E9',
            fontWeight: '900',
        }
    },
    {
        id: 'sunset-grad',
        name: 'Sunset',
        style: {
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            gradient: 'linear-gradient(to right, #F59E0B, #EF4444, #DB2777)',
            fontWeight: '900',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }
    },
    {
        id: 'metal',
        name: 'Metallic',
        style: {
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            gradient: 'linear-gradient(to bottom, #94a3b8, #f1f5f9, #475569)',
            fontWeight: '900',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            WebkitTextStroke: '1px #334155'
        }
    },
    {
        id: 'retro-pop',
        name: 'Retro Pop',
        style: {
            color: '#FCD34D',
            WebkitTextStroke: '3px #BE185D',
            textShadow: '4px 4px 0px #1E293B',
            fontWeight: '900',
            fontFamily: '"Dela Gothic One", sans-serif'
        }
    },
    {
        id: 'outline-glow',
        name: 'Outline Glow',
        style: {
            color: 'transparent',
            WebkitTextStroke: '2px #FFFFFF',
            textShadow: '0 0 10px #F472B6',
            fontWeight: '700'
        }
    },
    {
        id: 'comic',
        name: 'Comic',
        style: {
            color: '#FEF08A',
            WebkitTextStroke: '2px #000000',
            textShadow: '3px 3px 0 #000000',
            fontWeight: '900',
            fontFamily: '"Potta One", cursive'
        }
    },
    {
        id: 'glass',
        name: 'Glass',
        style: {
            color: 'rgba(255,255,255,0.8)',
            textShadow: '0 4px 30px rgba(0,0,0,0.1)',
            fontWeight: '700',
        }
    },
    {
        id: 'fire',
        name: 'Fire',
        style: {
            color: '#FECACA',
            textShadow: '0 -4px 10px #FCA5A5, 0 -8px 20px #EF4444, 0 -12px 30px #B91C1C',
            fontWeight: '900'
        }
    }
];
