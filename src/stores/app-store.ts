import { create } from "zustand";

export type UserRole = "admin" | "moderator" | "professor" | "student" | "visitor";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  points: number;
  bio: string | null;
  themePref: string | null;
}

interface AppState {
  // Navigation (kept for backward compat with AIChatWidget and other components)
  activeSection: string;
  setActiveSection: (section: string) => void;

  // Auth
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // AI Chat
  aiChatOpen: boolean;
  setAiChatOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  activeSection: "dashboard",
  setActiveSection: (section) => set({ activeSection: section }),

  // Auth
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // AI Chat
  aiChatOpen: false,
  setAiChatOpen: (open) => set({ aiChatOpen: open }),
}));
