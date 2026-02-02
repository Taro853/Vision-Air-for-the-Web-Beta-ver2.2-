
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ArrowRight, Eye, ShieldAlert, CheckCircle, Apple, Banana, Citrus, Cherry, Grape, IceCream, LogOut, Loader2, X, Zap, Crown, Sparkles, Cloud, Monitor, Check } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { validateLicenseKey, bindLicense, checkAccountLicense, getLocalAccountId } from '../services/firestoreService';
import { AdminDashboard } from './AdminDashboard';

interface LicenseScreenProps {
    onLicenseVerified: (key: string, plan: 'pro' | 'express' | 'enterprise') => void;
    onSkip: () => void;
}

const ADMIN_KEY_SEQUENCE = ['apple', 'banana', 'orange', 'grape', 'ice-cream', 'cherry'];

const ICONS = [
    { id: 'apple', icon: Apple, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'orange', icon: Citrus, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'banana', icon: Banana, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'grape', icon: Grape, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'ice-cream', icon: IceCream, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'cherry', icon: Cherry, color: 'text-red-600', bg: 'bg-red-100' },
];

// Special Onboarding Component (Adobe Style)
const SpecialOnboarding = ({ onComplete }: { onComplete: () => void }) => {
    const [page, setPage] = useState(0);

    const slides = [
        {
            title: "認証成功！",
            subtitle: "License Verified",
            desc: "特別アクセス権限が付与されました。Vision Airの全ての機能を制限なくご利用いただけます。",
            icon: <CheckCircle size={80} className="text-green-400" />,
            bg: "from-slate-900 to-slate-800"
        },
        {
            title: "AI Power Unlocked",
            subtitle: "Visiot Intelligence",
            desc: "プレゼン構成、デザイン生成、文章のリライトなど、最先端のGemini AIが無制限に使用可能です。",
            icon: <Sparkles size={80} className="text-purple-400" />,
            bg: "from-indigo-900 via-purple-900 to-slate-900"
        },
        {
            title: "Any Device, Anywhere",
            subtitle: "Unlimited Access",
            desc: "デバイス数制限は解除されました。チームメンバー全員で、どこからでもアクセスできます。",
            icon: <Monitor size={80} className="text-blue-400" />,
            bg: "from-blue-950 via-slate-900 to-black"
        },
        {
            title: "Pro Features Ready",
            subtitle: "Export & Cloud",
            desc: "PowerPoint書き出し、クラウド同期、高度なアニメーション編集など、プロフェッショナルな機能がすべて手の中に。",
            icon: <Cloud size={80} className="text-orange-400" />,
            bg: "from-orange-950 via-red-950 to-slate-900"
        },
        {
            title: "Let's Create",
            subtitle: "Vision Air 1.2",
            desc: "準備は整いました。次世代のプレゼンテーション作成体験を始めましょう。",
            icon: <RocketIcon />,
            bg: "from-slate-900 to-black",
            action: true
        }
    ];

    return (
        <div className="fixed inset-0 z-[10000] bg-black text-white font-sans overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={page}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className={`absolute inset-0 bg-gradient-to-br ${slides[page].bg} flex flex-col items-center justify-center p-8 text-center`}
                >
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mb-8"
                    >
                        {slides[page].icon}
                    </motion.div>
                    
                    <motion.h2 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-sm font-bold tracking-[0.2em] text-white/60 mb-2 uppercase"
                    >
                        {slides[page].subtitle}
                    </motion.h2>
                    
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-5xl md:text-6xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70"
                    >
                        {slides[page].title}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="text-lg text-white/70 max-w-xl leading-relaxed mb-12"
                    >
                        {slides[page].desc}
                    </motion.p>

                    {slides[page].action && (
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onComplete}
                            className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"
                        >
                            Start Vision Air
                        </motion.button>
                    )}
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-10">
                {slides.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-500 ${i === page ? 'w-12 bg-white' : 'w-2 bg-white/20'}`} 
                    />
                ))}
            </div>

            {!slides[page].action && (
                <button 
                    onClick={() => setPage(p => p + 1)}
                    className="absolute bottom-8 right-8 flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors z-10 group"
                >
                    NEXT <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </button>
            )}
        </div>
    );
};

const RocketIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
);

export const LicenseScreen: React.FC<LicenseScreenProps> = ({ onLicenseVerified, onSkip }) => {
    const [licenseKey, setLicenseKey] = useState('');
    const [mode, setMode] = useState<'input' | 'admin-auth' | 'bind-confirm' | 'admin-dashboard' | 'plan-select' | 'special-onboarding'>('input');
    const [iconSequence, setIconSequence] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifiedKey, setVerifiedKey] = useState<string | null>(null);
    const [verifiedPlan, setVerifiedPlan] = useState<'pro'|'express'|'enterprise'>('pro');

    // Initial check for existing license
    useEffect(() => {
        const checkExistingLicense = async () => {
            const storedKey = localStorage.getItem('vision_air_license_key');
            if (!storedKey) {
                setIsLoading(false);
                return;
            }

            // If special key is stored, verify immediately
            if (storedKey === '2212212212212') {
                onLicenseVerified(storedKey, 'enterprise');
                return;
            }

            setIsLoading(true);
            const user = auth.currentUser;
            let accountId: string | null = null;
            if (user) {
                accountId = user.uid;
            } else {
                accountId = getLocalAccountId();
            }

            if (accountId) {
                const result = await checkAccountLicense(accountId);
                if (result.valid) {
                    onLicenseVerified(storedKey, result.plan || 'pro');
                    return;
                }
            }
            setIsLoading(false);
        };
        checkExistingLicense();
    }, [onLicenseVerified]);

    const handleKeySubmit = async () => {
        if (!licenseKey) return;
        setError(null);

        if (licenseKey === "2013022112340") {
            setMode('admin-auth');
            return;
        }

        // Special Master Key Bypass
        if (licenseKey === '2212212212212') {
            setIsLoading(true);
            // Simulate API delay for dramatic effect
            setTimeout(() => {
                setVerifiedKey(licenseKey);
                setVerifiedPlan('enterprise');
                setMode('special-onboarding');
                setIsLoading(false);
            }, 1500);
            return;
        }

        if (licenseKey.length !== 13) {
            setError('ライセンスキーは13桁で入力してください。');
            return;
        }

        setIsLoading(true);
        try {
            const result = await validateLicenseKey(licenseKey);
            if (result.valid && result.license) {
                setVerifiedKey(licenseKey);
                setVerifiedPlan(result.license.plan);
                setMode('bind-confirm');
            } else {
                setError(result.message || '認証に失敗しました。');
            }
        } catch (e: any) {
            setError(e.message || '認証中にエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIconClick = (id: string) => {
        const newSeq = [...iconSequence, id];
        setIconSequence(newSeq);

        if (newSeq.length === ADMIN_KEY_SEQUENCE.length) {
            if (JSON.stringify(newSeq) === JSON.stringify(ADMIN_KEY_SEQUENCE)) {
                setMode('admin-dashboard');
            } else {
                setError('パスワードが違います');
                setTimeout(() => {
                    setIconSequence([]);
                    setError(null);
                }, 500);
            }
        } else if (newSeq.length > ADMIN_KEY_SEQUENCE.length) {
             setIconSequence([]);
        }
    };

    const handleBindGoogle = async () => {
        try {
            setIsLoading(true);
            const res = await signInWithPopup(auth, googleProvider);
            if (res.user && verifiedKey) {
                await bindLicense(verifiedKey, res.user.uid);
                localStorage.setItem('vision_air_license_key', verifiedKey);
                localStorage.removeItem('vision_air_local_id'); 
                onLicenseVerified(verifiedKey, verifiedPlan);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Google認証に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBindLocal = async () => {
        if (verifiedKey) {
            const localId = getLocalAccountId();
            setIsLoading(true);
            try {
                await bindLicense(verifiedKey, localId);
                localStorage.setItem('vision_air_license_key', verifiedKey);
                onLicenseVerified(verifiedKey, verifiedPlan);
            } catch (e: any) {
                setError(e.message || 'ローカル認証に失敗しました。');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSpecialComplete = () => {
        if (verifiedKey) {
            // Special key logic directly saves to local storage without binding to account ID necessarily
            localStorage.setItem('vision_air_license_key', verifiedKey);
            onLicenseVerified(verifiedKey, 'enterprise');
        }
    };
    
    if (mode === 'special-onboarding') {
        return <SpecialOnboarding onComplete={handleSpecialComplete} />;
    }

    if (isLoading && mode === 'input') {
        return (
            <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
                <Loader2 className="animate-spin text-white" size={48} />
            </div>
        );
    }

    if (mode === 'admin-dashboard') {
        return <AdminDashboard onClose={() => setMode('input')} />;
    }

    if (mode === 'plan-select') {
        return (
            <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-[9999] flex items-center justify-center p-4 font-sans">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-8 relative">
                    <button onClick={() => setMode('input')} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
                    <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2">プランを選択</h2>
                    <p className="text-center text-slate-500 text-sm mb-8">用途に合わせて最適なプランをお選びください。</p>
                    
                    <div className="space-y-4">
                        <button onClick={() => window.open('https://example.com/', '_blank')} className="w-full p-5 rounded-2xl border-2 border-orange-100 hover:border-brand-primary bg-orange-50/30 hover:bg-orange-50 transition-all text-left group">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-700 text-lg">Air 単体プラン</span>
                                <Zap size={24} className="text-orange-400 group-hover:scale-110 transition-transform"/>
                            </div>
                            <p className="text-xs text-slate-500">基本機能のみ。AI機能なし。</p>
                        </button>

                        <button onClick={() => window.open('https://example.com/', '_blank')} className="w-full p-5 rounded-2xl border-2 border-indigo-100 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50 transition-all text-left group">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-700 text-lg">Express Suite コンプリート</span>
                                <Crown size={24} className="text-indigo-500 group-hover:scale-110 transition-transform"/>
                            </div>
                            <p className="text-xs text-slate-500">AI機能 (Visiot)、クラウド同期、全ての機能。</p>
                        </button>
                    </div>
                    
                    <div className="mt-8 text-center">
                        <button onClick={onSkip} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">閲覧モード (Free) で続ける</button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-[9999] flex items-center justify-center p-4 font-sans">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700 overflow-hidden relative"
            >
                {mode === 'input' && (
                    <div className="p-8">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-brand-primary">
                                <Key size={32} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2">ライセンス認証</h2>
                        <p className="text-center text-slate-500 text-sm mb-8">製品版を使用するには13桁のキーを入力してください。</p>

                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value.replace(/[^0-9]/g, '').slice(0, 13))}
                                    placeholder="ライセンスキーを入力"
                                    className="w-full text-center text-2xl font-mono tracking-widest bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl py-4 focus:border-brand-primary outline-none transition-colors"
                                    type="text"
                                    inputMode="numeric"
                                />
                                {licenseKey.length === 13 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                                        <CheckCircle size={20} />
                                    </div>
                                )}
                            </div>
                            
                            {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

                            <button 
                                onClick={handleKeySubmit}
                                disabled={licenseKey.length < 13 || isLoading}
                                className="w-full py-4 bg-brand-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <>認証する <ArrowRight size={18} /></>}
                            </button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700"></div></div>
                                <div className="relative flex justify-center text-xs"><span className="px-2 bg-white dark:bg-slate-800 text-slate-400">または</span></div>
                            </div>

                            <button onClick={() => setMode('plan-select')} className="w-full py-3 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-300 rounded-xl text-slate-500 font-bold text-sm flex items-center justify-center gap-2 transition-all group">
                                <Eye size={18} className="group-hover:text-brand-primary"/> プランを選択 / 閲覧モード
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'admin-auth' && (
                    <div className="p-8">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 animate-pulse">
                                <ShieldAlert size={32} />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-6">管理者セキュリティ</h2>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {ICONS.map((icon) => (
                                <button 
                                    key={icon.id}
                                    onClick={() => handleIconClick(icon.id)}
                                    className={`aspect-square ${icon.bg} rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm`}
                                >
                                    <icon.icon size={32} className={icon.color} />
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-center gap-2 h-4 mb-4">
                            {iconSequence.map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${i < iconSequence.length ? 'bg-brand-primary' : 'bg-slate-300'}`} />
                            ))}
                        </div>
                        {error && <p className="text-red-500 text-xs text-center font-bold mb-4">{error}</p>}
                        <button onClick={() => { setMode('input'); setLicenseKey(''); setIconSequence([]); }} className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-bold">キャンセル</button>
                    </div>
                )}

                {mode === 'bind-confirm' && (
                    <div className="p-8 text-center">
                        <div className="mb-6 inline-block p-4 bg-green-100 rounded-full text-green-600">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">ライセンス有効</h2>
                        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 mb-4 uppercase">{verifiedPlan} PLAN</div>
                        <p className="text-slate-500 text-sm mb-8">このライセンスをどこに紐付けますか？</p>

                        <div className="space-y-3">
                            <button onClick={handleBindGoogle} disabled={isLoading} className="w-full p-4 border-2 border-blue-100 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-xl flex items-center gap-4 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="p-2 bg-white rounded-full shadow-sm"><LogOut size={20} className="text-blue-500"/></div>
                                <div>
                                    <div className="font-bold text-slate-700">Googleアカウント</div>
                                    <div className="text-xs text-slate-400">クラウドで同期・管理</div>
                                </div>
                            </button>

                            <button onClick={handleBindLocal} disabled={isLoading} className="w-full p-4 border-2 border-slate-100 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100 rounded-xl flex items-center gap-4 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="p-2 bg-white rounded-full shadow-sm"><Key size={20} className="text-slate-500"/></div>
                                <div>
                                    <div className="font-bold text-slate-700">このデバイスのみ</div>
                                    <div className="text-xs text-slate-400">ブラウザに保存 (同期なし)</div>
                                </div>
                            </button>
                        </div>
                        <button onClick={() => setMode('input')} className="mt-6 text-slate-400 hover:text-slate-600 text-xs font-bold">戻る</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
