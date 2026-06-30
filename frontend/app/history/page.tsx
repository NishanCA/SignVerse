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
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-6 relative overflow-x-hidden flex flex-col pb-24 md:pt-6">
      
      <header className="flex items-center mb-6 justify-between max-w-6xl mx-auto w-full pt-4">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold ml-2 text-[var(--text-primary)]">Conversation History</h1>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors focus-ring outline-none ${showFilters || filterStartDate || filterEndDate || filterStartTime || filterEndTime ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Filter size={16} />
          <span className="font-medium text-sm hidden sm:inline">Filters</span>
          {(filterStartDate || filterEndDate || filterStartTime || filterEndTime) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
          )}
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full min-h-[500px]">
        
        {/* Sidebar List */}
        <div className={`w-full md:max-w-md flex flex-col gap-4 ${selectedLog ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Deletion Warning Banner */}
          <div className="bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/10 rounded-xl p-3 flex items-start gap-3">
            <Info className="text-[var(--accent-red)]/80 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Chats that are not <Bookmark size={12} className="inline-block text-[var(--text-primary)] mx-0.5" /> <strong>Saved</strong> will be automatically deleted after 20 days.
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
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                      Filter Timeline
                    </h3>
                    {(filterStartDate || filterEndDate || filterStartTime || filterEndTime) && (
                      <button onClick={clearFilters} className="text-xs font-medium text-[var(--accent-blue)] hover:underline focus-ring outline-none rounded">
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">Date Range</label>
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={filterStartDate}
                          onChange={e => setFilterStartDate(e.target.value)}
                          className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-tertiary)]" 
                        />
                        <input 
                          type="date" 
                          value={filterEndDate}
                          onChange={e => setFilterEndDate(e.target.value)}
                          className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-tertiary)]" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-primary)] mb-1.5 block">Time Range</label>
                      <div className="flex gap-2">
                        <input 
                          type="time" 
                          value={filterStartTime}
                          onChange={e => setFilterStartTime(e.target.value)}
                          className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-tertiary)]" 
                        />
                        <input 
                          type="time" 
                          value={filterEndTime}
                          onChange={e => setFilterEndTime(e.target.value)}
                          className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-tertiary)]" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredHistory.length === 0 ? (
            <div className="border border-dashed border-[var(--border-subtle)] rounded-2xl p-8 text-center flex flex-col items-center justify-center flex-1">
              <MessageSquare size={32} className="text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">{history.length === 0 ? "No conversations yet." : "No matching conversations."}</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4">
              {filteredHistory.map(log => {
                const date = new Date(log.date);
                const isSelected = selectedLog?.id === log.id;
                return (
                  <motion.button 
                    key={log.id}
                    variants={itemVariants}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--accent-blue)] ${isSelected ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)] shadow-sm' : 'bg-[var(--bg-primary)] border-transparent hover:bg-[var(--bg-secondary)]'}`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                        {date.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          onClick={(e) => handleToggleSave(log.id, e)}
                          className={`p-1.5 rounded-md transition-colors hover:bg-[var(--bg-tertiary)] ${log.isSaved ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}
                          role="button"
                          tabIndex={0}
                        >
                          <Bookmark size={14} fill={log.isSaved ? "currentColor" : "none"} />
                        </div>
                        <div 
                          onClick={(e) => handleDelete(log.id, e)}
                          className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-colors"
                          role="button"
                          tabIndex={0}
                        >
                          <Trash2 size={14} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mb-2">
                      <Clock size={10} />
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-snug">
                      {log.messages[0]?.text || 'No text'}
                    </p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-[var(--text-tertiary)]">{log.messages.length} messages</span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Detail View */}
        <div className={`w-full md:flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl flex-col shadow-sm overflow-hidden ${selectedLog ? 'flex' : 'hidden md:flex'}`}>
          {selectedLog ? (
            <>
              <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedLog(null)} className="md:hidden p-1.5 -ml-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="font-semibold text-sm text-[var(--text-primary)]">Conversation Log</h2>
                </div>
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  {new Date(selectedLog.date).toLocaleString()}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[75vh]">
                {selectedLog.messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === "user" ? "bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-br-sm" : "bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border-subtle)]"}`}>
                      <p>{msg.text}</p>
                      {msg.translation && <p className={`text-xs mt-2 pt-2 border-t opacity-80 ${msg.sender === "user" ? "border-[var(--bg-primary)]/20" : "border-[var(--border-subtle)]"}`}>{msg.translation}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--text-secondary)]">
              <MessageSquare size={32} className="mb-3 text-[var(--text-tertiary)]" />
              <p className="text-sm font-medium">Select a conversation to view details</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
