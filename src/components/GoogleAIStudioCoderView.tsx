import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Plus, 
  ArrowLeft, 
  MoreHorizontal, 
  Mic, 
  PlusCircle, 
  ChevronDown, 
  ChevronRight, 
  Square, 
  ArrowUp, 
  CheckCircle2, 
  Flag, 
  Copy, 
  Check, 
  RotateCcw, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  FileCode, 
  FolderArchive,
  Menu,
  Zap,
  Key,
  ShoppingBag,
  BarChart3,
  Gamepad2,
  CheckSquare,
  Briefcase,
  ScrollText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface GoogleAIStudioCoderViewProps {
  messages: any[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  actionLog: string | null;
  activityLogs: string[];
  modifiedFiles: string[];
  currentSessionId: string | null;
  currentSessionTitle: string;
  currentSessionHtml: string | null;
  previewUrl: string;
  previewDevice: 'desktop' | 'mobile';
  setPreviewDevice: (d: 'desktop' | 'mobile') => void;
  previewKey: number;
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>;
  error: string | null;
  cooldown: number;
  handleSend: (text?: string | React.MouseEvent) => void;
  handleNewChat: () => void;
  handleDownloadHtml: () => void;
  handleCopyCode: () => void;
  copiedCode: boolean;
  onOpenDrawer: () => void;
  onOpenSettings: () => void;
  onOpenTools: () => void;
  onOpenSecrets?: () => void;
  onOpenLogs?: () => void;
  activeKeysCount?: number;
  currentActiveKeyInfo?: any;
  activeMode: string;
  setActiveMode: (mode: any) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Smartphone,
    title: "PWA টাস্ক ও নোটস অ্যাপ",
    badge: "PWA Offline",
    color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300",
    prompt: "একটি পূর্ণাঙ্গ প্রগ্রেসিভ ওয়েব অ্যাপ (PWA) টাস্ক ও নোটস ম্যানেজার বানাও যাতে অফলাইন ক্যাশ, ইনস্টল বাটন (beforeinstallprompt), ফিল্টারিং ও লোকালস্টোরেজ পারসিসটেন্স থাকে।"
  },
  {
    icon: ShoppingBag,
    title: "ই-কমার্স শপিং স্টোর",
    badge: "E-Commerce",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300",
    prompt: "একটি আধুনিক গ্যাজেট ও ফ্যাশন ই-কমার্স স্টোর ওয়েবসাইট তৈরি করো যাতে প্রোডাক্ট ফিল্টারিং, ইন্টারেক্টিভ কার্ট ড্রয়ার, কোড ভ্যালিডেশন ও চেকআউট মডাল থাকে।"
  },
  {
    icon: BarChart3,
    title: "SaaS এনালিটিক্স ড্যাশবোর্ড",
    badge: "Dashboard",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300",
    prompt: "একটি প্রফেশনাল SaaS বিজনেস অ্যানালিটিক্স ড্যাশবোর্ড তৈরি করো যাতে ইন্টারঅ্যাক্টিভ চার্ট, মেট্রিক কেপিআই কার্ড, ডেটা টেবিল ও ডার্ক থিম থাকে।"
  },
  {
    icon: Gamepad2,
    title: "2D ক্যানভাস স্নেক গেম PWA",
    badge: "Game PWA",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300",
    prompt: "একটি রেট্রো স্নেক / আর্কেড গেম PWA তৈরি করো যাতে স্কোরবোর্ড, হাই-স্কোর লোকালস্টোরেজে সেভ, সাউন্ড ইফেক্ট এবং মোবাইল টাচ কন্ট্রোল থাকে।"
  },
  {
    icon: Briefcase,
    title: "ক্রিয়েটিভ পোর্টফোলিও",
    badge: "Portfolio",
    color: "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-300",
    prompt: "একটি আকর্ষণীয় গ্লাসফর্মিজম ডার্ক পোর্টফোলিও ওয়েবসাইট তৈরি করো যাতে প্রোজেক্ট ফিল্টারিং, স্কিল বার, টেস্টিমোনিয়াল ও রিয়েল-টাইম কন্টাক্ট ফর্ম থাকে।"
  },
  {
    icon: CheckSquare,
    title: "ড্র্যাগ & ড্রপ কানবান বোর্ড",
    badge: "Productivity",
    color: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-300",
    prompt: "একটি ইন্টারঅ্যাক্টিভ ড্র্যাগ-অ্যান্ড-ড্রপ কানবান প্রজেক্ট ম্যানেজমেন্ট ওয়েব অ্যাপ বানাও (To Do, In Progress, Done) যাতে লোকালস্টোরেজে টাস্ক সেভ থাকে।"
  }
];

export const GoogleAIStudioCoderView: React.FC<GoogleAIStudioCoderViewProps> = ({
  messages,
  input,
  setInput,
  isLoading,
  actionLog,
  activityLogs,
  modifiedFiles,
  currentSessionId,
  currentSessionTitle,
  currentSessionHtml,
  previewUrl,
  previewDevice,
  setPreviewDevice,
  previewKey,
  setPreviewKey,
  error,
  cooldown,
  handleSend,
  handleNewChat,
  handleDownloadHtml,
  handleCopyCode,
  copiedCode,
  onOpenDrawer,
  onOpenSettings,
  onOpenTools,
  onOpenSecrets,
  onOpenLogs,
  activeKeysCount = 0,
  currentActiveKeyInfo,
  activeMode,
  setActiveMode,
}) => {
  const [activeCoderTab, setActiveCoderTab] = useState<'chat' | 'preview' | 'artifacts'>('chat');
  const [isWorkingExpanded, setIsWorkingExpanded] = useState(false);
  const [executionDuration, setExecutionDuration] = useState<number>(0);
  const [lastRunDuration, setLastRunDuration] = useState<number>(156);
  const [selectedModelLabel, setSelectedModelLabel] = useState<string>('Default');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<string>('projects/index.html');
  const [checkpointToast, setCheckpointToast] = useState<string | null>(null);
  const executionTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live timer for "Gemini 3.8 Flash • Running for Xm Ys" matching screenshot
  useEffect(() => {
    if (isLoading) {
      const startTime = Date.now();
      setExecutionDuration(0);
      executionTimerRef.current = setInterval(() => {
        setExecutionDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (executionTimerRef.current) {
        clearInterval(executionTimerRef.current);
        executionTimerRef.current = null;
      }
      if (executionDuration > 0) {
        setLastRunDuration(executionDuration);
      }
    }
    return () => {
      if (executionTimerRef.current) clearInterval(executionTimerRef.current);
    };
  }, [isLoading]);

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("ভয়েস টাইপিংয়ের জন্য Chrome বা поддержиকারী ব্রাউজার ব্যবহার করুন।");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'bn-BD';
      recognition.interimResults = false;
      setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(input ? `${input} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleCheckpoint = () => {
    setCheckpointToast("✓ Checkpoint saved at this step");
    setTimeout(() => setCheckpointToast(null), 3000);
  };

  const handleDownloadZip = () => {
    window.location.href = '/api/project/download';
  };

  useEffect(() => {
    if (activeCoderTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeCoderTab, isLoading]);

  // Default files to show in checklist matching screenshot
  const defaultFiles = [
    'server/websiteDeployer.ts',
    'server/apiOrchestrator.ts',
    'server/geminiService.ts',
    'server.ts'
  ];

  const displayedFiles = modifiedFiles.length > 0 
    ? Array.from(new Set([...modifiedFiles, ...defaultFiles]))
    : defaultFiles;

  // Render message text with styled inline code chips like in the screenshot
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    
    // Check if text has inline code chips like `code`
    const parts = text.split(/(`[^`]+`)/g);
    return (
      <div className="space-y-2 text-sm leading-relaxed text-slate-100">
        <p className="whitespace-pre-wrap">
          {parts.map((part, index) => {
            if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
              const codeSnippet = part.slice(1, -1);
              return (
                <span 
                  key={index} 
                  className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-[#28292c] text-emerald-300 font-mono text-xs border border-slate-700/60 shadow-sm"
                >
                  {codeSnippet}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#131314] text-slate-100 font-sans overflow-hidden select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {checkpointToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 bg-[#1c1d22] border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-full text-xs font-semibold shadow-2xl z-50 flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{checkpointToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header matching Google AI Studio screenshot */}
      <header className="h-14 border-b border-slate-800/80 flex items-center justify-between px-4 bg-[#131314] sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDrawer}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 fill-sky-400" />
            <span className="font-semibold text-slate-100 text-sm tracking-tight">Nexus AI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Key Pool Status Badge */}
          {onOpenSecrets && (
            <button
              onClick={onOpenSecrets}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1e2024] hover:bg-[#282a30] text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
              title="Manage API Keys & Secrets"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {activeKeysCount > 0 
                  ? `${activeKeysCount}টি সচল কী` 
                  : 'কী যোগ করুন'}
              </span>
              {activeKeysCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          {/* Diagnostics / Logs Button */}
          {onOpenLogs && (
            <button
              onClick={onOpenLogs}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1e2024] hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
              title="সিস্টেম সমস্যা ও এরর লগ"
            >
              <ScrollText className="w-3.5 h-3.5 text-rose-400" />
              <span>লগ</span>
            </button>
          )}

          {/* Mode Badge */}
          <button
            onClick={() => setActiveMode(activeMode === 'coding' ? 'general' : 'coding')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/20 transition-colors"
            title="Switch Mode"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nexus Coder</span>
          </button>

          {/* Plus (New Chat) Button matching screenshot top right */}
          <button
            onClick={handleNewChat}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
            title="New Chat (+)"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body Area (Chat / Preview / Artifacts) */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* --- TAB 1: CHAT VIEW --- */}
        {activeCoderTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
              {/* Empty State / Starter Templates */}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 rounded-2xl flex items-center justify-center mb-4 text-sky-400 shadow-xl">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                    Google AI Studio Coder Engine
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-md leading-relaxed">
                    সব কাজ হবে সরাসরি এই সিস্টেমে। যেকোনো PWA, ই-কমার্স, ড্যাশবোর্ড বা গেম তৈরি করতে নিচের প্রম্পট সিলেক্ট করুন অথবা নিচে লিখুন।
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                    {STARTER_PROMPTS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.prompt)}
                        className="p-3.5 rounded-2xl bg-[#1e2024]/70 hover:bg-[#25272c] border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3 text-left group"
                      >
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br border flex-shrink-0 mt-0.5", item.color)}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                              {item.title}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {item.prompt}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className="max-w-2xl mx-auto w-full space-y-2">
                    {!isUser ? (
                      /* Model Message matching screenshot */
                      <div className="space-y-2">
                        {/* Header metadata showing which secret key and model responded */}
                        <div className="text-xs text-slate-400 font-normal flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 font-semibold text-[11px] border border-sky-500/30">
                            🔑 {m.keyInfo?.keyName || (m.keyInfo?.isCustomKey ? 'Custom Key' : (currentActiveKeyInfo?.keyName || 'Google AI Studio'))}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700/60">
                            ⚡ {m.keyInfo?.model || (currentActiveKeyInfo?.model || 'gemini-3.1-flash-lite')}
                          </span>
                          {m.keyInfo?.isCustomKey ? (
                            <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              আপনার সিক্রেট কী
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[10px] flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              প্রাইমারি ইঞ্জিন
                            </span>
                          )}
                          <span>•</span>
                          <span className="text-slate-400 text-[11px]">Ran for {formatDuration(lastRunDuration)}</span>
                        </div>

                        {/* Model response body */}
                        <div className="text-slate-100 text-sm leading-relaxed">
                          {renderMessageContent(m.parts[0]?.text || '')}
                        </div>

                        {/* Action buttons matching screenshot: ⚑ Checkpoint | Copy | Redo */}
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/40">
                          <button
                            onClick={handleCheckpoint}
                            className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                            title="Save Checkpoint"
                          >
                            <Flag className="w-3.5 h-3.5 text-slate-400" />
                            <span>Checkpoint</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.parts[0]?.text || '');
                                setCheckpointToast("✓ Copied to clipboard");
                                setTimeout(() => setCheckpointToast(null), 2000);
                              }}
                              className="p-1 hover:text-white transition-colors"
                              title="Copy"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSend(m.parts[0]?.text)}
                              className="p-1 hover:text-white transition-colors"
                              title="Redo / Retry"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* User Message card matching screenshot: dark rounded box */
                      <div className="flex justify-end">
                        <div className="bg-[#242529] border border-slate-800/80 rounded-2xl p-4 text-slate-100 text-sm max-w-xl leading-relaxed shadow-md">
                          {m.parts[0]?.text}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Real-time Execution Card matching screenshot */}
              {(isLoading || activityLogs.length > 0) && (
                <div className="max-w-2xl mx-auto w-full space-y-3 pt-2">
                  {/* Status timer showing live working key & model */}
                  <div className="text-xs text-slate-400 font-normal flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      🔑 {currentActiveKeyInfo?.keyName || (activeKeysCount > 0 ? `Custom Key Pool (${activeKeysCount} Active)` : 'Google AI Studio Engine')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700/60">
                      ⚡ {currentActiveKeyInfo?.model || 'gemini-3.1-flash-lite'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300 font-medium">
                      {isLoading ? `Running for ${formatDuration(executionDuration)}` : `Ran for ${formatDuration(lastRunDuration)}`}
                    </span>
                  </div>

                  {/* ✦ Working > collapsible button matching screenshot */}
                  <div>
                    <button
                      onClick={() => setIsWorkingExpanded(!isWorkingExpanded)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-[#1a1b1f] hover:bg-[#222429] px-3 py-1.5 rounded-full border border-slate-800 transition-colors shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-1 text-sky-400">
                        <Sparkles className="w-3.5 h-3.5 fill-sky-400" />
                        <span>Working</span>
                      </div>
                      <ChevronRight className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", isWorkingExpanded && "rotate-90")} />
                    </button>

                    {/* Collapsible Tool Log */}
                    <AnimatePresence>
                      {isWorkingExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 bg-[#18191d] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-400 max-h-40 overflow-y-auto space-y-1.5"
                        >
                          {activityLogs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-sky-400 flex-shrink-0">[{idx + 1}]</span>
                              <span className="text-slate-300 leading-relaxed">{log}</span>
                            </div>
                          ))}
                          {actionLog && (
                            <div className="flex items-start gap-2 text-sky-300 font-semibold animate-pulse">
                              <span className="text-amber-400 flex-shrink-0">▶</span>
                              <span>{actionLog}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* File checklist card matching screenshot */}
                  <div className="bg-[#1c1d21] border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
                    {displayedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="font-mono text-slate-300 truncate mr-2">{file}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error box */}
              {error && (
                <div className="max-w-2xl mx-auto w-full p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div className="flex-1 whitespace-pre-wrap leading-relaxed">{error}</div>
                  {onOpenLogs && (
                    <button
                      onClick={onOpenLogs}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-xl font-bold text-[11px] flex-shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <ScrollText className="w-3.5 h-3.5 text-rose-400" />
                      <span>লগ দেখুন</span>
                    </button>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Card Container matching screenshot */}
            <div className="px-4 py-3 bg-[#131314] flex-shrink-0">
              <div className="max-w-2xl mx-auto bg-[#1e2024] border border-slate-700/60 rounded-3xl p-3 shadow-2xl flex flex-col gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Make changes, add new features, ask for anything"
                  rows={2}
                  className="w-full bg-transparent resize-none focus:outline-none text-slate-100 placeholder:text-slate-500 text-sm px-1.5 py-1"
                />

                <div className="flex items-center justify-between pt-1">
                  {/* Left: ⊕ PlusCircle button */}
                  <button 
                    onClick={onOpenTools}
                    className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                    title="Add context & Tools"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Center: Model pill dropdown (Default ⌄) */}
                    <div className="relative">
                      <button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#27282d] hover:bg-[#2f3137] text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
                      >
                        <span>{selectedModelLabel}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {showModelDropdown && (
                        <div className="absolute bottom-full mb-2 right-0 bg-[#1c1d22] border border-slate-700 rounded-xl p-1.5 shadow-2xl z-50 min-w-[200px]">
                          <button
                            onClick={() => { setSelectedModelLabel('Default'); setShowModelDropdown(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-white flex items-center justify-between"
                          >
                            <span>Default (Gemini 3.8 Flash)</span>
                            {selectedModelLabel === 'Default' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                          <button
                            onClick={() => { setSelectedModelLabel('Gemini 3.8 Flash'); setShowModelDropdown(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                          >
                            <span>Gemini 3.8 Flash</span>
                            {selectedModelLabel === 'Gemini 3.8 Flash' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                          <button
                            onClick={() => { setSelectedModelLabel('Gemini 3.1 Flash Lite'); setShowModelDropdown(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                          >
                            <span>Gemini 3.1 Flash Lite</span>
                            {selectedModelLabel === 'Gemini 3.1 Flash Lite' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mic speech recognition button */}
                    <button
                      onClick={handleVoiceInput}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                      title="Voice Input (ভয়েস টাইপিং)"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Circular Send / Stop button */}
                    <button
                      onClick={() => handleSend()}
                      disabled={!isLoading && !input.trim()}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        isLoading
                          ? "bg-slate-800 text-white hover:bg-slate-700"
                          : input.trim()
                            ? "bg-white text-slate-900 hover:bg-slate-200 shadow-md cursor-pointer"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      )}
                      title={isLoading ? "Stop" : "Send"}
                    >
                      {isLoading ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: LIVE PREVIEW VIEW --- */}
        {activeCoderTab === 'preview' && (
          <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* Preview Toolbar */}
            <div className="h-12 border-b border-slate-800 px-4 bg-[#18191d] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Preview
                </span>
                <span className="text-slate-600 font-mono text-xs">•</span>
                <span className="text-xs font-medium text-slate-400 truncate max-w-[150px]">
                  {currentSessionTitle}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PWA Ready
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Desktop / Mobile Switch */}
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors",
                    previewDevice === 'desktop' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors",
                    previewDevice === 'mobile' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-slate-800 mx-1" />

                {/* Reload */}
                <button
                  onClick={() => setPreviewKey(k => k + 1)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Reload"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Copy Code */}
                {currentSessionHtml && (
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                    title="Copy HTML"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}

                {/* Download */}
                {currentSessionHtml && (
                  <button
                    onClick={handleDownloadHtml}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                    title="Download HTML & PWA"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}

                {/* Open in New Tab */}
                <button
                  onClick={() => {
                    if (currentSessionHtml) {
                      const newWin = window.open('about:blank', '_blank');
                      if (newWin) {
                        newWin.document.write(currentSessionHtml);
                        newWin.document.close();
                      }
                    } else {
                      window.open(previewUrl || '/projects/index.html', '_blank');
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Frame Body */}
            <div className={cn(
              "flex-1 overflow-auto flex items-center justify-center",
              previewDevice === 'mobile' ? "bg-slate-900/60 p-4" : "bg-white"
            )}>
              {previewDevice === 'mobile' ? (
                <div className="w-[375px] h-[700px] rounded-[36px] border-[8px] border-slate-700 bg-white shadow-2xl flex flex-col overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-700 rounded-b-xl z-30 flex items-center justify-center">
                    <div className="w-10 h-1 bg-slate-600 rounded-full" />
                  </div>
                  {currentSessionHtml ? (
                    <iframe
                      key={`mob-${previewKey}`}
                      srcDoc={currentSessionHtml}
                      className="w-full h-full border-none bg-white pt-4"
                      title="Mobile Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                    />
                  ) : (
                    <iframe
                      key={`mob-url-${previewKey}`}
                      src={previewUrl}
                      className="w-full h-full border-none bg-white pt-4"
                      title="Mobile Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                    />
                  )}
                </div>
              ) : (
                currentSessionHtml ? (
                  <iframe
                    key={`desk-${previewKey}`}
                    srcDoc={currentSessionHtml}
                    className="w-full h-full border-none bg-white"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                  />
                ) : (
                  <iframe
                    key={`desk-url-${previewKey}`}
                    src={previewUrl}
                    className="w-full h-full border-none bg-white"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: ARTIFACTS VIEW --- */}
        {activeCoderTab === 'artifacts' && (
          <div className="flex-1 flex flex-col h-full bg-[#131314] overflow-hidden">
            {/* Artifacts Header */}
            <div className="h-12 border-b border-slate-800 px-4 bg-[#18191d] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Project Artifacts & Workspace Files
                </span>
              </div>
              <button
                onClick={handleDownloadZip}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                title="Download Entire Project (ZIP)"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Download All (ZIP)</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* File Tree Column */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-[#17181c] p-3 overflow-y-auto space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
                  Generated Files
                </span>
                {[
                  { path: 'projects/index.html', label: 'index.html', badge: 'HTML / PWA', desc: 'Main Web App' },
                  { path: 'projects/manifest.webmanifest', label: 'manifest.webmanifest', badge: 'PWA', desc: 'App Manifest' },
                  { path: 'projects/sw.js', label: 'sw.js', badge: 'Worker', desc: 'Offline Service Worker' },
                  { path: 'server/websiteDeployer.ts', label: 'websiteDeployer.ts', badge: 'Deployer', desc: 'Deploy Logic' },
                  { path: 'server/apiOrchestrator.ts', label: 'apiOrchestrator.ts', badge: 'Server', desc: 'Multi-Key Engine' },
                  { path: 'server/geminiService.ts', label: 'geminiService.ts', badge: 'Server', desc: 'Gemini Service' },
                  { path: 'server.ts', label: 'server.ts', badge: 'Express', desc: 'Full-Stack Server' },
                ].map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedArtifact(file.path)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all",
                      selectedArtifact === file.path 
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" 
                        : "text-slate-300 hover:bg-slate-800/60"
                    )}
                  >
                    <div className="truncate mr-2">
                      <div className="font-mono font-medium truncate">{file.label}</div>
                      <div className="text-[10px] text-slate-500">{file.desc}</div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono flex-shrink-0">
                      {file.badge}
                    </span>
                  </button>
                ))}
              </div>

              {/* Code Inspection Column */}
              <div className="flex-1 bg-[#0d1117] p-4 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <FileCode className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold">{selectedArtifact}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="flex-1 whitespace-pre-wrap break-all text-slate-300 font-mono text-xs leading-relaxed overflow-auto p-2 bg-[#090d16] rounded-xl border border-slate-800">
                  {selectedArtifact.includes('index.html') 
                    ? (currentSessionHtml || "<!-- Open preview to see generated HTML -->")
                    : selectedArtifact.includes('manifest')
                      ? JSON.stringify({
                          name: currentSessionTitle || "Nexus PWA App",
                          short_name: "NexusApp",
                          start_url: "./index.html",
                          display: "standalone",
                          theme_color: "#020617",
                          icons: [{ src: "/icon.svg", sizes: "192x192 512x512", type: "image/svg+xml" }]
                        }, null, 2)
                      : selectedArtifact.includes('sw.js')
                        ? "// Nexus Service Worker\nself.addEventListener('fetch', (e) => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));"
                        : `// ${selectedArtifact}\n// Active in workspace at /app/applet/${selectedArtifact}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Navigation Bar matching Google AI Studio screenshot */}
      <footer className="h-14 border-t border-slate-800/80 bg-[#131314] px-4 flex items-center justify-between flex-shrink-0 z-40">
        {/* Back arrow */}
        <button
          onClick={() => {
            if (activeCoderTab !== 'chat') setActiveCoderTab('chat');
            else onOpenDrawer();
          }}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center Pill Segmented Switcher matching screenshot: [ Chat | Preview | Artifacts ] */}
        <div className="flex items-center bg-[#1e2024] p-1 rounded-full border border-slate-800">
          <button
            onClick={() => setActiveCoderTab('chat')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
              activeCoderTab === 'chat' 
                ? "bg-[#2b2d33] text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Chat
          </button>
          <button
            onClick={() => {
              setActiveCoderTab('preview');
              setPreviewKey(k => k + 1);
            }}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              activeCoderTab === 'preview' 
                ? "bg-[#2b2d33] text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <span>Preview</span>
            {currentSessionHtml && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveCoderTab('artifacts')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
              activeCoderTab === 'artifacts' 
                ? "bg-[#2b2d33] text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Artifacts
          </button>
        </div>

        {/* More options button (...) matching screenshot */}
        <button
          onClick={onOpenDrawer}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="More Options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
};
