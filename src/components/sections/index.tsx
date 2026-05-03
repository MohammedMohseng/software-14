
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookHeart,
  Images,
  GraduationCap,
  Newspaper,
  Gamepad2,
  Bot,
  Heart,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Trophy,
  Flag,
  Plus,
  MessageSquare,
  Pin,
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
  FileText,
  Video,
  Link2,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore, type UserRole } from "@/stores/app-store";
import { toast } from "sonner";
import TicTacToeGame from "@/components/games/tic-tac-toe";
import MemoryMatchGame from "@/components/games/memory-match";
import ChessGameComponent from "@/components/games/chess-game";
import AIQuizGame from "@/components/games/ai-quiz";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface SectionWrapperProps {
  children: React.ReactNode;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function SectionWrapper({ children, title, icon: Icon }: SectionWrapperProps) {
  return (
    <motion.div
      initial={fadeIn.initial}
      animate={fadeIn.animate}
      exit={fadeIn.exit}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/15">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">مجتمع دفعة Software-14</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Helper: check if user can create content ──────────────────────
function canPost(userRole: UserRole | undefined, minRole: UserRole = "student"): boolean {
  if (!userRole) return false;
  const hierarchy: UserRole[] = ["visitor", "student", "professor", "moderator", "admin"];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(minRole);
}

// ─── Helper: relative time ──────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}س`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}ي`;
  return date.toLocaleDateString("ar-EG");
}

// ─── Helper: User Avatar ────────────────────────────────────────────
function UserAvatar({ name, avatar, size = "sm" }: { name: string; avatar?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-background`}
      />
    );
  }
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold ring-2 ring-background`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HOME SECTION — Enhanced with Honor Roll
// ═══════════════════════════════════════════════════════════════════════
export function HomeSection() {
  const { currentUser, setActiveSection } = useAppStore();
  const [honorData, setHonorData] = useState<{
    academic: Array<{ id: string; name: string; avatar: string | null; points: number; activity?: number }>;
    gaming: Array<{ id: string; name: string; avatar: string | null; points: number; topScore?: number; totalScore?: number }>;
    voting: Array<{ id: string; name: string; avatar: string | null; points: number; votesReceived?: number }>;
  } | null>(null);
  const [honorLoading, setHonorLoading] = useState(true);

  useEffect(() => {
    async function fetchHonor() {
      try {
        const res = await fetch("/api/honor");
        if (res.ok) {
          const data = await res.json();
          setHonorData(data);
        }
      } catch {
        // silently fail
      } finally {
        setHonorLoading(false);
      }
    }
    fetchHonor();
  }, []);

  const quickActions = [
    { label: "الذكريات", icon: BookHeart, section: "memories" as const, color: "from-rose-500/20 to-pink-500/20", iconColor: "text-rose-500" },
    { label: "المعرض", icon: Images, section: "gallery" as const, color: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-500" },
    { label: "أكاديمي", icon: GraduationCap, section: "academic" as const, color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-500" },
    { label: "ألعاب", icon: Gamepad2, section: "games" as const, color: "from-cyan-500/20 to-teal-500/20", iconColor: "text-cyan-500" },
  ];

  const honorCategories = [
    { key: "academic" as const, label: "أكاديمي", icon: GraduationCap, color: "from-amber-500/10 to-orange-500/10", accent: "text-amber-500", metric: (u: { activity?: number; points: number }) => u.activity ?? u.points, metricLabel: "نشاطات" },
    { key: "gaming" as const, label: "ألعاب", icon: Gamepad2, color: "from-cyan-500/10 to-teal-500/10", accent: "text-cyan-500", metric: (u: { topScore?: number; totalScore?: number; points: number }) => u.totalScore ?? u.topScore ?? u.points, metricLabel: "نقطة" },
    { key: "voting" as const, label: "تصويت", icon: Star, color: "from-violet-500/10 to-purple-500/10", accent: "text-violet-500", metric: (u: { votesReceived?: number; points: number }) => u.votesReceived ?? u.points, metricLabel: "تصويت" },
  ];

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd

  return (
    <SectionWrapper title="الرئيسية" icon={LayoutDashboard}>
      {/* Welcome Banner */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-teal-500/10 to-emerald-500/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-1">
                مرحباً بعودتك، {currentUser?.name || "زائر"}! 👋
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ابقَ على تواصل مع دفعتك. شارك الذكريات، واطّلع على المصادر، واستمتع!
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setActiveSection("memories")} className="gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  شارك ذِكرى
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveSection("ai")} className="gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  تحدث مع الذكاء الاصطناعي
                </Button>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center h-24 w-24 rounded-2xl bg-primary/10">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Card
            key={action.section}
            className={`cursor-pointer border-0 bg-gradient-to-br ${action.color} hover:scale-[1.02] transition-transform duration-200`}
            onClick={() => setActiveSection(action.section)}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <action.icon className={`h-8 w-8 ${action.iconColor}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Honor Roll */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            قائمة الشرف الأسبوعية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {honorLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : honorData ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {honorCategories.map((cat) => {
                const entries = honorData[cat.key] || [];
                return (
                  <div key={cat.key} className={`rounded-xl bg-gradient-to-br ${cat.color} p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <cat.icon className={`h-4 w-4 ${cat.accent}`} />
                      <span className="text-sm font-semibold">{cat.label}</span>
                    </div>
                    {entries.length > 0 ? (
                      <div className="flex items-end justify-center gap-2 min-h-[80px]">
                        {podiumOrder.map((idx) => {
                          const entry = entries[idx];
                          if (!entry) return <div key={idx} className="flex-1" />;
                          const isTop = idx === 0;
                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`flex flex-col items-center gap-1 flex-1 ${isTop ? "-mt-2" : "mt-2"}`}
                            >
                              <UserAvatar name={entry.name} avatar={entry.avatar} size={isTop ? "md" : "sm"} />
                              <p className={`font-semibold truncate w-full text-center ${isTop ? "text-sm" : "text-xs"}`}>
                                {entry.name}
                              </p>
                              <Badge variant={isTop ? "default" : "secondary"} className="text-[10px]">
                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {cat.metric(entry)} {cat.metricLabel}
                              </Badge>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد إدخالات هذا الأسبوع</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">تعذر تحميل قائمة الشرف</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "زملاء الدفعة", value: "32", icon: Users, color: "text-emerald-500" },
          { label: "الذكريات", value: "128", icon: Heart, color: "text-rose-500" },
          { label: "المصادر", value: "45", icon: Star, color: "text-amber-500" },
          { label: "نقاطك", value: currentUser?.points.toLocaleString() || "0", icon: TrendingUp, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              النشاط الأخير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: "ذكرى جديدة من عمر", time: "2د" },
              { text: "د. أحمد رفع مصادر جديدة", time: "1س" },
              { text: "تم نشر إعلان الهاكاثون", time: "3س" },
              { text: "ليلى حققت أعلى نتيجة في الاختبار", time: "5س" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate">{item.text}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              الأحداث القادمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: "هاكاثون CodeFest 2025", badge: "فعالية" },
              { text: "بدء امتحانات منتصف الفصل", badge: "امتحان" },
              { text: "جلسة تعريفية عن أبحاث تعلم الآلة", badge: "أكاديمي" },
              { text: "لقاء لم شمل الدفعة", badge: "اجتماعي" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate">{item.text}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{item.badge}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MEMORIES SECTION — Full Blog System
// ═══════════════════════════════════════════════════════════════════════
interface MemoryItem {
  id: string;
  userId: string;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null; role: string };
}

export function MemoriesSection() {
  const { currentUser } = useAppStore();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formText, setFormText] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<MemoryItem | null>(null);
  const [reportReason, setReportReason] = useState("");

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const wordCount = formText.trim().split(/\s+/).filter(Boolean).length;
  const wordLimit = 1000;

  const handleSubmit = async () => {
    if (!currentUser || !formText.trim() || wordCount > wordLimit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          text: formText.trim(),
          imageUrl: formImageUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("تم مشاركة الذكرى!");
        setFormText("");
        setFormImageUrl("");
        setShowForm(false);
        fetchMemories();
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل مشاركة الذكرى");
      }
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!currentUser || !reportTarget || !reportReason.trim()) return;
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          targetType: "memory",
          targetId: reportTarget.id,
          reason: reportReason.trim(),
        }),
      });
      if (res.ok) {
        toast.success("تم إرسال البلاغ. سيقوم المشرفون بمراجعته.");
        setReportDialogOpen(false);
        setReportTarget(null);
        setReportReason("");
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل إرسال البلاغ");
      }
    } catch {
      toast.error("حدث خطأ ما");
    }
  };

  return (
    <SectionWrapper title="الذكريات" icon={BookHeart}>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {memories.length} {memories.length === 1 ? "ذكرى" : "ذكريات"} مشتركة
        </p>
        {canPost(currentUser?.role, "student") && (
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? "إلغاء" : "إنشاء ذكرى"}
          </Button>
        )}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserAvatar name={currentUser?.name || ""} avatar={currentUser?.avatar} />
                  <span className="text-sm font-medium">{currentUser?.name}</span>
                </div>
                <Textarea
                  placeholder="شارك ذكرى مع دفعتك..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={4}
                  className="resize-none bg-background"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${wordCount > wordLimit ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                    {wordCount}/{wordLimit} كلمة
                  </span>
                </div>
                <Input
                  placeholder="رابط الصورة (اختياري)"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="bg-background"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setFormText(""); setFormImageUrl(""); }}>
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting || !formText.trim() || wordCount > wordLimit}
                    className="gap-1.5"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    مشاركة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memories Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : memories.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-rose-500/10 flex items-center justify-center">
                <BookHeart className="h-12 w-12 text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد ذكريات بعد</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                رحلة كليتك مليئة بلحظات تستحق التذكر. كن أول من يشارك ذكرى مع زملاء دفعتك!
              </p>
              {canPost(currentUser?.role, "student") && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Heart className="h-4 w-4" />
                  أنشئ أول ذكرى
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
          {memories.map((memory, i) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar name={memory.user.name} avatar={memory.user.avatar} />
                      <div>
                        <p className="text-sm font-medium">{memory.user.name}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(memory.createdAt)}</p>
                      </div>
                    </div>
                    {currentUser && currentUser.id !== memory.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => { setReportTarget(memory); setReportDialogOpen(true); }}
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{memory.text}</p>
                  {memory.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-border/50 mt-2">
                      <img
                        src={memory.imageUrl}
                        alt="ذكرى"
                        className="w-full max-h-80 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-500" />
              الإبلاغ عن ذكرى
            </DialogTitle>
            <DialogDescription>
              لماذا تبلغ عن هذه الذكرى؟ سيقوم المشرفون بمراجعتها.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="صِف المشكلة..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleReport} disabled={!reportReason.trim()} variant="destructive" className="gap-1.5">
              <Flag className="h-3.5 w-3.5" />
              إرسال البلاغ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// GALLERY SECTION — Album-based Media
// ═══════════════════════════════════════════════════════════════════════
interface AlbumItem {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  _count: { photos: number };
  user: { id: string; name: string; avatar: string | null };
}

interface PhotoItem {
  id: string;
  albumId: string;
  userId: string;
  url: string;
  caption: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

const photoGradients = [
  "from-rose-200/50 to-pink-200/50",
  "from-teal-200/50 to-cyan-200/50",
  "from-amber-200/50 to-orange-200/50",
  "from-violet-200/50 to-purple-200/50",
  "from-emerald-200/50 to-green-200/50",
  "from-fuchsia-200/50 to-pink-200/50",
  "from-lime-200/50 to-yellow-200/50",
  "from-cyan-200/50 to-sky-200/50",
];

export function GallerySection() {
  const { currentUser } = useAppStore();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createAlbumDialogOpen, setCreateAlbumDialogOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums || []);
        if (!selectedAlbum && data.albums?.length > 0) {
          setSelectedAlbum(data.albums[0].id);
        }
      }
    } catch {
      // silently fail
    } finally {
      setAlbumsLoading(false);
    }
  }, [selectedAlbum]);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  useEffect(() => {
    if (!selectedAlbum) return;
    async function fetchPhotos() {
      setPhotosLoading(true);
      try {
        const res = await fetch(`/api/albums/${selectedAlbum}/photos`);
        if (res.ok) {
          const data = await res.json();
          setPhotos(data.photos || []);
        }
      } catch {
        // silently fail
      } finally {
        setPhotosLoading(false);
      }
    }
    fetchPhotos();
  }, [selectedAlbum]);

  const handleCreateAlbum = async () => {
    if (!currentUser || !albumTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: albumTitle.trim(), userId: currentUser.id }),
      });
      if (res.ok) {
        toast.success("تم إنشاء الألبوم!");
        setAlbumTitle("");
        setCreateAlbumDialogOpen(false);
        fetchAlbums();
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل إنشاء الألبوم");
      }
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!currentUser || !selectedAlbum || !uploadUrl.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/albums/${selectedAlbum}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          url: uploadUrl.trim(),
          caption: uploadCaption.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("تمت إضافة الصورة!");
        setUploadUrl("");
        setUploadCaption("");
        setUploadDialogOpen(false);
        // Refresh photos
        const photoRes = await fetch(`/api/albums/${selectedAlbum}/photos`);
        if (photoRes.ok) {
          const data = await photoRes.json();
          setPhotos(data.photos || []);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل رفع الصورة");
      }
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  const isModeratorPlus = currentUser && canPost(currentUser.role, "moderator");

  return (
    <SectionWrapper title="المعرض" icon={Images}>
      {/* Header with album tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {albumsLoading ? (
            <>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-20" />
            </>
          ) : albums.length > 0 ? (
            albums.map((album) => (
              <Badge
                key={album.id}
                variant={selectedAlbum === album.id ? "default" : "secondary"}
                className="cursor-pointer transition-colors"
                onClick={() => setSelectedAlbum(album.id)}
              >
                {album.title}
                <span className="ml-1 text-[10px] opacity-70">({album._count.photos})</span>
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد ألبومات بعد</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canPost(currentUser?.role, "student") && selectedAlbum && (
            <Button size="sm" variant="outline" onClick={() => setUploadDialogOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              رفع
            </Button>
          )}
          {isModeratorPlus && (
            <Button size="sm" onClick={() => setCreateAlbumDialogOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              ألبوم جديد
            </Button>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      {photosLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : !selectedAlbum ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Images className="h-10 w-10 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">اختر ألبوماً</h3>
            <p className="text-sm text-muted-foreground">اختر ألبوماً لتصفح الصور</p>
          </CardContent>
        </Card>
      ) : photos.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">ألبوم فارغ</h3>
            <p className="text-sm text-muted-foreground mb-4">لا توجد صور في هذا الألبوم بعد. كن أول من يضيف صورة!</p>
            {canPost(currentUser?.role, "student") && (
              <Button size="sm" onClick={() => setUploadDialogOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                أضف صورة
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="overflow-hidden border-border/50 aspect-square cursor-pointer hover:shadow-lg transition-shadow group relative">
                <img
                  src={photo.url}
                  alt={photo.caption || "صورة"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    const parent = el.parentElement;
                    if (parent) {
                      parent.classList.add("bg-gradient-to-br", photoGradients[i % photoGradients.length]);
                      parent.innerHTML += `<div class="h-full w-full flex items-center justify-center"><svg class="h-10 w-10 text-muted-foreground/30 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
                    }
                  }}
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium truncate">{photo.caption}</p>
                    <p className="text-[10px] text-white/70">{photo.user.name}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Photo Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              رفع صورة
            </DialogTitle>
            <DialogDescription>أضف صورة إلى هذا الألبوم</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">رابط الصورة *</label>
              <Input
                placeholder="https://example.com/photo.jpg"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">تعليق</label>
              <Input
                placeholder="صف هذه الصورة..."
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleUploadPhoto} disabled={submitting || !uploadUrl.trim()} className="gap-1.5">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              رفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Album Dialog */}
      <Dialog open={createAlbumDialogOpen} onOpenChange={setCreateAlbumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="h-4 w-4 text-primary" />
              إنشاء ألبوم
            </DialogTitle>
            <DialogDescription>إنشاء ألبوم صور جديد للدفعة</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1 block">عنوان الألبوم *</label>
            <Input
              placeholder="مثال: السنة الأولى"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateAlbumDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleCreateAlbum} disabled={submitting || !albumTitle.trim()} className="gap-1.5">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ACADEMIC SECTION — Resources + Discussions
// ═══════════════════════════════════════════════════════════════════════
interface ResourceItem {
  id: string;
  profId: string;
  title: string;
  fileUrl: string | null;
  link: string | null;
  type: string;
  createdAt: string;
  professor: { id: string; name: string; avatar: string | null; role: string };
}

interface DiscussionItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null; role: string };
  _count: { comments: number };
}

interface CommentItem {
  id: string;
  discussionId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null; role: string };
  replies?: CommentItem[];
}

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pdf: { icon: FileText, color: "bg-red-500/15 text-red-600 dark:text-red-400", label: "PDF" },
  video: { icon: Video, color: "bg-violet-500/15 text-violet-600 dark:text-violet-400", label: "فيديو" },
  link: { icon: Link2, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", label: "رابط" },
};

function CommentThread({ comment, onReply, currentUser, depth = 0 }: { comment: CommentItem; onReply: (parentId: string) => void; currentUser: { id: string; name: string; avatar: string | null; role: string } | null; depth?: number }) {
  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-primary/20 pl-3" : ""} space-y-2`}>
      <div className="flex items-start gap-2">
        <UserAvatar name={comment.user.name} avatar={comment.user.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.user.name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
          {currentUser && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-primary mt-1"
              onClick={() => onReply(comment.id)}
            >
              رد
            </Button>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} onReply={onReply} currentUser={currentUser} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AcademicSection() {
  const { currentUser } = useAppStore();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [expandedDiscussion, setExpandedDiscussion] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [createDiscussionOpen, setCreateDiscussionOpen] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch("/api/academic");
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingResources(false);
    }
  }, []);

  const fetchDiscussions = useCallback(async () => {
    try {
      const res = await fetch("/api/discussions");
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data.discussions || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDiscussions(false);
    }
  }, []);

  useEffect(() => { fetchResources(); fetchDiscussions(); }, [fetchResources, fetchDiscussions]);

  const handleExpandDiscussion = async (id: string) => {
    if (expandedDiscussion === id) {
      setExpandedDiscussion(null);
      setComments([]);
      setReplyTo(null);
      return;
    }
    setExpandedDiscussion(id);
    setReplyTo(null);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/discussions/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingComments(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
    setReplyContent("");
  };

  const handleSubmitReply = async () => {
    if (!currentUser || !expandedDiscussion || !replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/discussions/${expandedDiscussion}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: replyContent.trim(),
          parentId: replyTo || undefined,
        }),
      });
      if (res.ok) {
        toast.success("تم نشر الرد!");
        setReplyContent("");
        setReplyTo(null);
        // Refresh comments
        const commentRes = await fetch(`/api/discussions/${expandedDiscussion}/comments`);
        if (commentRes.ok) {
          const data = await commentRes.json();
          setComments(data.comments || []);
        }
        fetchDiscussions();
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل نشر الرد");
      }
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDiscussion = async () => {
    if (!currentUser || !newDiscussionTitle.trim() || !newDiscussionContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newDiscussionTitle.trim(),
          content: newDiscussionContent.trim(),
        }),
      });
      if (res.ok) {
        toast.success("تم إنشاء المناقشة!");
        setNewDiscussionTitle("");
        setNewDiscussionContent("");
        setCreateDiscussionOpen(false);
        fetchDiscussions();
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل إنشاء المناقشة");
      }
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionWrapper title="أكاديمي" icon={GraduationCap}>
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            المصادر
          </TabsTrigger>
          <TabsTrigger value="discussions" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            المناقشات
          </TabsTrigger>
        </TabsList>

        {/* ── Resources Tab ── */}
        <TabsContent value="resources">
          <Card className="border-border/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5 mb-4">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-500/15">
                  <GraduationCap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">المصادر الأكاديمية</h3>
                  <p className="text-sm text-muted-foreground">اطّلع على محاضرات، أبحاث، ومواد دراسية يشاركها الأساتذة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingResources ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <GraduationCap className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">لا توجد مصادر بعد</h3>
                <p className="text-sm text-muted-foreground">لم يقم الأساتذة برفع أي مصادر بعد.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {resources.map((res, i) => {
                const tConfig = typeConfig[res.type] || typeConfig.link;
                const TIcon = tConfig.icon;
                return (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="border-border/50 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => {
                        const url = res.link || res.fileUrl;
                        if (url) window.open(url, "_blank");
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${tConfig.color}`}>
                          <TIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{res.title}</p>
                          <p className="text-xs text-muted-foreground">بواسطة {res.professor.name} &middot; {timeAgo(res.createdAt)}</p>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${tConfig.color}`}>
                          {tConfig.label}
                        </Badge>
                        {(res.link || res.fileUrl) && (
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Discussions Tab ── */}
        <TabsContent value="discussions">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {discussions.length} {discussions.length === 1 ? "مناقشة" : "مناقشات"}
            </p>
            {canPost(currentUser?.role, "student") && (
              <Button size="sm" onClick={() => setCreateDiscussionOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                مناقشة جديدة
              </Button>
            )}
          </div>

          {loadingDiscussions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : discussions.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">لا توجد مناقشات بعد</h3>
                <p className="text-sm text-muted-foreground mb-4">ابدأ مناقشة مع زملاء دفعتك!</p>
                {canPost(currentUser?.role, "student") && (
                  <Button size="sm" onClick={() => setCreateDiscussionOpen(true)} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    ابدأ المناقشة
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {discussions.map((disc, i) => (
                <motion.div
                  key={disc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border-border/50 transition-shadow ${disc.pinned ? "border-primary/30 bg-primary/5" : "hover:shadow-md"} ${expandedDiscussion === disc.id ? "ring-1 ring-primary/20" : ""}`}>
                    <CardContent className="p-4">
                      {/* Discussion Header */}
                      <div
                        className="cursor-pointer"
                        onClick={() => handleExpandDiscussion(disc.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {disc.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                              <h4 className="text-sm font-medium truncate">{disc.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{disc.content}</p>
                          </div>
                          <div className="shrink-0">
                            {expandedDiscussion === disc.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={disc.user.name} avatar={disc.user.avatar} />
                            <span className="text-xs text-muted-foreground">{disc.user.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{timeAgo(disc.createdAt)}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {disc._count.comments}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Discussion: Full Content + Comments */}
                      <AnimatePresence>
                        {expandedDiscussion === disc.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{disc.content}</p>

                              {/* Comments */}
                              <div className="space-y-1 mb-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  التعليقات ({disc._count.comments})
                                </p>
                              </div>

                              {loadingComments ? (
                                <div className="space-y-2">
                                  {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <Skeleton className="h-6 w-6 rounded-full" />
                                      <Skeleton className="h-3 flex-1" />
                                    </div>
                                  ))}
                                </div>
                              ) : comments.length > 0 ? (
                                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar mb-3">
                                  {comments.map((comment) => (
                                    <CommentThread
                                      key={comment.id}
                                      comment={comment}
                                      onReply={handleReply}
                                      currentUser={currentUser}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
                              )}

                              {/* Reply Form */}
                              {currentUser && (
                                <div className="flex items-center gap-2 mt-3">
                                  <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="sm" />
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input
                                      placeholder={replyTo ? "اكتب رداً..." : "أضف تعليقاً..."}
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      className="flex-1 h-8 text-sm"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && replyContent.trim()) {
                                          e.preventDefault();
                                          handleSubmitReply();
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={handleSubmitReply}
                                      disabled={submitting || !replyContent.trim()}
                                      className="h-8 w-8 p-0"
                                    >
                                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {replyTo && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-muted-foreground">الرد على تعليق</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1 text-[10px]"
                                    onClick={() => setReplyTo(null)}
                                  >
                                    إلغاء
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Discussion Dialog */}
      <Dialog open={createDiscussionOpen} onOpenChange={setCreateDiscussionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              مناقشة جديدة
            </DialogTitle>
            <DialogDescription>ابدأ مناقشة مع زملاء دفعتك</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">العنوان *</label>
              <Input
                placeholder="عن ماذا تريد أن تناقش؟"
                value={newDiscussionTitle}
                onChange={(e) => setNewDiscussionTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المحتوى *</label>
              <Textarea
                placeholder="شارك أفكارك..."
                value={newDiscussionContent}
                onChange={(e) => setNewDiscussionContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDiscussionOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleCreateDiscussion} disabled={submitting || !newDiscussionTitle.trim() || !newDiscussionContent.trim()} className="gap-1.5">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              نشر المناقشة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// NEWS SECTION — Announcements
// ═══════════════════════════════════════════════════════════════════════
interface NewsItem {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null; role: string };
}

const categoryColors: Record<string, string> = {
  announcement: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  exam: "bg-red-500/15 text-red-700 dark:text-red-400",
  event: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  general: "bg-secondary text-secondary-foreground",
};

const categoryLabels: Record<string, string> = {
  announcement: "إعلان",
  exam: "امتحان",
  event: "فعالية",
  general: "عام",
};

export function NewsSection() {
  const { currentUser } = useAppStore();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const fetchNews = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      const url = category && category !== "all" ? `/api/news?category=${category}` : "/api/news";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(activeCategory); }, [activeCategory, fetchNews]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePostNews = async () => {
    if (!currentUser || !newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
        }),
      });
      if (res.ok) {
        toast.success("تم نشر الخبر!");
        setNewTitle("");
        setNewContent("");
        setNewCategory("general");
        setPostDialogOpen(false);
        fetchNews(activeCategory);
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل نشر الخبر");
      }
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  };

  const canPostNews = currentUser && canPost(currentUser.role, "moderator") || currentUser?.role === "professor";

  const categories = [
    { key: "all", label: "الكل" },
    { key: "announcement", label: "إعلانات" },
    { key: "exam", label: "امتحانات" },
    { key: "event", label: "فعاليات" },
    { key: "general", label: "عام" },
  ];

  return (
    <SectionWrapper title="الأخبار والفعاليات" icon={Newspaper}>
      {/* Category Filter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <Badge
              key={cat.key}
              variant={activeCategory === cat.key ? "default" : "secondary"}
              className="cursor-pointer transition-colors"
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
        {canPostNews && (
          <Button size="sm" onClick={() => setPostDialogOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            نشر خبر
          </Button>
        )}
      </div>

      {/* News List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : news.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-teal-500/10 flex items-center justify-center">
              <Newspaper className="h-10 w-10 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">لا توجد أخبار</h3>
            <p className="text-sm text-muted-foreground">
              {activeCategory !== "all"
                ? `لا توجد أخبار من نوع ${categoryLabels[activeCategory] || activeCategory}.`
                : "لا توجد أخبار أو إعلانات بعد."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {news.map((item, i) => {
            const isExpanded = expandedIds.has(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`border-border/50 transition-shadow cursor-pointer hover:shadow-md ${
                    item.pinned ? "border-primary/30 bg-primary/5" : ""
                  }`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.pinned && <Star className="h-3.5 w-3.5 text-primary fill-primary shrink-0" />}
                          <h4 className="text-sm font-medium">{item.title}</h4>
                        </div>
                        {!isExpanded && item.content.length > 120 && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                        )}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2"
                          >
                            <p className="text-sm text-foreground whitespace-pre-wrap">{item.content}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <UserAvatar name={item.author.name} avatar={item.author.avatar} />
                              <div>
                                <p className="text-xs font-medium">{item.author.name}</p>
                                <p className="text-[10px] text-muted-foreground">{timeAgo(item.createdAt)}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-[10px] ${categoryColors[item.category] || categoryColors.general}`}>
                            {categoryLabels[item.category] || item.category}
                          </Badge>
                          {!isExpanded && (
                            <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Post News Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              نشر خبر
            </DialogTitle>
            <DialogDescription>شارك إعلاناً أو تحديثاً مع الدفعة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">العنوان *</label>
              <Input
                placeholder="عنوان الخبر..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المحتوى *</label>
              <Textarea
                placeholder="اكتب الإعلان كاملاً..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">التصنيف</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">إعلان</SelectItem>
                  <SelectItem value="exam">امتحان</SelectItem>
                  <SelectItem value="event">فعالية</SelectItem>
                  <SelectItem value="general">عام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPostDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handlePostNews} disabled={submitting || !newTitle.trim() || !newContent.trim()} className="gap-1.5">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              نشر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// GAMES SECTION — Unchanged
// ═══════════════════════════════════════════════════════════════════════
export function GamesSection() {
  const { currentUser } = useAppStore();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<Record<string, Array<{ userName: string; score: number }>>>({});
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const games = [
    { id: "xo", name: "تيك تاك تو", icon: "❌", description: "كلاسيكي X و O ضد الذكاء الاصطناعي", players: "لاعب واحد", color: "from-cyan-500/15 to-teal-500/15", gradient: "from-cyan-500 to-teal-500" },
    { id: "memory", name: "تطابق الذاكرة", icon: "🧠", description: "اختبر ذاكرتك", players: "لاعب واحد", color: "from-violet-500/15 to-purple-500/15", gradient: "from-violet-500 to-purple-500" },
    { id: "chess", name: "شطرنج", icon: "♟️", description: "لعبة استراتيجية ضد الذكاء الاصطناعي", players: "لاعب واحد", color: "from-emerald-500/15 to-green-500/15", gradient: "from-emerald-500 to-green-500" },
    { id: "quiz", name: "اختبار الذكاء الاصطناعي", icon: "📝", description: "أسئلة عامة من الذكاء الاصطناعي", players: "لاعب واحد", color: "from-amber-500/15 to-orange-500/15", gradient: "from-amber-500 to-orange-500" },
  ];

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const gameIds = ["xo", "memory", "chess", "quiz"];
        const results: Record<string, Array<{ userName: string; score: number }>> = {};
        for (const g of gameIds) {
          const res = await fetch(`/api/games/score?game=${g}&limit=5`);
          const data = await res.json();
          results[g] = data.scores || [];
        }
        setLeaderboard(results);
      } catch {
        // silently fail
      } finally {
        setLoadingLeaderboard(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const handleScore = async (score: number) => {
    setLastScore(score);
    if (currentUser?.id && activeGame) {
      try {
        await fetch("/api/games/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, game: activeGame, score }),
        });
        const res = await fetch(`/api/games/score?game=${activeGame}&limit=5`);
        const data = await res.json();
        setLeaderboard((prev) => ({ ...prev, [activeGame]: data.scores || [] }));
      } catch {
        // silently fail
      }
    }
  };

  const renderGame = () => {
    switch (activeGame) {
      case "xo":
        return <TicTacToeGame onScore={handleScore} />;
      case "memory":
        return <MemoryMatchGame onScore={handleScore} />;
      case "chess":
        return <ChessGameComponent onScore={handleScore} />;
      case "quiz":
        return <AIQuizGame onScore={handleScore} />;
      default:
        return null;
    }
  };

  if (activeGame) {
    const currentGame = games.find((g) => g.id === activeGame)!;
    return (
      <SectionWrapper title="الألعاب" icon={Gamepad2}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={() => { setActiveGame(null); setLastScore(null); }} className="gap-1.5">
            ← رجوع
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentGame.icon}</span>
            <h3 className="text-lg font-bold">{currentGame.name}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-6">
                {renderGame()}
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-4">
            {lastScore !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      +{lastScore}
                    </p>
                    <p className="text-xs text-muted-foreground">نقاط مكتسبة</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentUser && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">نقاطك</span>
                  </div>
                  <p className="text-2xl font-bold">{currentUser.points.toLocaleString()}</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  أفضل اللاعبين في {currentGame.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {loadingLeaderboard ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {leaderboard[activeGame]?.length > 0 ? (
                      leaderboard[activeGame].map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold w-5 ${
                              i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"
                            }`}>
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                            </span>
                            <span className="text-sm truncate">{entry.userName}</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">{entry.score}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد نتائج بعد. كن الأول!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs font-medium mb-2">دليل النقاط</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {activeGame === "xo" && (
                    <>
                      <p>🏆 فوز: <span className="text-emerald-500 font-semibold">500</span></p>
                      <p>🤝 تعادل: <span className="text-amber-500 font-semibold">200</span></p>
                      <p>💀 خسارة: <span className="text-red-500 font-semibold">50</span></p>
                    </>
                  )}
                  {activeGame === "memory" && (
                    <p>النتيجة = الحد الأقصى (100, 1000 - عدد الحركات × 30)</p>
                  )}
                  {activeGame === "chess" && (
                    <>
                      <p>🏆 فوز سهل: 500</p>
                      <p>🏆 فوز متوسط: 1000</p>
                      <p>🏆 فوز صعب: 1500</p>
                      <p>🤝 تعادل: 200</p>
                    </>
                  )}
                  {activeGame === "quiz" && (
                    <p>100 نقطة لكل إجابة صحيحة × 7 أسئلة</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="الألعاب" icon={Gamepad2}>
      <Card className="border-border/50 bg-gradient-to-br from-cyan-500/5 to-teal-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-cyan-500/15">
              <Gamepad2 className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">مركز الألعاب</h3>
              <p className="text-sm text-muted-foreground">العب ألعاباً، واكسب نقاطاً، وتنافس مع زملاء دفعتك!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`border-border/50 bg-gradient-to-br ${game.color} hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden relative`}
              onClick={() => setActiveGame(game.id)}
            >
              <CardContent className="p-6">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
                <div className="text-3xl mb-3">{game.icon}</div>
                <h4 className="font-semibold mb-1">{game.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">{game.players}</Badge>
                  <Button size="sm" className={`gap-1.5 bg-gradient-to-r ${game.gradient} text-white border-0 group-hover:opacity-90 transition-opacity`}>
                    العب <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            أفضل اللاعبين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {games.map((game) => (
              <div key={game.id} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  {game.icon} {game.name}
                </p>
                <div className="space-y-1">
                  {leaderboard[game.id]?.slice(0, 3).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate flex items-center gap-1">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                        <span className="truncate max-w-[80px]">{entry.userName}</span>
                      </span>
                      <span className="font-semibold text-primary ml-1">{entry.score}</span>
                    </div>
                  )) || (
                    <p className="text-[10px] text-muted-foreground">لا توجد نتائج بعد</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}

export { AIChatSection } from "./ai-chat-section";
export { AdminSection } from "./admin-section";
