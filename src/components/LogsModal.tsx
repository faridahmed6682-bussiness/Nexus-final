import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  RotateCw, 
  ShieldAlert,
  Search,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'success';
  category: 'auth' | 'rate_limit' | 'rotation' | 'execution' | 'network' | 'pool' | 'key_error';
  keyName?: string;
  provider?: string;
  model?: string;
  message: string;
  details?: string;
}

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSecrets?: () => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose, onOpenSecrets }) => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'error' | 'warn' | 'rotation' | 'success'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/system-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Failed to fetch system logs:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchLogs().finally(() => setLoading(false));

    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const handleClear = async () => {
    try {
      const res = await fetch('/api/system-logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  const handleCopy = () => {
    const text = logs.map(l => {
      const date = new Date(l.timestamp).toLocaleTimeString();
      return `[${date}] [${l.level.toUpperCase()}] [${l.category}] ${l.keyName ? `(${l.keyName}) ` : ''}${l.message}${l.details ? `\nDetails: ${l.details}` : ''}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorCount = useMemo(() => logs.filter(l => l.level === 'error').length, [logs]);
  const warnCount = useMemo(() => logs.filter(l => l.level === 'warn').length, [logs]);
  const rotationCount = useMemo(() => logs.filter(l => l.category === 'rotation').length, [logs]);
  const successCount = useMemo(() => logs.filter(l => l.level === 'success').length, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (activeFilter === 'error' && log.level !== 'error') return false;
      if (activeFilter === 'warn' && log.level !== 'warn') return false;
      if (activeFilter === 'rotation' && log.category !== 'rotation') return false;
      if (activeFilter === 'success' && log.level !== 'success') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const msg = (log.message || '').toLowerCase();
        const keyName = (log.keyName || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        return msg.includes(q) || keyName.includes(q) || details.includes(q);
      }
      return true;
    });
  }, [logs, activeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] bg-[#0c1017] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans text-slate-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    সিস্টেম ও সমস্যা লগ (Diagnostics & Logs)
                  </h2>
                  {errorCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {errorCount} সমস্যা চিহ্নিত
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      সব স্বাভাবিক
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  কী এরর, 401 Unauthorized, 429 রেট লিমিট ও অটো-রোটেশনের বিস্তারিত তালিকা
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sticky Status Banner */}
          <div className="px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-300">
              <Key className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>পলিসি:</strong> প্রাইমারি ইঞ্জিন বন্ধ • শুধুমাত্র আপনার সিক্রেট কী কাজ করবে • গতবারের সফল কী অগ্রাধিকার পাবে
              </span>
            </div>
            {onOpenSecrets && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSecrets();
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1"
              >
                কী ম্যানেজ করুন &rarr;
              </button>
            )}
          </div>

          {/* Filter Bar & Controls */}
          <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-800/60 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700 shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>সকল ({logs.length})</span>
              </button>
              <button
                onClick={() => setActiveFilter('error')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'error'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                    : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>সমস্যা/এরর ({errorCount})</span>
              </button>
              <button
                onClick={() => setActiveFilter('warn')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'warn'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>সতর্কতা/429 ({warnCount})</span>
              </button>
              <button
                onClick={() => setActiveFilter('rotation')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'rotation'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow'
                    : 'text-slate-400 hover:text-sky-300 hover:bg-sky-500/10'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                <span>কী রোটেশন ({rotationCount})</span>
              </button>
              <button
                onClick={() => setActiveFilter('success')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                    : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>সফল ({successCount})</span>
              </button>
            </div>

            {/* Right Tools: Search, Copy, Clear */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="লগ খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleCopy}
                disabled={logs.length === 0}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="লগ কপি করুন"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'কপি হয়েছে' : 'কপি'}</span>
              </button>

              <button
                onClick={handleClear}
                disabled={logs.length === 0}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="লগ মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">ক্লিয়ার</span>
              </button>
            </div>
          </div>

          {/* Logs List Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-300 mb-1">
                  কোনো লগ বা সমস্যা নেই
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || activeFilter !== 'all' 
                    ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো লগ পাওয়া যায়নি।' 
                    : 'নেক্সাস সিস্টেমে এই মুহূর্তে কোনো সমস্যা রেকর্ড করা হয়নি। আপনার সমস্ত সিক্রেট কী এবং রিকোয়েস্টের লগ এখানে রিয়েল-টাইমে প্রদর্শিত হবে।'}
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString();
                const isError = log.level === 'error';
                const isWarn = log.level === 'warn';
                const isSuccess = log.level === 'success';

                return (
                  <div
                    key={log.id}
                    className={`p-3 sm:p-4 rounded-2xl border transition-all text-xs font-mono ${
                      isError
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : isSuccess
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 font-sans">
                      <div className="flex items-center gap-2">
                        {isError && <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                        {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        {!isError && !isWarn && !isSuccess && <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                        
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isError
                            ? 'bg-rose-500/30 text-rose-300'
                            : isWarn
                            ? 'bg-amber-500/30 text-amber-300'
                            : isSuccess
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {log.category}
                        </span>

                        {log.keyName && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[11px] font-semibold flex items-center gap-1 border border-slate-700/60">
                            <Key className="w-3 h-3 text-indigo-400" />
                            {log.keyName}
                          </span>
                        )}

                        {log.model && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 text-[10px]">
                            {log.model}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono">
                        {timeStr}
                      </span>
                    </div>

                    <p className="font-sans text-xs leading-relaxed whitespace-pre-wrap">
                      {log.message}
                    </p>

                    {log.details && (
                      <div className="mt-2 p-2 bg-black/40 rounded-xl border border-slate-800/70 text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap break-all">
                        {log.details}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:px-5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-800"
                />
                <span>অটো-রিফ্রেশ (২.৫ সেকেন্ড)</span>
              </label>
            </div>
            <span>মোট {logs.length} টি লগ এন্ট্রি সংরক্ষিত</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
