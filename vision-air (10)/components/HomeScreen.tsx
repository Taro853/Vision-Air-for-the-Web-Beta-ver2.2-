
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, AppSettings, UserProfile } from '../types';
import { Plus, Clock, LayoutTemplate, Search, Sparkles, Monitor, Smartphone, Square, Settings, Zap, Eye, Save, Globe, Palette, Grid, Type, ArrowRight, ArrowLeft, Trash2, Check, User, Loader2, Maximize2, Minimize2, Smile, RefreshCw, SlidersHorizontal, ChevronDown, X, Sun, Moon, Grid3X3, Ruler, Image, FileText, MousePointer2, Command, Film, History, MonitorPlay, Home, CheckCircle2, ChevronLeft, MoreHorizontal, Copy, Edit, Link, PanelLeftClose, PanelLeftOpen, LogOut, Cloud, LogIn, Key, Calendar, Ratio, Menu, Star, Users, Crown, Lock } from 'lucide-react';
import { VisionAirLogo } from './SplashScreen';
import { TEMPLATES } from '../data/templates';
import { AccountSettingsModal } from './AccountSettingsModal';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomSelect, CustomSwitch, CustomInput } from './ui/FormElements';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useMediaQuery } from './hooks/useMediaQuery';

interface HomeScreenProps {
  projects: Project[];
  userProfile: UserProfile;
  appSettings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onNewProject: (name: string, width: number, height: number) => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (id: string) => void; 
  onGenerateAIProject: (topic: string) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onResetSetup?: () => void;
  onRestoreProject?: (id: string) => void;
  onDeleteForever?: (id: string) => void;
  isViewOnly: boolean; 
}

const ProjectMenuPopup = ({ position, project, onClose, onDuplicate, onEdit, onDelete, onToggleFavorite, isViewOnly }: any) => {
    return createPortal(
        <div 
            className="fixed inset-0 z-[9999]" 
            onClick={onClose}
        >
            <div 
                className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 w-48 overflow-hidden animate-in fade-in zoom-in-95"
                style={{ top: position.y, left: position.x }}
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onDuplicate} disabled={isViewOnly} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"><Copy size={14}/> 複製</button>
                <button onClick={onEdit} disabled={isViewOnly} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"><Edit size={14}/> 編集</button>
                <button onClick={onToggleFavorite} disabled={isViewOnly} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Star size={14} fill={project.isFavorite ? "currentColor" : "none"} className={project.isFavorite ? "text-yellow-400" : ""}/> 
                    {project.isFavorite ? "お気に入り解除" : "お気に入りに追加"}
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                <button onClick={onDelete} disabled={isViewOnly} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={14}/> 削除</button>
            </div>
        </div>,
        document.body
    );
};

export const SlideThumbnail = ({ project, slideIndex = 0 }: { project: Project, slideIndex?: number }) => {
    const slide = project.slides[slideIndex] || project.slides[0];
    const scale = 240 / project.width;
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: slide.background, backgroundImage: slide.backgroundGradient, transition: 'background 0.3s' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: project.width, height: project.height, position: 'absolute', top: 0, left: 0 }}>
                {slide.elements.map(el => (
                    <div key={el.id} style={{
                        position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)`,
                        backgroundColor: ['triangle','star','diamond','hexagon','arrow','bubble'].includes(el.type) ? 'transparent' : el.style.backgroundColor, backgroundImage: el.style.gradient,
                        border: el.style.borderWidth ? `${el.style.borderWidth}px solid ${el.style.borderColor}` : 'none', borderRadius: el.type === 'circle' ? '50%' : el.style.borderRadius,
                        opacity: el.style.opacity,
                        display: 'flex', alignItems: 'center', justifyContent: el.style.textAlign === 'center' ? 'center' : el.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        fontSize: el.style.fontSize, color: el.style.color, fontWeight: el.style.fontWeight, whiteSpace: 'nowrap', overflow: 'hidden',
                        fontFamily: el.style.fontFamily, writingMode: el.style.writingMode as any, padding: el.style.padding
                    }}>
                        {el.type === 'text' && el.content?.replace(/<[^>]*>/g, '')}
                    </div>
                ))}
            </div>
        </div>
    );
};

const UserAvatar = ({ id }: { id?: string }) => { if (id && (id.startsWith('data:') || id.startsWith('http'))) { return <img src={id} alt="Avatar" className="w-full h-full object-cover rounded-full" />; } return <Smile size={20} className="text-brand-primary" />; };

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
    projects, userProfile, appSettings, onSettingsChange, onNewProject, 
    onOpenProject, onDeleteProject, onGenerateAIProject, onUpdateProfile, 
    onResetSetup, onRestoreProject, onDeleteForever, isViewOnly
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'templates' | 'settings' | 'trash'>('recent');
  const [showAiModal, setShowAiModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  // Search State 3-Step
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchStep, setSearchStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({ duration: 'any', aspect: 'any', date: 'any' });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); 
  const [projectMenuOpen, setProjectMenuOpen] = useState<{id: string, x: number, y: number}|null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
  // Custom slide size
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  
  // AI Params
  const [aiTopic, setAiTopic] = useState('');
  const [aiMood, setAiMood] = useState("Professional");
  const [aiAudience, setAiAudience] = useState("General");
  const [aiColor, setAiColor] = useState("おまかせ");
  const [aiFont, setAiFont] = useState("モダン");
  const [aiElements, setAiElements] = useState({ shapes: true, images: true });
  
  const [newProjectName, setNewProjectName] = useState('新規プレゼンテーション');
  const [newProjectSize, setNewProjectSize] = useState<{w:number, h:number}>({w: 960, h: 540});
  
  const [previewIndexes, setPreviewIndexes] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const progressRef = useRef<any>(null);
  
  const [localProjects, setLocalProjects] = useState(projects);
  useEffect(() => { setLocalProjects(projects) }, [projects]);

  const isFreePlan = userProfile.plan === 'free';

  const toggleFavorite = (id: string) => {
      if (isViewOnly) { alert("閲覧モードではお気に入り登録できません。"); return; }
      if (isFreePlan) { alert("お気に入り機能はProプラン限定です。"); return; }
      const p = localProjects.find(p => p.id === id);
      if (p) {
          p.isFavorite = !p.isFavorite;
          setLocalProjects([...localProjects]);
      }
  };

  const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const CMD_KEY = IS_MAC ? 'Cmd' : 'Ctrl';

  useEffect(() => {
      const unsub = auth.onAuthStateChanged(user => setCurrentUser(user));
      return () => unsub();
  }, []);

  useEffect(() => {
      if (isGenerating) {
          progressRef.current = setInterval(() => {
              setProgress(prev => { const diff = 95 - prev; if (diff < 0.1) return prev; return prev + diff * 0.02; });
          }, 100);
      } else { if (progressRef.current) clearInterval(progressRef.current); setProgress(0); }
      return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [isGenerating]);

  // Command Palette / Search Logic
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              setShowSearchModal(true);
              setSearchStep(1);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const nonDeletedProjects = localProjects.filter(p => !p.isDeleted).sort((a,b) => b.lastModified - a.lastModified);
  
  const cloneProject = (template: Project): Project => { 
      return { 
          ...template, 
          id: `proj-${Date.now()}`, 
          name: `${template.name} (Copy)`,
          createdAt: Date.now(),
          lastModified: Date.now()
      }; 
  };
  
  const navItemClass = (tab: string, disabled: boolean = false) => `w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${activeTab === tab ? 'bg-white dark:bg-slate-800 shadow-card-depth text-brand-primary font-bold ring-1 ring-slate-100 dark:ring-slate-700 translate-x-2' : disabled ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`;
  
  const handleAiGenStart = async () => {
      if (isViewOnly) { alert("閲覧モードではAI生成できません。"); return; }
      if (isFreePlan) { alert("AI生成はProプラン限定です。"); return; }
      if(!aiTopic.trim()) return;
      setShowAiModal(false);
      setIsGenerating(true);
      setProgress(0);
      setProgressStage("プロジェクト全体を構想中...");
      try {
          const fullPrompt = `${aiTopic} (Target: ${aiAudience}, Mood: ${aiMood}, Color: ${aiColor}, Font: ${aiFont}, Shapes: ${aiElements.shapes}, Images: ${aiElements.images})`;
          await onGenerateAIProject(fullPrompt);
      } finally {
          setIsGenerating(false); setProgress(100); setAiTopic("");
      }
  };

  const handleNewProjectCreate = () => {
      if (isViewOnly) { alert("閲覧モードでは新規作成できません。"); return; }
      onNewProject(newProjectName, newProjectSize.w, newProjectSize.h);
      setShowNewModal(false);
      setNewProjectName('新規プレゼンテーション');
  };

  const openProjectMenu = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setProjectMenuOpen({ id, x: rect.right + 10, y: rect.top });
  };

  const handleLogout = () => {
      if(confirm('ログアウトしますか？')) {
          auth.signOut();
          onResetSetup && onResetSetup();
      }
  };

  const SidebarContent = () => (
      <>
           <div className={`flex items-center gap-3 mb-10 px-2 mt-4 ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}`}>
               <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-inner text-slate-500 shrink-0"><VisionAirLogo className="w-6 h-6" /></div>
               {(!isSidebarCollapsed || isMobile) && <span className="font-bold text-xl text-slate-800 dark:text-slate-200 tracking-tight leading-tight">Vision<br/>Air</span>}
           </div>
           
           <div className="space-y-1.5 flex-1">
              <button onClick={() => { setActiveTab('recent'); if(isMobile) setShowMobileSidebar(false); }} className={navItemClass('recent')} title="ホーム">
                  <Home size={18} /> {(!isSidebarCollapsed || isMobile) && <span>ホーム</span>}
              </button>
              
              {!isFreePlan ? (
                  <>
                    <button onClick={() => { setActiveTab('favorites'); if(isMobile) setShowMobileSidebar(false); }} className={navItemClass('favorites')} title="お気に入り">
                        <Star size={18} /> {(!isSidebarCollapsed || isMobile) && <span>お気に入り</span>}
                    </button>
                    <button onClick={() => { setActiveTab('templates'); if(isMobile) setShowMobileSidebar(false); }} className={navItemClass('templates')} title="テンプレート">
                        <LayoutTemplate size={18} /> {(!isSidebarCollapsed || isMobile) && <span>テンプレート</span>}
                    </button>
                    <button onClick={() => { setActiveTab('trash'); if(isMobile) setShowMobileSidebar(false); }} className={navItemClass('trash')} title="ゴミ箱">
                        <Trash2 size={18} /> {(!isSidebarCollapsed || isMobile) && <span>ゴミ箱</span>}
                    </button>
                  </>
              ) : (
                  <div className="mt-8 px-2">
                      <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-4 rounded-xl text-white shadow-lg text-center">
                          <Crown size={24} className="mx-auto mb-2 text-yellow-300 fill-yellow-300"/>
                          <h4 className="font-bold text-sm mb-1">Go Pro</h4>
                          <p className="text-[10px] opacity-90 mb-3">AI機能、無制限の編集、クラウド同期。</p>
                          <button onClick={() => window.open('https://example.com/', '_blank')} className="w-full py-2 bg-white text-purple-600 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors">
                              アップグレード
                          </button>
                      </div>
                  </div>
              )}
           </div>
           
           <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 space-y-2">
               <button onClick={() => setShowAccountModal(true)} className={`w-full flex items-center gap-3 px-2 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-brand-primary transition-all text-left group ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}`}>
                   <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform overflow-hidden shrink-0 relative">
                       {userProfile.avatar?.startsWith('http') ? <img src={userProfile.avatar} className="w-full h-full object-cover"/> : <UserAvatar id={userProfile?.avatar} />}
                   </div>
                   {(!isSidebarCollapsed || isMobile) && (
                       <div className="flex-1 overflow-hidden">
                           <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate group-hover:text-brand-primary transition-colors">{userProfile?.name || "Guest"}</p>
                           {isFreePlan ? <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Free Plan</span> : <span className="text-[9px] bg-brand-primary text-white px-1.5 py-0.5 rounded">Pro Plan</span>}
                       </div>
                   )}
               </button>
               
               {!isFreePlan && (
                   <button onClick={() => { setActiveTab('settings'); if(isMobile) setShowMobileSidebar(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200/50'} ${isSidebarCollapsed && !isMobile ? 'justify-center px-0' : ''}`} title="設定">
                        <Settings size={18} className={`transition-transform duration-500 ${activeTab === 'settings' ? 'rotate-180' : 'group-hover:rotate-45'}`} /> 
                        {(!isSidebarCollapsed || isMobile) && <span className="font-bold">設定</span>}
                   </button>
               )}
               
               {currentUser ? (
                   <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-all group ${isSidebarCollapsed && !isMobile ? 'justify-center px-0' : ''}`}>
                       <LogOut size={18} /> {(!isSidebarCollapsed || isMobile) && <span className="font-bold">ログアウト</span>}
                   </button>
               ) : null}
           </div>
      </>
  );

  return (
    <div className={`h-screen w-screen bg-[#f8fafc] dark:bg-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden ${isMobile ? 'p-0' : 'p-6'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-slate-50/50 to-blue-50/50 dark:from-slate-900 dark:to-slate-800 -z-10 pointer-events-none opacity-50" />
        <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #F97316 2px, transparent 2px)', backgroundSize: '40px 40px' }} />

      <div className={`w-full max-w-[1600px] h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-floating flex overflow-hidden border border-slate-200/60 dark:border-slate-800 relative ring-1 ring-black/5 ${isMobile ? 'rounded-none border-none shadow-none' : ''}`}>
        
        {!isMobile && (
            <motion.div initial={{ width: 220 }} animate={{ width: isSidebarCollapsed ? 80 : 220 }} className="bg-slate-50/80 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col p-3 z-30 shrink-0 relative transition-all">
               <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-brand-primary z-50 overflow-visible hover:scale-110 transition-transform">
                   {isSidebarCollapsed ? <PanelLeftOpen size={14}/> : <PanelLeftClose size={14}/>}
               </button>
               <SidebarContent />
            </motion.div>
        )}

        <AnimatePresence>
            {isMobile && showMobileSidebar && (
                <>
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}/>
                    <motion.div initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} transition={{type:"spring", stiffness:300, damping:30}} className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 z-50 p-4 flex flex-col shadow-2xl">
                        <SidebarContent />
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative min-w-0">
           <div className={`h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-20 ${isMobile ? 'h-16 px-4' : ''}`}>
              <div className="flex items-center gap-4">
                  {isMobile && <button onClick={() => setShowMobileSidebar(true)} className="p-2 -ml-2"><Menu size={24}/></button>}
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      {activeTab === 'recent' ? 'ホーム' : 'その他'}
                  </h2>
              </div>
              
              <div className="flex items-center gap-4">
                  {!isFreePlan && activeTab !== 'settings' && (
                      <button onClick={() => { setSearchQuery(''); setSearchStep(1); setShowSearchModal(true); }} className={`flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 w-64 transition-all group shadow-sm hover:shadow-md ${isMobile ? 'w-auto px-2 bg-transparent border-none' : ''}`}>
                          <Search size={18} className="text-slate-400 group-hover:text-brand-primary transition-colors"/>
                          {!isMobile && <span>検索...</span>}
                          {!isMobile && <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-300">{CMD_KEY} K</span>}
                      </button>
                  )}
              </div>
           </div>

           <div className={`flex-1 overflow-y-auto p-10 bg-slate-50/30 dark:bg-slate-800/20 custom-scrollbar scroll-smooth ${isMobile ? 'p-4' : ''}`}>
              <AnimatePresence mode="wait">
              {activeTab === 'recent' && (
                <motion.div key="recent" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3, ease: "easeOut"}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                   <motion.button 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                        onClick={() => setShowNewModal(true)} 
                        disabled={isViewOnly}
                        className="aspect-[16/9] bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col items-center justify-center gap-3 transition-all duration-300 group active:scale-95 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:hover:-translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
                   >
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300 shadow-sm"><Plus size={28} /></div>
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-brand-primary">新規作成</span>
                   </motion.button>
                   
                   {!isFreePlan && (
                       <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                            onClick={() => setShowAiModal(true)} 
                            disabled={isViewOnly}
                            className="aspect-[16/9] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-purple-200 hover:-translate-y-1.5 flex flex-col items-center justify-center gap-3 transition-all duration-300 text-white group overflow-hidden relative active:scale-95 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
                       >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl" />
                          <div className="relative z-10 p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform duration-300"><Sparkles size={32} className="animate-pulse"/></div>
                          <div className="text-center relative z-10"><span className="text-lg font-black block tracking-tight">AIで一括生成</span><span className="text-xs opacity-90 block mt-1 font-medium">詳細設定可能</span></div>
                       </motion.button>
                   )}
                   
                   {nonDeletedProjects.map((project, idx) => (
                      <motion.div key={project.id} layoutId={`project-${project.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.05 }} className="group aspect-[16/9] bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-floating border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1.5 relative" onClick={() => onOpenProject(project)}>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative overflow-hidden group/thumb">
                             <SlideThumbnail project={project} slideIndex={previewIndexes[project.id] || 0} />
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                             {!isFreePlan && (
                                 <button onClick={(e) => { e.stopPropagation(); toggleFavorite(project.id); }} disabled={isViewOnly} className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all z-10 disabled:opacity-50 disabled:cursor-not-allowed ${project.isFavorite ? 'bg-yellow-400 text-white shadow-md' : 'bg-black/20 text-white/50 hover:bg-black/40 hover:text-white'}`}>
                                     <Star size={14} fill={project.isFavorite ? "currentColor" : "none"} />
                                 </button>
                             )}
                          </div>
                          <div className="h-14 px-5 flex items-center justify-between bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                             <div className="flex flex-col overflow-hidden"><span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{project.name || "Untitled"}</span><span className="text-[10px] text-slate-400">{new Date(project.lastModified).toLocaleDateString()}</span></div>
                             <button onClick={(e) => openProjectMenu(e, project.id)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"><MoreHorizontal size={18} /></button>
                          </div>
                      </motion.div>
                   ))}
                </motion.div>
              )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Project Menu */}
      {projectMenuOpen && (
          <ProjectMenuPopup 
              position={projectMenuOpen} 
              project={localProjects.find(p => p.id === projectMenuOpen.id)}
              onClose={() => setProjectMenuOpen(null)}
              onDuplicate={() => { 
                  if(projectMenuOpen) { 
                      if(isViewOnly) { alert("閲覧モードでは複製できません。"); setProjectMenuOpen(null); return; }
                      const p = localProjects.find(p => p.id === projectMenuOpen.id); 
                      if(p) onOpenProject(cloneProject(p)); 
                  }
                  setProjectMenuOpen(null); 
              }}
              onEdit={() => { 
                  if(projectMenuOpen) { 
                      if(isViewOnly) { alert("閲覧モードでは編集できません。"); setProjectMenuOpen(null); return; }
                      const p = localProjects.find(p => p.id === projectMenuOpen.id); 
                      if(p) onOpenProject(p); 
                  } 
                  setProjectMenuOpen(null); 
              }}
              onToggleFavorite={() => { if (projectMenuOpen) toggleFavorite(projectMenuOpen.id); setProjectMenuOpen(null); }}
              onDelete={() => { 
                  if(projectMenuOpen) { 
                      if(isViewOnly) { alert("閲覧モードでは削除できません。"); setProjectMenuOpen(null); return; }
                      onDeleteProject(projectMenuOpen.id); 
                  } 
                  setProjectMenuOpen(null); 
              }}
              isViewOnly={isViewOnly}
          />
      )}

      {/* New Project Modal */}
      <AnimatePresence>
      {showNewModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
              <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} transition={{ type: "spring", stiffness: 300, damping: 25 }} className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden w-[500px] border border-white/50 dark:border-slate-700 ${isMobile ? 'w-full' : ''}`} onClick={e => e.stopPropagation()}>
                  <div className="p-8 pb-0">
                       <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Create New</h3>
                       <p className="text-slate-400 text-sm mb-6">新しいプレゼンテーションの設定</p>
                       <div className="space-y-6">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-2 pl-1">プロジェクト名</label>
                               <div className="relative group">
                                   <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-2xl outline-none focus:border-brand-primary/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-bold text-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-300" placeholder="例: 第3四半期 報告資料" />
                                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-brand-primary transition-colors"><FileText size={20} /></div>
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-3 pl-1">キャンバスサイズ</label>
                               <div className="grid grid-cols-4 gap-3">
                                   {[{ w: 960, h: 540, label: "16:9", sub: "Wide" }, { w: 800, h: 600, label: "4:3", sub: "Standard" }, { w: 800, h: 800, label: "1:1", sub: "Square" }, { w: 0, h: 0, label: "Custom", sub: "User" }].map(size => {
                                       const isSelected = (size.w === 0 && (newProjectSize.w !== 960 && newProjectSize.w !== 800)) || (newProjectSize.w === size.w && newProjectSize.h === size.h);
                                       return (
                                           <button key={size.label} onClick={() => { if(size.w === 0) setNewProjectSize({w: customW, h: customH}); else setNewProjectSize({w: size.w, h: size.h}); }} className={`relative p-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden ${isSelected ? 'border-brand-primary bg-orange-50/50 text-brand-primary ring-2 ring-brand-primary/20 ring-offset-1' : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100 text-slate-500'}`}>
                                               <div className={`w-6 h-4 border-2 rounded-sm mb-1 transition-colors ${isSelected ? 'border-brand-primary bg-brand-primary/20' : 'border-slate-300 group-hover:border-slate-400'}`} style={size.w ? { aspectRatio: `${size.w}/${size.h}` } : {}}></div>
                                               <span className="font-bold text-xs">{size.label}</span>
                                               {isSelected && <div className="absolute top-1 right-1 text-brand-primary"><CheckCircle2 size={10} /></div>}
                                           </button>
                                       )
                                   })}
                               </div>
                           </div>
                       </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/30 p-6 mt-8 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => setShowNewModal(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors">キャンセル</button>
                      <button onClick={handleNewProjectCreate} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2">作成する <ArrowRight size={16} /></button>
                  </div>
              </motion.div>
          </motion.div>
      )}
      </AnimatePresence>

      {showAccountModal && <AccountSettingsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} userProfile={userProfile} onUpdate={onUpdateProfile || (() => {})} onResetSetup={onResetSetup} />}
    </div>
  );
};
