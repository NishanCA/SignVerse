"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trash2, Bookmark, Clock, Calendar as CalendarIcon, MessageSquare, Filter, Info, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { userService, ConversationLog } from "../../lib/userService";

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ConversationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");

  useEffect(() => {
    setHistory(userService.getHistory());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    userService.deleteConversation(id);
    setHistory(userService.getHistory());
    if (selectedLog?.id === id) setSelectedLog(null);
  };

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    userService.toggleSaveConversation(id);
    setHistory(userService.getHistory());
    if (selectedLog?.id === id) {
      setSelectedLog({ ...selectedLog, isSaved: !selectedLog.isSaved });
    }
  };

  const clearFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterStartTime("");
    setFilterEndTime("");
  };

  const filteredHistory = history.filter(log => {
    const logDate = new Date(log.date);
    
    // Date filtering
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);
      if (logDate < start) return false;
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }
    
    // Time filtering
    if (filterStartTime) {
      const [hours, minutes] = filterStartTime.split(':').map(Number);
      const logTime = logDate.getHours() * 60 + logDate.getMinutes();
      const startTime = hours * 60 + minutes;
      if (logTime < startTime) return false;
    }
    if (filterEndTime) {
      const [hours, minutes] = filterEndTime.split(':').map(Number);
      const logTime = logDate.getHours() * 60 + logDate.getMinutes();
      const endTime = hours * 60 + minutes;
      if (logTime > endTime) return false;
    }

    return true;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen p-6 relative overflow-x-hidden flex flex-col">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <header className="flex items-center mb-8 mt-2 justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-2xl font-bold ml-2">Conversation History</h1>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${showFilters || filterStartDate || filterEndDate || filterStartTime || filterEndTime ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/10 hover:bg-white/20 text-slate-300'}`}
        >
          <Filter size={18} />
          <span className="font-medium text-sm hidden sm:inline">Filters</span>
          {(filterStartDate || filterEndDate || filterStartTime || filterEndTime) && (
            <span className="w-2 h-2 rounded-full bg-yellow-400 absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto" />
          )}
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full pb-20">
        
        {/* Sidebar List */}
        <div className={`w-full flex flex-col gap-4 ${selectedLog ? 'hidden' : 'flex'}`}>
          
          {/* Deletion Warning Banner */}
          <div className="glass-card bg-amber-500/10 border-amber-500/20 p-3 flex items-start gap-3">
            <Info className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-slate-300">
              Chats that are not <Bookmark size={14} className="inline-block text-yellow-400 mx-1" fill="currentColor" /> <strong>Saved</strong> will be automatically deleted after 20 days.
            </p>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-4 bg-slate-900/50 border-purple-500/30 shadow-inner shadow-purple-500/5 space-y-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      <Filter size={14} /> Filter Timeline
                    </h3>
                    {(filterStartDate || filterEndDate || filterStartTime || filterEndTime) && (
                      <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                        <X size={12} /> Clear all
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Date Range (Start - End)</label>
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={filterStartDate}
                          onChange={e => setFilterStartDate(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500" 
                        />
                        <input 
                          type="date" 
                          value={filterEndDate}
                          onChange={e => setFilterEndDate(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Time Range (Start - End)</label>
                      <div className="flex gap-2">
                        <input 
                          type="time" 
                          value={filterStartTime}
                          onChange={e => setFilterStartTime(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500" 
                        />
                        <input 
                          type="time" 
                          value={filterEndTime}
                          onChange={e => setFilterEndTime(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredHistory.length === 0 ? (
            <div className="glass-card p-8 text-center flex flex-col items-center justify-center flex-1">
              <MessageSquare size={48} className="text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium">{history.length === 0 ? "No conversations done yet." : "No matching conversations."}</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3">
              {filteredHistory.map(log => {
                const date = new Date(log.date);
                return (
                  <motion.div 
                    key={log.id}
                    variants={itemVariants}
                    onClick={() => setSelectedLog(log)}
                    className={`glass-card p-4 cursor-pointer transition-all ${selectedLog?.id === log.id ? 'ring-2 ring-purple-500 bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <CalendarIcon size={14} className="text-purple-400" />
                        {date.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleToggleSave(log.id, e)}
                          className={`p-1.5 rounded-full transition-colors ${log.isSaved ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-500 hover:text-yellow-400 hover:bg-white/10'}`}
                        >
                          <Bookmark size={16} fill={log.isSaved ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(log.id, e)}
                          className="p-1.5 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                      <Clock size={12} />
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-sm text-slate-200 line-clamp-2 italic">
                      "{log.messages[0]?.text || 'No text'}"
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{log.messages.length} messages</span>
                      {log.isSaved && <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">SAVED</span>}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Detail View */}
        <div className={`w-full glass-card flex-col ${selectedLog ? 'flex' : 'hidden'}`}>
          {selectedLog ? (
            <>
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedLog(null)} className="p-2 -ml-2 rounded-full hover:bg-white/10 flex items-center gap-1 text-sm font-medium text-purple-300">
                    <ChevronLeft size={20} /> Back to List
                  </button>
                  <h2 className="font-bold ml-2">Conversation Log</h2>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {new Date(selectedLog.date).toLocaleString()}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]">
                {selectedLog.messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    <div className={`p-3 rounded-2xl text-sm ${msg.sender === "user" ? "bg-purple-600 text-white rounded-br-sm" : "bg-slate-800 text-slate-200 rounded-bl-sm border border-white/5"}`}>
                      <p>{msg.text}</p>
                      {msg.translation && <p className="text-xs mt-1 pt-1 border-t border-white/10 opacity-80">{msg.translation}</p>}

                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p>Select a conversation from the list to view its details.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
