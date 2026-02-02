
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, User, Briefcase, Sun, Moon, GraduationCap, PenTool, Sparkles, Smile, Zap, Crown, Rocket, Ghost, Coffee, Music, Heart, Upload, Laptop, Check, Palette, MonitorPlay, LogIn, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface SetupScreenProps {
  onComplete: (profile: UserProfile, themeColors: string[]) => void;
}

const ROLES = [
  { id: 'Business', label: 'ビジネス', icon: Briefcase, desc: 'プレゼン、ピッチ資料作成' },
  { id: 'Student', label: '学生', icon: GraduationCap, desc: '講義ノート、発表スライド' },
  { id: 'Creative', label: 'クリエイター', icon: PenTool, desc: 'ポートフォリオ、デザイン' },
];

const COLORS = [
    { c: '#F97316', n: 'Orange' }, 
    { c: '#3B82F6', n: 'Blue' },
    { c: '#10B981', n: 'Green' }, 
    { c: '#8B5CF6', n: 'Purple' },
    { c: '#EC4899', n: 'Pink' }, 
    { c: '#0EA5E9', n: 'Sky' }, 
];

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

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loginMethod, setLoginMethod] = useState<'local' | 'google' | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Business');
  const [themeMode, setThemeMode] = useState<'light'|'dark'|'system'>('light');
  const [accentColor, setAccentColor] = useState(COLORS[0]);
  const [avatar, setAvatar] = useState('smile');
  const [customAvatar, setCustomAvatar] = useState<string | undefined>();
  const [isFinishing, setIsFinishing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const totalSteps = 8; // 5 Setup + 3 Tutorial

  const handleNext = () => {
    if (step < totalSteps) setStep(s => s + 1);
    else handleComplete();
  };

  const handleComplete = () => {
      setIsFinishing(true);
      
      let finalAppTheme: 'dark' | 'classic' = themeMode === 'dark' ? 'dark' : 'classic';
      if (themeMode === 'system') {
          finalAppTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'classic';
      }

      setTimeout(() => {
          const profile: UserProfile = {
              name,
              role,
              usageGoal: 'Presentation',
              appTheme: finalAppTheme,
              fontPairing: 'sans',
              aiCreativity: 'medium',
              customPalette: [accentColor.c, '#3B82F6'],
              isSetup: true,
              avatar: customAvatar || avatar 
          };
          onComplete(profile, [accentColor.c, '#3B82F6']);
      }, 3500); 
  };

  const handleGoogleLogin = async () => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          // Google情報を反映
          setLoginMethod('google');
          setName(user.displayName || '');
          if (user.photoURL) setCustomAvatar(user.photoURL);
          // 次のステップへ (プロファイル確認画面へ)
          handleNext();
      } catch (error) {
          console.error("Google login failed", error);
          alert("Googleログインに失敗しました。");
      }
  };

  const handleLocalLogin = () => {
      setLoginMethod('local');
      handleNext();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) setCustomAvatar(ev.target.result as string);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  if (isFinishing) {
      return (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          >
              {/* Warp Speed Tunnel Effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(60)].map((_, i) => (
                      <motion.div
                          key={i}
                          initial={{ opacity: 0, z: 0, scale: 0 }}
                          animate={{ 
                              opacity: [0, 1, 0], 
                              scale: [0, 5], 
                              z: [0, 1000],
                              x: (Math.random() - 0.5) * window.innerWidth * 2,
                              y: (Math.random() - 0.5) * window.innerHeight * 2,
                          }}
                          transition={{ 
                              duration: 1.5, 
                              repeat: Infinity, 
                              delay: Math.random() * 2,
                              ease: "linear"
                          }}
                          style={{
                              position: 'absolute',
                              width: Math.random() * 4 + 1 + 'px',
                              height: Math.random() * 100 + 50 + 'px',
                              background: i % 2 === 0 ? accentColor.c : '#fff',
                              transformOrigin: 'center center',
                          }}
                      />
                  ))}
              </div>

              {/* Central Energy Core */}
              <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 50], opacity: [0, 1, 0] }}
                  transition={{ duration: 3, times: [0, 0.5, 1], ease: "easeInOut" }}
                  className="absolute w-64 h-64 rounded-full bg-white blur-2xl z-20"
                  style={{ mixBlendMode: 'screen' }}
              />

              {/* Content */}
              <div className="text-center text-white space-y-8 relative z-30 max-w-4xl px-6">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180, opacity: 0 }} 
                    animate={{ scale: 1, rotate: 0, opacity: 1 }} 
                    exit={{ scale: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                    className="w-40 h-40 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto shadow-[0_0_100px_rgba(255,255,255,0.5)] border border-white/50"
                  >
                      <Rocket size={64} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
                  </motion.div>
                  
                  <div className="space-y-4">
                      <motion.h2 
                          initial={{ y: 50, opacity: 0, scale: 0.8 }} 
                          animate={{ y: 0, opacity: 1, scale: 1 }} 
                          exit={{ opacity: 0, scale: 2 }}
                          transition={{ delay: 0.5, type: "spring" }}
                          className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-white drop-shadow-lg"
                      >
                          Ready for Blastoff
                      </motion.h2>
                      <motion.p 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          transition={{ delay: 1 }}
                          className="text-xl md:text-2xl text-slate-200 max-w-xl mx-auto font-medium"
                      >
                          Welcome, {name || 'Guest'}
                      </motion.p>
                  </div>
              </div>
              
              {/* Flash Out */}
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1] }}
                  transition={{ duration: 3.5, times: [0, 0.9, 1] }}
                  className="absolute inset-0 bg-white z-50 pointer-events-none"
              />
          </motion.div>
      );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden font-sans">
        <div className="w-full max-w-4xl px-4 md:px-6 relative z-10 h-full md:h-auto flex items-center justify-center">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl md:rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-slate-700 p-6 md:p-8 w-full md:min-h-[600px] flex flex-col transition-all duration-500 h-full md:h-auto rounded-none">
                
                <div className="flex-1 relative overflow-hidden flex flex-col justify-center">
                    <AnimatePresence mode="wait" custom={step}>
                        
                        {/* Step 1: Login Method */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center text-center space-y-8 md:space-y-10">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tighter">Vision Air</h2>
                                    <p className="text-slate-500 dark:text-slate-400">利用方法を選択してください</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl">
                                    <button onClick={handleLocalLogin} className="group p-6 md:p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-brand-primary bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-left flex flex-col gap-4 shadow-sm hover:shadow-lg">
                                        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl w-fit group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            <HardDrive size={32}/>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">ローカルで利用</h3>
                                            <p className="text-xs text-slate-400 mt-1">データはブラウザ内に保存されます。<br/>同期はされません。</p>
                                        </div>
                                    </button>
                                    
                                    <button onClick={handleGoogleLogin} className="group p-6 md:p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left flex flex-col gap-4 shadow-sm hover:shadow-lg">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl w-fit group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-500">
                                            <LogIn size={32}/>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">クラウド同期 (Google)</h3>
                                            <p className="text-xs text-slate-400 mt-1">複数デバイスでデータを同期。<br/>クラウドに保存されます。</p>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Profile (Icon & Name) */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-8">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">プロフィール設定</h2>
                                    <p className="text-sm text-slate-500">{loginMethod === 'google' ? 'Googleアカウントの情報を使用しますが、変更も可能です' : 'あなたの情報を入力してください'}</p>
                                </div>
                                
                                <div className="flex flex-col items-center gap-6">
                                     <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                         <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-inner border-4 border-white dark:border-slate-600 overflow-hidden">
                                             {customAvatar ? (
                                                 <img src={customAvatar} alt="Avatar" className="w-full h-full object-cover"/>
                                             ) : (
                                                 React.createElement(AVATARS.find(a => a.id === avatar)?.icon || Smile, { size: 56, className: "text-brand-primary" })
                                             )}
                                         </div>
                                         <div className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full shadow-md"><Upload size={16}/></div>
                                         <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                     </div>

                                     <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-2xl overflow-x-auto max-w-[90vw] md:max-w-sm">
                                         {AVATARS.map(a => (
                                             <button 
                                                key={a.id} 
                                                onClick={() => { setAvatar(a.id); setCustomAvatar(undefined); }}
                                                className={`p-3 rounded-xl transition-all shrink-0 ${!customAvatar && avatar === a.id ? 'bg-white shadow text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                             >
                                                 <a.icon size={20}/>
                                             </button>
                                         ))}
                                     </div>
                                </div>

                                <div className="w-full max-w-xs">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2 pl-1">表示名</label>
                                    <input 
                                        value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-brand-primary text-center"
                                        placeholder="Name"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Role */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-8">
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">主な用途</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                    {ROLES.map(r => (
                                        <button 
                                            key={r.id} onClick={() => setRole(r.id)}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 text-center group ${role === r.id ? 'border-brand-primary bg-slate-50 dark:bg-slate-700' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                        >
                                            <div className={`p-4 rounded-full transition-colors ${role === r.id ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                <r.icon size={28} />
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Theme */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-8">
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">UIテーマ</h2>
                                </div>
                                <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                                     <button onClick={() => setThemeMode('light')} className={`flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all ${themeMode === 'light' ? 'border-brand-primary bg-orange-50' : 'border-slate-200'}`}>
                                         <Sun size={32} className={themeMode === 'light' ? 'text-brand-primary' : 'text-slate-400'} /> 
                                         <span className="font-bold text-slate-700">ライト</span>
                                     </button>
                                     <button onClick={() => setThemeMode('dark')} className={`flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all ${themeMode === 'dark' ? 'border-indigo-500 bg-slate-800' : 'border-slate-200 dark:border-slate-700'}`}>
                                         <Moon size={32} className={themeMode === 'dark' ? 'text-indigo-400' : 'text-slate-600'} /> 
                                         <span className="font-bold text-white dark:text-slate-200">ダーク</span>
                                     </button>
                                     <button onClick={() => setThemeMode('system')} className={`flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all ${themeMode === 'system' ? 'border-brand-secondary bg-blue-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700'}`}>
                                         <Laptop size={32} className={themeMode === 'system' ? 'text-brand-secondary' : 'text-slate-400'} /> 
                                         <span className="font-bold text-slate-700 dark:text-slate-200">システム</span>
                                     </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Accent Color */}
                        {step === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-8">
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">テーマカラー</h2>
                                </div>
                                <div className="grid grid-cols-3 gap-4 md:gap-6">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c.c} 
                                            onClick={() => { setAccentColor(c); document.documentElement.style.setProperty('--brand-primary', c.c); }}
                                            className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 transition-all shadow-sm flex flex-col items-center justify-center gap-2 ${accentColor.c === c.c ? 'scale-110 border-white shadow-xl ring-2 ring-slate-200' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: c.c }}
                                        >
                                            {accentColor.c === c.c && <Check size={24} className="text-white" strokeWidth={4} />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 6: Tutorial 1 (AI) */}
                        {step === 6 && (
                            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-8 text-center max-w-md mx-auto">
                                <div className="w-40 h-40 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Sparkles size={80} className="text-purple-500" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">AIがすべてを構築</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                        トピックを入力するだけで、<br/>
                                        構成からデザインまで<br/>
                                        AIが一瞬で生成します。
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 7: Tutorial 2 (Design) */}
                        {step === 7 && (
                            <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-8 text-center max-w-md mx-auto">
                                <div className="w-40 h-40 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Palette size={80} className="text-orange-500" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">直感的なデザイン</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                        ドラッグ＆ドロップ、<br/>
                                        スマートな自動調整機能で、<br/>
                                        誰でもプロ並みのスライドを。
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 8: Tutorial 3 (Present) */}
                        {step === 8 && (
                            <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col items-center justify-center space-y-8 text-center max-w-md mx-auto">
                                <div className="w-40 h-40 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                    <MonitorPlay size={80} className="text-blue-500" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">次世代のプレゼン体験</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                        AI生成のスピーカーノート、<br/>
                                        レーザーポインター機能で、<br/>
                                        自信を持って発表できます。
                                    </p>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-700 mt-4">
                    <div className="flex gap-2">
                        {Array.from({length: totalSteps}).map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step >= i + 1 ? 'w-4 md:w-6 bg-brand-primary' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                    </div>
                    <button 
                        onClick={handleNext}
                        disabled={step === 2 && !name.trim()}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 md:px-8 md:py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none text-sm md:text-base"
                    >
                        {step === totalSteps ? (
                           <>完了 <Rocket size={18} /></>
                        ) : (
                           <>次へ <ArrowRight size={18} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
