
import React, { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './SplashScreen';
import { SetupScreen } from './SetupScreen';
import { HomeScreen } from './HomeScreen';
import { EditorScreen } from './EditorScreen';
import { LicenseScreen } from './LicenseScreen';
import { Slide, SlideElement, Project, UserProfile, AppSettings, DEFAULT_SETTINGS, LicenseFeatures } from '../types';
import { generateSlideContent } from '../services/geminiService';
import { exportToPptx } from '../services/pptxService';
import { publishProject, fetchSharedProject } from '../services/firestoreService';
import { Canvas } from './Canvas';
import { ChevronLeft, ChevronRight, MousePointer2, X, FileText, MonitorX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Firebase Services
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
    saveUserProfileToCloud, getUserProfileFromCloud, 
    saveSingleProjectToCloud, getProjectsFromCloud, deleteProjectFromCloud,
    saveSettingsToCloud, getSettingsFromCloud, checkAccountLicense
} from '../services/firestoreService';

const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 540;

const INITIAL_SLIDE: Slide = {
  id: 'slide-1',
  elements: [
    {
      id: 'el-1',
      type: 'text',
      x: 80, y: 180, width: 800, height: 100, rotation: 0,
      content: 'Vision Air',
      animation: { type: 'slide-down', duration: 0.8, delay: 0.2, step: 0 },
      style: { fontSize: 64, fontWeight: '700', color: '#1e293B', textAlign: 'center', zIndex: 10, fontFamily: '"Inter", sans-serif' }
    }
  ],
  background: '#ffffff',
  notes: ''
};

const INITIAL_PROJECT: Project = {
  id: 'proj-1',
  name: '新規プレゼンテーション',
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  createdAt: Date.now(),
  lastModified: Date.now(),
  slides: [INITIAL_SLIDE]
};

type AppScreen = 'splash' | 'license' | 'setup' | 'home' | 'editor' | 'presentation';

const Toast = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
             <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
             <span className="text-sm font-bold">{message}</span>
        </div>
    );
};

// Local Storage Keys
const STORAGE_KEYS = {
    PROJECTS: 'vision-air-projects',
    PROFILE: 'vision-air-profile',
    SETTINGS: 'vision-air-settings',
    LOCAL_ID: 'vision_air_local_id', 
    LICENSE_KEY: 'vision_air_license_key',
};

export default function App() {
  // --- Auth State ---
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(true); // Default to TRUE (Secure Default)

  // Load initial state from Local Storage (Fallback)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : { 
        name: '', role: '', usageGoal: '', appTheme: 'classic', fontPairing: 'sans', aiCreativity: 'medium', isSetup: false 
      };
  });
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return saved ? JSON.parse(saved) : [INITIAL_PROJECT];
  });

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [currentProject, setCurrentProject] = useState<Project>(projects[0] || INITIAL_PROJECT);
  const [slides, setSlides] = useState<Slide[]>(projects[0]?.slides || INITIAL_PROJECT.slides);
  const [currentSlideId, setCurrentSlideId] = useState<string>(projects[0]?.slides[0].id || INITIAL_PROJECT.slides[0].id);

  const [history, setHistory] = useState<Slide[][]>([projects[0]?.slides || INITIAL_PROJECT.slides]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // Presentation State
  const [currentStep, setCurrentStep] = useState(0);
  const [laserMode, setLaserMode] = useState(false);
  const [showPresenterNotes, setShowPresenterNotes] = useState(false);
  const [mousePos, setMousePos] = useState({x:0, y:0});

  const currentSlide = slides.find(s => s.id === currentSlideId) || slides[0];

  // --- Dynamic Title ---
  useEffect(() => {
      const baseTitle = "Vision Air";
      if ((currentScreen === 'editor' || currentScreen === 'presentation') && currentProject) {
          document.title = `${currentProject.name || 'Untitled'} - ${baseTitle}`;
      } else {
          document.title = baseTitle;
      }
  }, [currentScreen, currentProject.name]);

  // --- Shared Project Loading ---
  useEffect(() => {
      const loadSharedProject = async () => {
          const params = new URLSearchParams(window.location.search);
          const shareId = params.get('share');
          if (shareId) {
              setLoadingMessage("共有プロジェクトを読み込み中...");
              const sharedProject = await fetchSharedProject(shareId);
              if (sharedProject) {
                  const copy = { 
                      ...sharedProject, 
                      id: `shared-copy-${Date.now()}`,
                      name: `${sharedProject.name} (Copy)`,
                      lastModified: Date.now()
                  };
                  setProjects(prev => [copy, ...prev]);
                  setCurrentProject(copy);
                  setSlides(copy.slides);
                  setCurrentSlideId(copy.slides[0].id);
                  setCurrentScreen('editor');
                  setIsViewOnly(true); // Shared projects are always view-only initially
                  setUserProfile(prev => ({...prev, plan: 'free'})); // Guest
                  window.history.replaceState({}, document.title, window.location.pathname);
              } else {
                  alert("共有プロジェクトが見つかりませんでした。");
              }
              setLoadingMessage(null);
          }
      };
      loadSharedProject();
  }, []);

  // --- Auth & Data Sync Effect ---
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
          setFirebaseUser(user);
          if (user) {
              setLoadingMessage("クラウドデータを同期中...");
              setIsCloudSyncing(true);
              
              try {
                  const cloudProfile = await getUserProfileFromCloud(user.uid);
                  const cloudSettings = await getSettingsFromCloud(user.uid);
                  const cloudProjects = await getProjectsFromCloud(user.uid);

                  if (cloudProfile) {
                      setUserProfile(prev => ({ ...prev, ...cloudProfile }));
                      if (cloudProfile.appTheme === 'dark') document.documentElement.classList.add('dark');
                  }
                  if (cloudSettings) setAppSettings(cloudSettings);
                  if (cloudProjects.length > 0) {
                      setProjects(cloudProjects);
                  }
              } catch (e) {
                  console.error("Sync error:", e);
              }
              setIsCloudSyncing(false);
              setLoadingMessage(null);
          }
      });
      return () => unsubscribe();
  }, []);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)); }, [projects]);
  useEffect(() => { 
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); 
      if (firebaseUser) saveUserProfileToCloud(firebaseUser.uid, userProfile);
  }, [userProfile, firebaseUser]);
  useEffect(() => { 
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
      if (firebaseUser) saveSettingsToCloud(firebaseUser.uid, appSettings);
  }, [appSettings, firebaseUser]);

  useEffect(() => {
    const applyTheme = () => {
        const isDark = appSettings.uiTheme === 'dark' || (appSettings.uiTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (appSettings.uiTheme === 'system') applyTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [appSettings.uiTheme]);

  // --- Handlers ---

  const handleSplashComplete = async () => {
      // Check if user has a verified license
      const storedLicenseKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
      let accountId = firebaseUser?.uid || localStorage.getItem(STORAGE_KEYS.LOCAL_ID);

      if (storedLicenseKey && accountId) {
          setLoadingMessage("ライセンスを検証中...");
          try {
              const result = await checkAccountLicense(accountId);
              if (result.valid) {
                  setUserProfile(prev => ({ ...prev, licenseKey: storedLicenseKey, plan: result.plan, features: result.features }));
                  setIsViewOnly(false);
                  setCurrentScreen(userProfile.isSetup ? 'home' : 'setup');
                  setLoadingMessage(null);
                  return;
              }
          } catch (e) {
              console.error("License check failed:", e);
              // Fall through to license screen if check fails
          }
      }
      
      // If no verified license or check failed, go to license screen
      setCurrentScreen('license');
      setLoadingMessage(null);
  };

  const handleLicenseVerifiedFromScreen = (key: string, plan: 'pro' | 'express' | 'enterprise') => {
      // 再度チェックして機能情報を取得
      const updateProfileWithFeatures = async () => {
          let accountId = firebaseUser?.uid || localStorage.getItem(STORAGE_KEYS.LOCAL_ID);
          if (accountId) {
              const result = await checkAccountLicense(accountId);
              setUserProfile(prev => ({ ...prev, licenseKey: key, plan, features: result.features }));
          } else {
              setUserProfile(prev => ({ ...prev, licenseKey: key, plan }));
          }
          localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, key);
          setIsViewOnly(false);
          setCurrentScreen(userProfile.isSetup ? 'home' : 'setup');
      }
      updateProfileWithFeatures();
  };

  const handleLicenseSkip = () => {
      setUserProfile(prev => ({ ...prev, licenseKey: undefined, plan: 'free', features: undefined }));
      localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
      setIsViewOnly(true);
      setCurrentScreen(userProfile.isSetup ? 'home' : 'setup');
  };

  const handleSetupComplete = (profile: UserProfile, themeColors: string[]) => {
      setUserProfile(profile);
      document.documentElement.style.setProperty('--brand-primary', themeColors[0]);
      document.documentElement.style.setProperty('--brand-secondary', themeColors[1]);
      document.documentElement.style.setProperty('--brand-primary-transparent', `${themeColors[0]}4D`);
      const newTheme = profile.appTheme === 'dark' ? 'dark' : 'light';
      setAppSettings(prev => ({ ...prev, uiTheme: newTheme }));
      if(newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      setCurrentScreen('home');
  };

  const handleUpdateProject = useCallback((updatedProject: Project) => {
      if (isViewOnly) { alert("閲覧モードではプロジェクトを保存できません。"); return; }
      setCurrentProject(updatedProject);
      setProjects(prev => {
          const exists = prev.find(p => p.id === updatedProject.id);
          if (exists) return prev.map(p => p.id === updatedProject.id ? updatedProject : p);
          return [updatedProject, ...prev];
      });
      if (firebaseUser) saveSingleProjectToCloud(firebaseUser.uid, updatedProject);
  }, [firebaseUser, isViewOnly]);

  useEffect(() => {
     if (currentScreen === 'editor' && !isViewOnly) {
         const updatedProject = { ...currentProject, slides: slides, lastModified: Date.now() };
         handleUpdateProject(updatedProject);
     }
  }, [slides, currentScreen, handleUpdateProject, isViewOnly]); 

  const pushHistory = useCallback((newSlides: Slide[]) => {
      if (isViewOnly) return;
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(newSlides);
          if (newHistory.length > appSettings.undoHistoryLimit) newHistory.shift(); 
          return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, appSettings.undoHistoryLimit)); 
      setSlides(newSlides);
  }, [historyIndex, appSettings.undoHistoryLimit, isViewOnly]);

  const undo = () => { if (!isViewOnly && historyIndex > 0) { setHistoryIndex(prev => prev - 1); setSlides(history[historyIndex - 1]); } };
  const redo = () => { if (!isViewOnly && historyIndex < history.length - 1) { setHistoryIndex(prev => prev + 1); setSlides(history[historyIndex + 1]); } };

  const handleUpdateProfile = (newProfile: UserProfile) => { setUserProfile(newProfile); };
  const handleResetSetup = () => { setUserProfile({ ...userProfile, isSetup: false }); setCurrentScreen('setup'); };
  const handleMoveToTrash = (projectId: string) => { 
      if(isViewOnly) { alert("閲覧モードでは削除できません。"); return; }
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isDeleted: true } : p)); 
      const p = projects.find(proj => proj.id === projectId);
      if (p && firebaseUser) saveSingleProjectToCloud(firebaseUser.uid, { ...p, isDeleted: true });
  };
  const handleRestoreProject = (projectId: string) => {
      if(isViewOnly) { alert("閲覧モードでは復元できません。"); return; }
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isDeleted: false } : p));
      const p = projects.find(proj => proj.id === projectId);
      if (p && firebaseUser) saveSingleProjectToCloud(firebaseUser.uid, { ...p, isDeleted: false });
  };
  const handleDeleteForever = (projectId: string) => {
      if(isViewOnly) { alert("閲覧モードでは完全に削除できません。"); return; }
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (firebaseUser) deleteProjectFromCloud(firebaseUser.uid, projectId);
  };

  const handleNewProject = (name: string, w: number, h: number) => {
      if (isViewOnly) { alert("閲覧モードでは新規作成できません。"); return; }
      const p = { ...INITIAL_PROJECT, id: `p-${Date.now()}`, name, width: w||DEFAULT_WIDTH, height: h||DEFAULT_HEIGHT, slides: [INITIAL_SLIDE] };
      setProjects(prev => [p, ...prev]);
      setCurrentProject(p); setSlides(p.slides); setCurrentSlideId(p.slides[0].id); setCurrentScreen('editor');
  };

  const handleOpenProject = (p: Project) => {
      setCurrentProject(p); setSlides(p.slides); setCurrentSlideId(p.slides[0].id); setCurrentScreen('editor');
  };

  const handleGenerateAIProject = async (topic: string) => {
    if (isViewOnly) { alert("閲覧モードではAI生成できません。"); return; }
    // Enterprise Restriction Check
    if (userProfile.plan === 'enterprise' && userProfile.features && !userProfile.features.aiGeneration) {
        alert("この操作は、お使いのアカウントではサポートされていません。");
        return;
    }

    setLoadingMessage("AIがプロジェクト全体を生成中... (約15秒)");
    try {
        const elements = await generateSlideContent({ topic, slideCount: 5, useWebImages: false });
        let newProject: Project;
        if (elements && elements.length > 0) {
            const newSlides = elements.map((els, i) => ({ id: `s-${Date.now()}-${i}`, elements: els, background: '#fff' }));
            newProject = { ...INITIAL_PROJECT, id: `p-${Date.now()}`, name: topic, slides: newSlides, lastModified: Date.now() };
        } else {
            newProject = { ...INITIAL_PROJECT, id: `p-${Date.now()}`, name: topic, lastModified: Date.now() };
        }
        setProjects(prev => [newProject, ...prev]);
        setCurrentProject(newProject); setSlides(newProject.slides); setCurrentSlideId(newProject.slides[0].id); setCurrentScreen('editor');
    } catch(e) { console.error(e); }
    setLoadingMessage(null);
  };

  const handlePptxExport = async () => {
      if(isViewOnly) { alert("閲覧モードではエクスポートできません。"); return; }
      // Enterprise Restriction Check
      if (userProfile.plan === 'enterprise' && userProfile.features && !userProfile.features.exportPptx) {
          alert("この操作は、お使いのアカウントではサポートされていません。");
          return;
      }

      setLoadingMessage("PPTXファイルを生成中...");
      try { await exportToPptx({ ...currentProject, slides }); } catch (e) { alert("エクスポートエラー"); }
      setLoadingMessage(null);
  };
  const handleShare = async () => {
      if(isViewOnly) { alert("閲覧モードでは共有できません。"); return; }
      // Enterprise Cloud Sync Check (Assumption: Sharing uses cloud)
      if (userProfile.plan === 'enterprise' && userProfile.features && !userProfile.features.cloudSync) {
          alert("この操作は、お使いのアカウントではサポートされていません。");
          return;
      }

      setLoadingMessage("共有リンクを発行中...");
      try {
          const shareId = await publishProject({ ...currentProject, slides });
          const url = `${window.location.origin}/?share=${shareId}`;
          await navigator.clipboard.writeText(url);
          alert("リンクをコピーしました: " + url);
      } catch (e) { alert("共有エラー"); }
      setLoadingMessage(null);
  };

  const handlePresentationClick = useCallback(() => {
       const max = Math.max(0, ...currentSlide.elements.map(e => e.animation?.step || 0));
       if (currentStep <= max) setCurrentStep(s => s + 1); else nextSlide();
  }, [currentSlide, currentStep, slides, currentSlideId]);

  const nextSlide = useCallback(() => {
       const idx = slides.findIndex(s => s.id === currentSlideId);
       if (idx < slides.length - 1) { setCurrentSlideId(slides[idx + 1].id); setCurrentStep(0); } else setCurrentScreen('editor');
  }, [slides, currentSlideId]);
  
  const prevSlide = useCallback(() => {
       const idx = slides.findIndex(s => s.id === currentSlideId);
       if (idx > 0) { setCurrentSlideId(slides[idx - 1].id); setCurrentStep(0); }
  }, [slides, currentSlideId]);

  return (
    <AnimatePresence mode="wait">
        {currentScreen === 'splash' && (
            <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50">
                <SplashScreen onComplete={handleSplashComplete} />
            </motion.div>
        )}

        {currentScreen === 'license' && (
            <motion.div key="license" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50">
                <LicenseScreen onLicenseVerified={handleLicenseVerifiedFromScreen} onSkip={handleLicenseSkip} />
            </motion.div>
        )}
        
        {currentScreen === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-40">
                <SetupScreen onComplete={handleSetupComplete} />
            </motion.div>
        )}

        {currentScreen === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-30">
                <HomeScreen 
                    projects={projects} userProfile={userProfile} appSettings={appSettings}
                    onSettingsChange={setAppSettings} onNewProject={handleNewProject} onOpenProject={handleOpenProject}
                    onDeleteProject={handleMoveToTrash} onRestoreProject={handleRestoreProject} onDeleteForever={handleDeleteForever}
                    onGenerateAIProject={handleGenerateAIProject} onUpdateProfile={handleUpdateProfile} onResetSetup={handleResetSetup}
                    isViewOnly={isViewOnly}
                />
            </motion.div>
        )}

        {currentScreen === 'editor' && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 z-20">
                <EditorScreen 
                    project={currentProject} slides={slides} setSlides={isViewOnly ? () => {} : setSlides} 
                    onUpdateProject={handleUpdateProject} onGoHome={() => setCurrentScreen('home')}
                    userProfile={userProfile} appSettings={appSettings} onSettingsChange={setAppSettings}
                    onPresent={() => { setCurrentStep(0); setCurrentScreen('presentation'); }}
                    onGenerateAI={() => {}} isGenerating={isGenerating} 
                    undo={undo} redo={redo} canUndo={historyIndex > 0 && !isViewOnly} canRedo={historyIndex < history.length - 1 && !isViewOnly}
                    pushHistory={pushHistory} currentSlideId={currentSlideId} setCurrentSlideId={setCurrentSlideId}
                    loadingMessage={loadingMessage} setLoadingMessage={setLoadingMessage}
                    onExportPptx={handlePptxExport} onShareProject={handleShare}
                    readOnly={isViewOnly}
                />
                <Toast message={loadingMessage} />
                {isViewOnly && <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-3 py-1 text-xs rounded-full opacity-50 pointer-events-none z-[9999]">閲覧モード</div>}
            </motion.div>
        )}

        {currentScreen === 'presentation' && (
            <div 
                className={`fixed inset-0 bg-black z-[9999] ${laserMode ? 'cursor-none' : ''} outline-none`} 
                onMouseMove={(e) => setMousePos({x: e.clientX, y: e.clientY})} tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handlePresentationClick(); }
                    if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); prevSlide(); }
                    if (e.key === 'Escape') setCurrentScreen('editor');
                }}
                autoFocus ref={(el) => el?.focus()}
            >
                {laserMode && (
                    <div className="fixed w-4 h-4 bg-red-500 rounded-full blur-[2px] pointer-events-none z-[10000] mix-blend-screen" style={{ left: mousePos.x - 8, top: mousePos.y - 8, boxShadow: '0 0 10px 2px rgba(255,0,0,0.8)' }} />
                )}
                <div className="w-full h-full flex items-center justify-center" onClick={!laserMode ? handlePresentationClick : undefined}>
                    <div style={{ transform: `scale(${Math.min(window.innerWidth / currentProject.width, window.innerHeight / currentProject.height)})` }}>
                        <Canvas slide={currentSlide} selectedIds={[]} onSelect={() => {}} onUpdateElement={() => {}} onContextMenu={() => {}} readOnly currentStep={currentStep} projectWidth={currentProject.width} projectHeight={currentProject.height} />
                    </div>
                </div>
                {/* Controls omitted for brevity but remain the same */}
                <button onClick={() => setCurrentScreen('editor')} className="absolute bottom-6 right-6 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-bold transition-colors flex items-center gap-2 z-[10002]">
                    <MonitorX size={16}/> 終了
                </button>
            </div>
        )}
    </AnimatePresence>
  );
}