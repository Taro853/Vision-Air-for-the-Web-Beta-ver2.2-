

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Lightbulb, PenTool, Layout, Plus, Edit2, Palette, Mic, CheckCircle, Wand2, MessageSquare, Zap, PlusCircle, Smile, Crown, Rocket, Ghost, Coffee, Music, Heart, Lock } from 'lucide-react';
import { Slide, SlideElement, UserProfile } from '../types';
import { chatWithVisiot, generateSpeakerNotes } from '../services/geminiService';

interface ChatPanelProps {
  currentSlide: Slide;
  userProfile: UserProfile;
  selectedElement: SlideElement | null;
  onVisiotAction: (call: any) => Promise<void>;
  readOnly?: boolean; // New prop
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AVATAR_ICONS: Record<string, any> = {
    'smile': Smile, 'zap': Zap, 'crown': Crown, 'rocket': Rocket, 'ghost': Ghost, 
    'coffee': Coffee, 'music': Music, 'heart': Heart
};

// Updated Iconic Visiot Logo
const VisiotLogo = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#1e293b" />
        <path d="M30 65 C 30 65, 40 40, 50 30 C 60 40, 70 65, 70 65" stroke="url(#logo_grad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="50" cy="30" r="6" fill="#F97316" />
        <defs>
            <linearGradient id="logo_grad" x1="30" y1="65" x2="70" y2="65" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
        </defs>
    </svg>
);

// Simple Markdown Renderer
const MarkdownText = ({ text }: { text: string }) => {
    // Process text for bold, lists, and code blocks
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // List
                if (line.trim().startsWith('- ')) {
                    return <div key={i} className="flex gap-2 pl-2"><div className="mt-1.5 w-1 h-1 bg-current rounded-full shrink-0"></div><span>{renderInline(line.replace('- ', ''))}</span></div>;
                }
                // Code block line (simplified)
                if (line.trim().startsWith('```')) {
                    return null; // Skip fence
                }
                return <div key={i} className="min-h-[1em]">{renderInline(line)}</div>;
            })}
        </div>
    );
};

const renderInline = (text: string) => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ currentSlide, userProfile, selectedElement, onVisiotAction, readOnly = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHome, setShowHome] = useState(true);

  // Pro Plan check or Enterprise Feature check
  const isAiEnabled = (userProfile.plan === 'pro' || userProfile.plan === 'enterprise') && 
                      (!userProfile.features || userProfile.features.aiGeneration);

  // Suggestions based on context
  const getSuggestions = () => {
      if (selectedElement) {
          if (selectedElement.type === 'text') return ["このテキストを要約して", "もっと丁寧な表現に", "英語に翻訳して", "強調するデザインに"];
          if (selectedElement.type === 'image') return ["画像のスタイルを変更", "この画像の説明文を書いて"];
          return ["色を変更して", "アニメーションを追加", "削除して"];
      }
      return ["スライドのデザインを改善", "新しいスライドを追加", "発表用ノートを作成", "タイトルを考えて"];
  };

  const suggestions = getSuggestions();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    if (!isAiEnabled) {
        if (userProfile.plan === 'enterprise') alert("この操作は、お使いのアカウントではサポートされていません。");
        return; 
    }
    const userText = textOverride || input;
    if (!userText.trim() || isLoading) return;
    
    setShowHome(false);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
        const historyForApi = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const response = await chatWithVisiot(
            historyForApi, 
            userText, 
            currentSlide, 
            userProfile?.name || 'User',
            selectedElement
        );
        
        if (response.functionCall) {
            if (readOnly) {
                setMessages(prev => [...prev, { role: 'model', text: `閲覧モードのため、機能「${response.functionCall.name}」は実行できません。` }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: `⚙️ ${response.functionCall.name} を実行しています...` }]);
                await onVisiotAction(response.functionCall);
                setMessages(prev => {
                    const newMsgs = [...prev];
                    // Replace the last message
                    newMsgs[newMsgs.length - 1] = { role: 'model', text: `✅ ${response.functionCall.name} を完了しました。` };
                    return newMsgs;
                });
            }
        } else {
            setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        }
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "エラーが発生しました。時間を置いて再度お試しください。" }]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGenerateNotes = async () => {
      if (!isAiEnabled || readOnly) {
          if (userProfile.plan === 'enterprise') alert("この操作は、お使いのアカウントではサポートされていません。");
          return; 
      }
      setShowHome(false);
      setMessages(prev => [...prev, { role: 'user', text: 'このスライドの発表用ノートを作成して' }]);
      setIsLoading(true);
      
      const textContent = currentSlide.elements.filter(e => e.type === 'text').map(e => e.content).join('\n');
      const notes = await generateSpeakerNotes(textContent);
      setMessages(prev => [...prev, { role: 'model', text: `はい、こちらが提案です:\n\n${notes}` }]);
      setIsLoading(false);
  };

  const ActionButton = ({ icon: Icon, label, onClick }: any) => (
       <button onClick={onClick} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-white border border-slate-100 hover:border-brand-primary/30 transition-all group w-full shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled={readOnly || !isAiEnabled}>
           <div className="p-2 bg-slate-50 rounded-full mb-2 group-hover:bg-white group-hover:text-brand-primary transition-colors">
               <Icon size={18} className="text-slate-500 group-hover:text-brand-primary"/>
           </div>
           <span className="text-[10px] font-bold text-slate-600 group-hover:text-brand-primary text-center leading-tight">{label}</span>
       </button>
  );

  const UserIcon = AVATAR_ICONS[userProfile.avatar || 'smile'] || Smile;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur z-10 sticky top-0 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md bg-white border border-slate-100">
                 <VisiotLogo size={28} />
             </div>
             <div>
                 <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">Visiot {userProfile.plan === 'pro' && <span className="text-[9px] bg-brand-primary text-white px-1.5 py-0.5 rounded-full">PRO</span>}</h3>
                 <p className="text-[9px] text-slate-400 font-medium">AI Copilot</p>
             </div>
         </div>
         <button onClick={() => { setShowHome(true); setMessages([]); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-1" title="新しいチャット" disabled={readOnly || !isAiEnabled}>
             <PlusCircle size={16}/> <span className="text-xs font-bold hidden sm:inline">New</span>
         </button>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar ${!isAiEnabled && userProfile.plan === 'free' ? 'blur-sm select-none pointer-events-none' : ''}`}>
        {showHome ? (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl shadow-purple-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:translate-y-0 transition-transform duration-700"></div>
                    <h4 className="font-black text-lg mb-2 relative z-10">Hello, {userProfile.name}!</h4>
                    <p className="text-xs opacity-90 mb-4 leading-relaxed relative z-10 max-w-[80%]">
                        Visiotです。スライド作成だけでなく、調べ物やアイデア出しもお手伝いします。
                    </p>
                    <div className="flex gap-2 relative z-10">
                         <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur flex items-center gap-1"><Sparkles size={10}/> Design</div>
                         <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur flex items-center gap-1"><Edit2 size={10}/> Write</div>
                    </div>
                </div>

                <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider ml-1">Quick Actions</h5>
                    <div className="grid grid-cols-2 gap-3">
                        {selectedElement ? (
                            <>
                                <ActionButton icon={Edit2} label="リライト" onClick={() => handleSend("このテキストをもっと魅力的な表現にリライトして。")} />
                                <ActionButton icon={Palette} label="色を変更" onClick={() => handleSend("この要素の色を、スライド全体に合う色に変更して。")} />
                                <ActionButton icon={Sparkles} label="アニメーション" onClick={() => handleSend("この要素にいい感じのアニメーションを追加して。")} />
                                <ActionButton icon={CheckCircle} label="校正" onClick={() => handleSend("このテキストの誤字脱字をチェックして。")} />
                            </>
                        ) : (
                            <>
                                <ActionButton icon={Lightbulb} label="デザイン診断" onClick={() => handleSend("このスライドのデザインを改善して提案して。")} />
                                <ActionButton icon={Mic} label="ノート作成" onClick={handleGenerateNotes} />
                                <ActionButton icon={Layout} label="スライド追加" onClick={() => handleSend("新しいスライドを追加して。")} />
                                <ActionButton icon={Wand2} label="テーマ変更" onClick={() => handleSend("スライドのテーマカラーを変更して。")} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${msg.role === 'user' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-900'}`}>
                           {msg.role === 'user' ? (
                               userProfile.avatar && userProfile.avatar.startsWith('data:') ? <img src={userProfile.avatar} className="w-full h-full rounded-full object-cover"/> : <UserIcon size={16} className="text-slate-600"/>
                           ) : <VisiotLogo size={18}/>}
                        </div>
                        {msg.role === 'user' && <span className="text-[9px] text-slate-400 font-bold max-w-[40px] truncate">{userProfile.name}</span>}
                    </div>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-brand-primary to-orange-600 text-white rounded-tr-sm shadow-orange-100' : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'}`}>
                      <MarkdownText text={msg.text} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                   <div className="flex justify-start gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0"><VisiotLogo size={18}/></div>
                     <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm text-slate-500 text-xs flex items-center gap-2 shadow-sm">
                       <Sparkles size={14} className="animate-spin text-brand-primary" /> 
                       <span>Visiot is thinking...</span>
                     </div>
                   </div>
                )}
            </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-3 bg-white border-t border-slate-100 ${!isAiEnabled && userProfile.plan === 'free' ? 'blur-sm select-none pointer-events-none' : ''}`}>
        {/* Suggested Prompts (Chips) */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mask-gradient-right">
            {suggestions.map((s, i) => (
                <button 
                    key={i} 
                    onClick={() => handleSend(s)} 
                    className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-brand-primary/30 rounded-full text-[10px] font-bold text-slate-600 hover:text-brand-primary transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={readOnly}
                >
                    <Sparkles size={10} className="text-slate-400"/> {s}
                </button>
            ))}
        </div>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isAiEnabled ? "AIに指示、または質問を入力..." : "AI機能は無効化されています"}
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm resize-none h-12 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={readOnly || !isAiEnabled}
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || isLoading || readOnly} className="absolute right-1 top-1 p-2 bg-slate-900 text-white rounded-lg hover:bg-brand-primary disabled:opacity-50 transition-all shadow-sm active:scale-95">
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Pro Plan Overlay (Only for Free, not Enterprise as they see custom alerts) */}
      {!isAiEnabled && userProfile.plan === 'free' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
              <div className="bg-white/90 p-6 rounded-2xl shadow-2xl max-w-[80%] text-center border border-white/50 backdrop-blur-xl">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                      <Lock size={24} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">Proプラン限定機能</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                      AIアシスタント「Visiot」を利用するには<br/>
                      Proプランへのアップグレードが必要です。
                  </p>
                  <button 
                    onClick={() => window.open('https://example.com/', '_blank')}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                      <Crown size={16} /> Proプランに加入
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};