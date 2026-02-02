import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
    isLoading: boolean;
    prompt: string;
    setPrompt: (s: string) => void;
}

export const AiImageModal: React.FC<AiImageModalProps> = ({ isOpen, onClose, onGenerate, isLoading, prompt, setPrompt }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-floating border border-white/50 w-80 z-[60] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><Sparkles size={16} /></div>
                <h4 className="text-xs font-bold text-slate-700 uppercase">AI画像生成</h4>
            </div>
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none shadow-inner"
                placeholder="例: 未来的な都市の風景、夕焼け、3Dレンダリング..."
                rows={3}
            />
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">キャンセル</button>
                <button onClick={() => onGenerate(prompt)} disabled={isLoading || !prompt.trim()} className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-200">
                    {isLoading ? '生成中...' : '生成する'}
                </button>
            </div>
        </div>
    );
};