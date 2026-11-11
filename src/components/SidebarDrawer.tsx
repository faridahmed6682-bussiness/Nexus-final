import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Sparkles, 
  History, 
  Layout, 
  Wrench, 
  Sliders, 
  BookOpen as DocIcon,
  Github, 
  Flame, 
  Settings, 
  Key, 
  Search, 
  Bell, 
  Trash2, 
  ChevronRight, 
  MessageSquare, 
  ChevronDown, 
  Zap, 
  ExternalLink,
  PanelLeftClose,
  FolderGit2,
  ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatSession, getAllSessions, deleteSession, clearAllSessions } from '../lib/db';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenSecrets: () => void;
  onOpenGitHub: () => void;
  onOpenFirebase: () => void;
  onOpenTools: () => void;
  onOpenLogs?: () => void;
  onTogglePreview: () => void;
  activeKeysCount: number;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onOpenSettings,
  onOpenSecrets,
  onOpenGitHub,
  onOpenFirebase,
  onOpenTools,
  onOpenLogs,
  onTogglePreview,
  activeKeysCount,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showHistoryList, setShowHistoryList] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load chat history from IndexedDB
  const reloadSessions = async () => {
    try {
      const list = await getAllSessions();
      setSessions(list);
    } catch (err) {
      console.warn("Failed to load IndexedDB sessions:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadSessions();
    }
  }, [isOpen, currentSessionId]);

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteSession(id);
      await reloadSessions();
      if (currentSessionId === id) {
        onNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to clear all offline chat history?")) {
      await clearAllSessions();
      await reloadSessions();
      onNewChat();
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Drawer Sidebar */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 w-[290px] sm:w-[320px] bg-[#0c1017] border-r border-slate-800/80 z-50 flex flex-col shadow-2xl font-sans text-slate-300 select-none overflow-hidden"
          >
            {/* Top Brand Bar */}
            <div className="h-16 px-5 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-white text-base tracking-tight leading-none">
                    Nexus AI
                  </h1>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Studio Orchestrator
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
              
              {/* BUILD SECTION: Primary "+ New app / New chat" Button */}
              <div>
                <button
                  onClick={() => {
                    onNewChat();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#1e2330] hover:bg-[#252b3d] text-white rounded-2xl text-xs font-bold transition-all border border-slate-700/60 shadow-lg group"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm tracking-tight">+ New chat</span>
                </button>
              </div>

              {/* EXPLORE SECTION */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                  EXPLORE
                </div>

                {/* Playground / Active Chat */}
                <button
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all text-left"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Playground (চ্যাট ক্যানভাস)</span>
                </button>

                {/* History Header & Collapse */}
                <div className="pt-2">
                  <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-400">
                    <button 
                      onClick={() => setShowHistoryList(!showHistoryList)}
                      className="flex items-center gap-2 font-semibold hover:text-white transition-colors"
                    >
                      <History className="w-4 h-4 text-slate-400" />
                      <span>History ({sessions.length})</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showHistoryList ? '' : '-rotate-90'}`} />
                    </button>
                    {sessions.length > 0 && (
                      <button
                        onClick={handleClearAllHistory}
                        className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                        title="Clear all offline chats"
                      >
                        ক্লিয়ার
                      </button>
                    )}
                  </div>

                  {/* IndexedDB Chat History Sessions */}
                  {showHistoryList && (
                    <div className="mt-1 space-y-1 pl-1">
                      {/* Search in history */}
                      {sessions.length > 4 && (
                        <div className="px-2 pb-1.5">
                          <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="হিস্ট্রি খুঁজুন..."
                            className="w-full px-2.5 py-1.5 text-[11px] bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      {filteredSessions.length === 0 ? (
                        <div className="px-3 py-3 text-[11px] text-slate-500 italic">
                          কোনো পূর্ববর্তী চ্যাট হিস্ট্রি নেই
                        </div>
                      ) : (
                        filteredSessions.slice(0, 15).map((s) => {
                          const isSelected = currentSessionId === s.id;
                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                onSelectSession(s.id);
                                onClose();
                              }}
                              className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30' 
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                                <span className="truncate max-w-[170px] text-[11px]">
                                  {s.title}
                                </span>
                              </div>
                              <button
                                onClick={(e) => handleDeleteSession(e, s.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-all rounded"
                                title="Delete chat session"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* BUILD SECTION */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                  BUILD
                </div>

                <button
                  onClick={() => {
                    onTogglePreview();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all text-left"
                >
                  <Layout className="w-4 h-4 text-sky-400" />
                  <span>My Apps / Live Preview (প্রিভিউ)</span>
                </button>

                <button
                  onClick={() => {
                    onOpenTools();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-indigo-400" />
                    <span>Agent Tools</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    50 Tools
                  </span>
                </button>
              </div>

              {/* MANAGE SECTION */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                  MANAGE
                </div>

                <button
                  onClick={() => {
                    onOpenLogs?.();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/30 border border-rose-500/20 hover:border-rose-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <ScrollText className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">লগ (System & Error Logs)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    সমস্যা
                  </span>
                </button>

                <button
                  onClick={() => {
                    onOpenSecrets();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-violet-400" />
                    <span>API Secrets (সিক্রেট)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {activeKeysCount} Keys
                  </span>
                </button>

                <button
                  onClick={() => {
                    onOpenGitHub();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Github className="w-4 h-4 text-slate-300" />
                    <span>GitHub Sync (গিটহাব)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onOpenFirebase();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Firebase Cloud Suite</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/60 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Settings (সেটিংস)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* Bottom Glowing Banner Card (Inspired by screenshot's Gemini Ultra/Carbon Card) */}
              <div 
                onClick={() => {
                  onOpenSecrets();
                  onClose();
                }}
                className="cursor-pointer p-4 rounded-2xl bg-gradient-to-b from-[#161d2d] to-[#0f1420] border border-indigo-500/30 hover:border-indigo-500/60 transition-all relative overflow-hidden group shadow-lg"
              >
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                <div className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Free Multi-API Engine</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                  OpenRouter, Grok এবং Google AI Studio-এর আনলিমিটেড ফ্রি কোটা ও অটো-রোটেশন সক্রিয়।
                </p>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300">
                  <span>কী ম্যানেজার ওপেন করুন</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>

            {/* Bottom Toolbar & Profile Bar (Matching Screenshot) */}
            <div className="p-3 border-t border-slate-800/60 bg-[#080b11] space-y-2 flex-shrink-0">
              {/* Quick Icons Row */}
              <div className="flex items-center justify-around py-1 text-slate-400">
                <button 
                  onClick={() => { onOpenSettings(); onClose(); }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { onOpenSecrets(); onClose(); }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all"
                  title="API Secrets"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { onOpenGitHub(); onClose(); }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all"
                  title="GitHub Sync"
                >
                  <Github className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { onOpenTools(); onClose(); }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all"
                  title="Developer Tools"
                >
                  <Wrench className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Pill matching screenshot's ahmedmdforid39@gmail.com */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-white shadow-inner flex-shrink-0">
                  N
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-[11px] font-semibold text-slate-200 truncate">
                    ahmedmdforid39@gmail.com
                  </div>
                  <div className="text-[9px] text-emerald-400 font-medium">
                    Offline IndexedDB Sync Active
                  </div>
                </div>
              </div>
            </div>

          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
