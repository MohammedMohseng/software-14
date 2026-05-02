"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  AlertTriangle,
  Palette,
  Megaphone,
  TrendingUp,
  BookHeart,
  Images,
  GraduationCap,
  Gamepad2,
  Search,
  Check,
  X,
  Pin,
  PinOff,
  Trash2,
  Eye,
  Clock,
  Activity,
  BarChart3,
  RotateCcw,
  Save,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore, type UserRole } from "@/stores/app-store";
import { SectionWrapper } from "./index";
import { ThemeManager } from "@/components/themes/theme-manager";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  points: number;
  bio: string | null;
  createdAt: string;
  activity: {
    memories: number;
    photos: number;
    discussions: number;
    gameScores: number;
    comments: number;
  };
}

interface ReportRow {
  id: string;
  reason: string;
  targetType: string;
  targetId: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string; avatar: string | null };
  reported: { id: string; name: string; avatar: string | null };
}

interface NewsRow {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string };
}

// ── Role Helpers ────────────────────────────────────────────────────────
const roleColors: Record<string, string> = {
  admin: "bg-emerald-500 text-white",
  moderator: "bg-teal-500 text-white",
  professor: "bg-amber-500 text-white",
  student: "bg-secondary text-secondary-foreground",
  visitor: "bg-muted text-muted-foreground",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  moderator: "Moderator",
  professor: "Professor",
  student: "Student",
  visitor: "Visitor",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge className={`text-[10px] px-2 py-0 ${roleColors[role] || roleColors.visitor}`}>
      {roleLabels[role] || role}
    </Badge>
  );
}

function isAtLeast(role: UserRole, required: UserRole): boolean {
  const hierarchy: UserRole[] = ["visitor", "student", "professor", "moderator", "admin"];
  return hierarchy.indexOf(role) >= hierarchy.indexOf(required);
}

// ── Admin Section ───────────────────────────────────────────────────────
export function AdminSection() {
  const { currentUser, setCurrentUser } = useAppStore();
  const isAdmin = currentUser?.role === "admin";
  const isMod = currentUser?.role === "moderator";
  const hasAccess = isAdmin || isMod;

  // ── State ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [themeDefaults, setThemeDefaults] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ users: 0, memories: 0, resources: 0, gamesPlayed: 0, reports: 0, discussions: 0 });

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const [searchUsers, setSearchUsers] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("all");

  // Role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogUser, setRoleDialogUser] = useState<UserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [changingRole, setChangingRole] = useState(false);

  // Report action dialog
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportAction, setReportAction] = useState<"resolved" | "dismissed">("resolved");
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [handlingReport, setHandlingReport] = useState(false);

  // Delete content dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Announcement dialog
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementCategory, setAnnouncementCategory] = useState("announcement");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // View report dialog
  const [viewReportDialogOpen, setViewReportDialogOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ReportRow | null>(null);

  // ── Data Fetching ───────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [usersRes, memoriesRes, resourcesRes, scoresRes, reportsRes, discussionsRes] = await Promise.all([
        fetch("/api/users?requesterId=" + currentUser?.id).catch(() => null),
        fetch("/api/memories").catch(() => null),
        fetch("/api/academic").catch(() => null),
        fetch("/api/games/score?limit=999").catch(() => null),
        fetch("/api/reports?requesterId=" + currentUser?.id).catch(() => null),
        fetch("/api/discussions").catch(() => null),
      ]);

      const usersData = usersRes ? await usersRes.json() : { total: 0 };
      const memoriesData = memoriesRes ? await memoriesRes.json() : { memories: [] };
      const resourcesData = resourcesRes ? await resourcesRes.json() : { resources: [] };
      const scoresData = scoresRes ? await scoresRes.json() : { scores: [] };
      const reportsData = reportsRes ? await reportsRes.json() : { total: 0 };
      const discussionsData = discussionsRes ? await discussionsRes.json() : { discussions: [] };

      setStats({
        users: usersData.total || 0,
        memories: memoriesData.memories?.length || 0,
        resources: resourcesData.resources?.length || 0,
        gamesPlayed: scoresData.scores?.length || 0,
        reports: reportsData.pending || 0,
        discussions: discussionsData.discussions?.length || 0,
      });
    } catch {
      // silently fail
    } finally {
      setLoadingStats(false);
    }
  }, [currentUser?.id]);

  const fetchUsers = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/users?requesterId=${currentUser.id}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser?.id]);

  const fetchReports = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoadingReports(true);
    try {
      const statusParam = reportFilter !== "all" ? `&status=${reportFilter}` : "";
      const res = await fetch(`/api/reports?requesterId=${currentUser.id}${statusParam}`);
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  }, [currentUser?.id, reportFilter]);

  const fetchTheme = useCallback(async () => {
    setLoadingTheme(true);
    try {
      const res = await fetch("/api/theme");
      const data = await res.json();
      setTheme(data.theme || {});
      setThemeDefaults(data.defaults || {});
    } catch {
      toast.error("Failed to load theme");
    } finally {
      setLoadingTheme(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (data.news) setNews(data.news);
    } catch {
      toast.error("Failed to load news");
    } finally {
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchStats();
      fetchUsers();
      fetchReports();
      fetchTheme();
      fetchNews();
    }
  }, [hasAccess, fetchStats, fetchUsers, fetchReports, fetchTheme, fetchNews]);

  useEffect(() => {
    if (hasAccess) fetchReports();
  }, [reportFilter, hasAccess, fetchReports]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleChangeRole = async () => {
    if (!roleDialogUser || !selectedRole || !currentUser?.id) return;
    setChangingRole(true);
    try {
      const res = await fetch(`/api/users/${roleDialogUser.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, requesterId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${roleDialogUser.name}'s role changed to ${roleLabels[selectedRole]}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === roleDialogUser.id ? { ...u, role: selectedRole } : u))
      );
      setRoleDialogOpen(false);
      // If the user changed their own role, update store
      if (roleDialogUser.id === currentUser.id) {
        setCurrentUser({ ...currentUser, role: selectedRole as UserRole });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setChangingRole(false);
    }
  };

  const handleReportAction = async () => {
    if (!selectedReport || !currentUser?.id) return;
    setHandlingReport(true);
    try {
      const res = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reportAction, requesterId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Report ${reportAction}`);
      setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
      setReportDialogOpen(false);
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update report");
    } finally {
      setHandlingReport(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!deleteTarget || !currentUser?.id) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "memory") {
        const res = await fetch(`/api/memories`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: deleteTarget.id, userId: currentUser.id }),
        });
        if (!res.ok) {
          // Use report mechanism as fallback
          await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              targetType: "memory",
              targetId: deleteTarget.id,
              reason: "Admin deletion",
            }),
          });
        }
      }
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteDialogOpen(false);
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleThemeChange = async (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    if (!currentUser?.id) return;
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, requesterId: currentUser.id }),
      });
      if (!res.ok) throw new Error("Failed to save theme");
      toast.success(`Theme updated: ${key}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save theme");
    }
  };

  const handleResetTheme = async () => {
    if (!currentUser?.id) return;
    try {
      for (const [key, value] of Object.entries(themeDefaults)) {
        await fetch("/api/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value, requesterId: currentUser.id }),
        });
      }
      setTheme({ ...themeDefaults });
      toast.success("Theme reset to defaults");
    } catch (err) {
      toast.error("Failed to reset theme");
    }
  };

  const handlePostAnnouncement = async () => {
    if (!currentUser?.id || !announcementTitle.trim() || !announcementContent.trim()) return;
    setPostingAnnouncement(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          title: announcementTitle,
          content: announcementContent,
          category: announcementCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Announcement posted!");
      setAnnouncementDialogOpen(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementCategory("announcement");
      fetchNews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post announcement");
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleTogglePin = async (item: NewsRow) => {
    try {
      // Update via a simplified approach - recreate with toggled pin
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser?.id,
          title: item.title,
          content: item.content,
          category: item.category,
          pinned: !item.pinned,
        }),
      });
      if (res.ok) {
        toast.success(item.pinned ? "Unpinned" : "Pinned");
        fetchNews();
      }
    } catch {
      toast.error("Failed to toggle pin");
    }
  };

  // ── Filtered Data ───────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const userCountByRole = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // ── Access Denied ───────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <SectionWrapper title="Admin Panel" icon={Shield}>
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Shield className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              You need admin or moderator privileges to access this panel.
              Contact your platform administrator if you believe this is an error.
            </p>
            <Badge className="mt-4">Your role: {roleLabels[currentUser?.role || "visitor"]}</Badge>
          </CardContent>
        </Card>
      </SectionWrapper>
    );
  }

  // ── Color picker helper ────────────────────────────────────────────
  const themeColorKeys = [
    { key: "primary-color", label: "Primary", description: "Main brand color" },
    { key: "accent-color", label: "Accent", description: "Secondary accent" },
    { key: "background-color", label: "Background", description: "Page background" },
    { key: "card-color", label: "Card", description: "Card background" },
    { key: "sidebar-color", label: "Sidebar", description: "Sidebar background" },
    { key: "border-color", label: "Border", description: "Default border" },
  ];

  return (
    <SectionWrapper title="Admin Panel" icon={Shield}>
      {/* Admin Banner */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/15">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Admin Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Full access to platform management" : "Content management access"}
              </p>
            </div>
            <Badge className={roleColors[currentUser?.role || "student"]}>
              {roleLabels[currentUser?.role || "student"]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            Content
          </TabsTrigger>
          {(isAdmin || isMod) && (
            <TabsTrigger value="theme" className="gap-1.5 text-xs sm:text-sm">
              <Palette className="h-3.5 w-3.5" />
              المظهر
            </TabsTrigger>
          )}
          <TabsTrigger value="announcements" className="gap-1.5 text-xs sm:text-sm">
            <Megaphone className="h-3.5 w-3.5" />
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ─────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Users", value: stats.users, icon: Users, color: "text-emerald-500" },
                { label: "Memories", value: stats.memories, icon: BookHeart, color: "text-rose-500" },
                { label: "Resources", value: stats.resources, icon: GraduationCap, color: "text-amber-500" },
                { label: "Games", value: stats.gamesPlayed, icon: Gamepad2, color: "text-cyan-500" },
                { label: "Reports", value: stats.reports, icon: AlertTriangle, color: "text-red-500" },
                { label: "Discussions", value: stats.discussions, icon: Images, color: "text-violet-500" },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/50">
                  <CardContent className="p-4 text-center">
                    <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-1`} />
                    {loadingStats ? (
                      <Skeleton className="h-6 w-8 mx-auto" />
                    ) : (
                      <p className="text-xl font-bold">{stat.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Role Distribution & Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Role Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(userCountByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={role} />
                        <span className="text-sm">{roleLabels[role]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${role === "admin" ? "bg-emerald-500" : role === "moderator" ? "bg-teal-500" : role === "professor" ? "bg-amber-500" : "bg-gray-400"}`}
                            style={{ width: `${Math.max(5, (count / users.length) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => {
                      const tabEl = document.querySelector('[data-value="users"]') as HTMLElement;
                      tabEl?.click();
                    }}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Manage Roles
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => {
                      const tabEl = document.querySelector('[data-value="content"]') as HTMLElement;
                      tabEl?.click();
                    }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Review Reports
                    {stats.reports > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 text-[10px] bg-red-500 text-white">
                        {stats.reports}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => setAnnouncementDialogOpen(true)}
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    Post News
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2"
                      onClick={() => {
                        const tabEl = document.querySelector('[data-value="theme"]') as HTMLElement;
                        tabEl?.click();
                      }}
                    >
                      <Palette className="h-3.5 w-3.5" />
                      Site Theme
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Platform Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Active Users</p>
                    {users
                      .sort((a, b) => {
                        const totalA = a.activity.memories + a.activity.discussions + a.activity.comments;
                        const totalB = b.activity.memories + b.activity.discussions + b.activity.comments;
                        return totalB - totalA;
                      })
                      .slice(0, 5)
                      .map((u) => (
                        <div key={u.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-semibold">
                              {u.name.charAt(0)}
                            </div>
                            <span className="text-sm">{u.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {u.activity.memories + u.activity.discussions + u.activity.comments} posts
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Reports</p>
                    {reports.filter((r) => r.status === "pending").slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-sm truncate max-w-[150px]">{r.reason}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{r.targetType}</Badge>
                      </div>
                    ))}
                    {reports.filter((r) => r.status === "pending").length === 0 && (
                      <p className="text-sm text-muted-foreground">No pending reports ✨</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── User Management Tab ──────────────────────────────────── */}
        <TabsContent value="users">
          <div className="space-y-4">
            {/* Search & Filter */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Filter role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(userCountByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center gap-1.5">
                      <RoleBadge role={role} />
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-border/50">
              <CardContent className="p-0">
                {loadingUsers ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead className="hidden sm:table-cell">Activity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate max-w-[150px]">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <RoleBadge role={user.role} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-primary" />
                                  <span className="text-sm font-medium">{user.points.toLocaleString()}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{user.activity.memories} 📝</span>
                                  <span>{user.activity.discussions} 💬</span>
                                  <span>{user.activity.gameScores} 🎮</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {isAdmin && user.id !== currentUser?.id && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => {
                                      setRoleDialogUser(user);
                                      setSelectedRole(user.role);
                                      setRoleDialogOpen(true);
                                    }}
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                    Change Role
                                  </Button>
                                )}
                                {isAdmin && user.id === currentUser?.id && (
                                  <Badge variant="secondary" className="text-[10px]">You</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Content Management Tab ───────────────────────────────── */}
        <TabsContent value="content">
          <div className="space-y-4">
            {/* Report Filter */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Reported Content</span>
                  </div>
                  <Select value={reportFilter} onValueChange={setReportFilter}>
                    <SelectTrigger className="w-[160px]" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            {loadingReports ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Check className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-medium mb-1">All Clear!</h4>
                  <p className="text-sm text-muted-foreground">No reports matching your filter</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {reports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className={`border-border/50 ${
                        report.status === "pending" ? "border-amber-500/30 bg-amber-500/5" :
                        report.status === "resolved" ? "border-emerald-500/30 bg-emerald-500/5" :
                        "border-border/50"
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`text-[10px] ${
                                  report.status === "pending" ? "bg-amber-500 text-white" :
                                  report.status === "resolved" ? "bg-emerald-500 text-white" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {report.status}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px]">{report.targetType}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground mb-2">{report.reason}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>By: {report.reporter.name}</span>
                                <span>Reported: {report.reported.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                  setViewingReport(report);
                                  setViewReportDialogOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              {report.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setReportAction("resolved");
                                      setReportDialogOpen(true);
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                    Resolve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setReportAction("dismissed");
                                      setReportDialogOpen(true);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                    Dismiss
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Theme Customization Tab ──────────────────────────────── */}
        {(isAdmin || isMod) && (
          <TabsContent value="theme">
            <ThemeManager />
          </TabsContent>
        )}

        {/* ── Announcements Tab ────────────────────────────────────── */}
        <TabsContent value="announcements">
          <div className="space-y-4">
            {/* Create Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Manage Announcements & News</span>
              </div>
              {isAtLeast(currentUser?.role as UserRole, "moderator") && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setAnnouncementDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Post
                </Button>
              )}
            </div>

            {/* News List */}
            {loadingNews ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : news.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h4 className="font-medium mb-1">No Announcements</h4>
                  <p className="text-sm text-muted-foreground">Create your first announcement</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {news.map((item) => (
                  <Card
                    key={item.id}
                    className={`border-border/50 hover:shadow-md transition-shadow ${
                      item.pinned ? "border-primary/30 bg-primary/5" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.pinned && <Pin className="h-3.5 w-3.5 text-primary fill-primary" />}
                            <h4 className="text-sm font-medium truncate">{item.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-[10px] ${
                                item.category === "exam"
                                  ? "bg-red-500 text-white"
                                  : item.category === "event"
                                  ? "bg-violet-500 text-white"
                                  : item.category === "announcement"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              {item.category}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              by {item.author.name} · {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleTogglePin(item)}
                          >
                            {item.pinned ? (
                              <PinOff className="h-3.5 w-3.5" />
                            ) : (
                              <Pin className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {roleDialogUser?.name}. This will affect their permissions across the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold">
                {roleDialogUser?.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{roleDialogUser?.name}</p>
                <p className="text-xs text-muted-foreground">{roleDialogUser?.email}</p>
              </div>
              <RoleBadge role={roleDialogUser?.role || "student"} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-emerald-500 text-white text-[10px]">Admin</Badge>
                      Full platform access
                    </span>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-teal-500 text-white text-[10px]">Mod</Badge>
                      Content management
                    </span>
                  </SelectItem>
                  <SelectItem value="professor">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-amber-500 text-white text-[10px]">Prof</Badge>
                      Academic resources
                    </span>
                  </SelectItem>
                  <SelectItem value="student">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-secondary text-[10px]">Student</Badge>
                      Standard access
                    </span>
                  </SelectItem>
                  <SelectItem value="visitor">
                    <span className="flex items-center gap-2">
                      <Badge className="bg-muted text-[10px]">Visitor</Badge>
                      Read-only access
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={changingRole || selectedRole === roleDialogUser?.role}
              className="gap-1.5"
            >
              {changingRole ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Action Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reportAction === "resolved" ? "Resolve Report" : "Dismiss Report"}</DialogTitle>
            <DialogDescription>
              {reportAction === "resolved"
                ? "This will resolve the report and remove the reported content. This action cannot be undone."
                : "This will dismiss the report. The reported content will remain unchanged."}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-sm font-medium">{selectedReport.reason}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Type: {selectedReport.targetType}</span>
                  <span>By: {selectedReport.reporter.name}</span>
                </div>
              </div>
              {reportAction === "resolved" && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    The reported content will be deleted
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReportAction}
              disabled={handlingReport}
              className={reportAction === "resolved" ? "bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" : "gap-1.5"}
            >
              {handlingReport ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : reportAction === "resolved" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              {reportAction === "resolved" ? "Resolve & Delete" : "Dismiss"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={viewReportDialogOpen} onOpenChange={setViewReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>Full details of this report</DialogDescription>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`text-[10px] ${
                    viewingReport.status === "pending" ? "bg-amber-500 text-white" :
                    viewingReport.status === "resolved" ? "bg-emerald-500 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {viewingReport.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Target Type</p>
                  <Badge variant="secondary" className="text-[10px]">{viewingReport.targetType}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Reporter</p>
                  <p className="text-sm font-medium">{viewingReport.reporter.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Reported User</p>
                  <p className="text-sm font-medium">{viewingReport.reported.name}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="text-sm p-3 bg-muted/50 rounded-lg">{viewingReport.reason}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Reported On</p>
                <p className="text-sm">{new Date(viewingReport.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewReportDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Content Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The content will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                Are you sure you want to delete &quot;{deleteTarget.name}&quot;?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContent}
              disabled={deleting}
              className="gap-1.5"
            >
              {deleting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Post a new announcement or news item for the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Enter announcement title..."
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your announcement content..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={announcementCategory} onValueChange={setAnnouncementCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">📢 Announcement</SelectItem>
                  <SelectItem value="exam">📝 Exam</SelectItem>
                  <SelectItem value="event">🎉 Event</SelectItem>
                  <SelectItem value="general">💬 General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePostAnnouncement}
              disabled={postingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
              className="gap-1.5"
            >
              {postingAnnouncement ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Megaphone className="h-3.5 w-3.5" />
              )}
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionWrapper>
  );
}
