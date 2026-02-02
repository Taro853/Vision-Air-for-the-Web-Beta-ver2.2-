
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { X, User, Check, Upload, Image as ImageIcon, History, ChevronRight } from 'lucide-react';
import { Smile, Zap, Crown, Rocket, Ghost, Coffee, Music, Heart, Trash2 } from 'lucide-react';
import { auth } from '../firebase';
import { AnimatePresence, motion } from 'framer-motion';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onResetSetup?: () => void;
}

const AVATARS = [
    { id: 'smile', icon: Smile },
    { id: 'zap', icon: Zap },
    { id: 'crown', icon: Crown },
    { id: 'rocket', icon: Rocket },
    { id: 'ghost', icon: Ghost },
    { id: 'coffee', icon: Coffee },
    { id: 'music', icon: Music },
    { id: 'heart', icon: Heart },
];

const VERSIONS = [
    { v: '1.2', date: 'Current', title: 'License System', desc: 'ライセンス認証機能搭載、特別プランの追加、UIの改善。' },
    { v: '1.121', date: '2024.03', title: 'Stability Patch', desc: '描画エンジンの安定性向上、メモリ使用量の最適化。' },
    { v: '1.12', date: '2024.02', title: 'Security Fix', desc: 'セキュリティバグ修正、データの安全性強化、クラウド同期の安定化。' },
    { v: '1.1', date: '2024.01', title: 'Cloud Sync', desc: 'Googleアカウント連携、複数デバイス間でのリアルタイム同期機能。' },
    { v: '1.00', date: '2023.12', title: 'Initial Release', desc: 'Vision Air リリース。基本編集機能、AI生成プロトタイプ。' },
];

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const VersionHistoryModal = ({ onClose }: { onClose: () => void }) => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        exit={{ opacity: 0, x: 20 }}
        className="absolute inset-0 bg-white dark:bg-slate-800 z-10 flex flex-col"
    >
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History size={20}/> バージョン履歴
            </h3>
            <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">戻る</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {VERSIONS.map((v, i) => (
                <div key={v.v} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 pb-2 last:pb-0">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${i === 0 ? 'bg-brand-primary' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-black ${i === 0 ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-300'}`}>v{v.v}</span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{v.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{v.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
            ))}
        </div>
    </motion.div>
);

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ 
    isOpen, onClose, userProfile, onUpdate, onResetSetup
}) => {
  const [name, setName] = useState(userProfile.name);
  const [avatar, setAvatar] = useState(userProfile.avatar || 'smile');
  const [customAvatar, setCustomAvatar] = useState<string | undefined>(
      userProfile.avatar && (userProfile.avatar.startsWith('data:') || userProfile.avatar.startsWith('http')) 
      ? userProfile.avatar 
      : undefined
  );
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = auth.currentUser;

  if (!isOpen) return null;

  const handleSave = () => {
      onUpdate({
          ...userProfile,
          name,
          avatar: customAvatar || avatar,
      });
      onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setCustomAvatar(ev.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div 
            className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/50 dark:border-slate-700 flex flex-col relative" 
            onClick={e => e.stopPropagation()}
            style={{ animationFillMode: 'both', height: '600px' }}
        >
            <AnimatePresence>
                {showHistory && <VersionHistoryModal onClose={() => setShowHistory(false)} />}
            </AnimatePresence>

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">プロフィール設定</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-600 shadow-lg group-hover:scale-105 transition-transform">
                             {customAvatar ? (
                                 <img src={customAvatar} className="w-full h-full object-cover" alt="Avatar" />
                             ) : (
                                 React.createElement(AVATARS.find(a => a.id === avatar)?.icon || Smile, { size: 40, className: "text-slate-500" })
                             )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-brand-primary text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors">
                            <Upload size={14} />
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </div>

                    {/* Preset Selector */}
                    <div className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
                         {AVATARS.map(av => (
                             <button 
                                key={av.id} 
                                onClick={() => { setCustomAvatar(undefined); setAvatar(av.id); }}
                                className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${!customAvatar && avatar === av.id ? 'bg-white shadow-md text-brand-primary scale-110' : 'text-slate-400 hover:bg-white/50'}`}
                             >
                                 <av.icon size={18} />
                             </button>
                         ))}
                    </div>
                </div>

                {/* Name Input */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2 ml-1">表示名</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-base font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                                placeholder="名前を入力"
                            />
                        </div>
                    </div>

                    {currentUser && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-600 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <GoogleIcon />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Googleでログイン中</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">{currentUser.email}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Version Info Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={() => setShowHistory(true)} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 transition-colors group">
                        <div className="text-left">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Vision Air Version</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">v1.2</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-primary"/>
                    </button>
                </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                {onResetSetup && (
                    <button onClick={onResetSetup} className="px-4 py-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-bold text-xs flex items-center gap-1">
                        <Trash2 size={14}/> リセット
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    <button onClick={onClose} className="px-5 py-3 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors">キャンセル</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2">
                        <Check size={18}/> 保存
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};
