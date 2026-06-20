export type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  translation?: string;
  aslGloss?: string;
};

export type ConversationLog = {
  id: string;
  date: string; // ISO string
  messages: Message[];
  isSaved: boolean;
};

export type UserStats = {
  streak: number;
  lastLoginDate: string | null;
  conversationCount: number;
};

const STATS_KEY = "userStats";
const HISTORY_KEY = "conversationHistory";

export const userService = {
  getStats: (): UserStats => {
    if (typeof window === "undefined") return { streak: 0, lastLoginDate: null, conversationCount: 0 };
    const data = localStorage.getItem(STATS_KEY);
    if (!data) {
      const defaultStats = { streak: 0, lastLoginDate: new Date().toISOString(), conversationCount: 0 };
      localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
      return defaultStats;
    }
    const stats: UserStats = JSON.parse(data);
    
    // Update streak logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (stats.lastLoginDate) {
      const lastLogin = new Date(stats.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today.getTime() - lastLogin.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Logged in yesterday, increment streak
        stats.streak += 1;
        stats.lastLoginDate = new Date().toISOString();
      } else if (diffDays > 1) {
        // Missed a day, reset streak
        stats.streak = 1;
        stats.lastLoginDate = new Date().toISOString();
      }
      // If diffDays === 0, same day, do nothing to streak
    } else {
      stats.streak = 1;
      stats.lastLoginDate = new Date().toISOString();
    }
    
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return stats;
  },

  incrementConversationCount: () => {
    if (typeof window === "undefined") return;
    const stats = userService.getStats();
    stats.conversationCount += 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  },

  getHistory: (): ConversationLog[] => {
    if (typeof window === "undefined") return [];
    userService.cleanupOldConversations();
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  addConversation: (messages: Message[]) => {
    if (typeof window === "undefined") return;
    if (messages.length === 0 || (messages.length === 1 && messages[0].sender === "assistant")) return; // Don't save empty/just-intro logs
    
    const log: ConversationLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      messages,
      isSaved: false
    };
    
    const history = userService.getHistory();
    history.unshift(log);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  deleteConversation: (id: string) => {
    if (typeof window === "undefined") return;
    const history = userService.getHistory().filter(log => log.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  toggleSaveConversation: (id: string) => {
    if (typeof window === "undefined") return;
    const history = userService.getHistory().map(log => {
      if (log.id === id) {
        return { ...log, isSaved: !log.isSaved };
      }
      return log;
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  cleanupOldConversations: () => {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return;
    
    let history: ConversationLog[] = JSON.parse(data);
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    
    history = history.filter(log => {
      if (log.isSaved) return true; // Keep saved logs
      const logDate = new Date(log.date);
      return logDate >= twentyDaysAgo;
    });
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};
