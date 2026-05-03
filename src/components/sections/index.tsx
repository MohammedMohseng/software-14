"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookHeart, Images, GraduationCap, Newspaper, Gamepad2,
  Bot, Heart, Star, TrendingUp, Users, Calendar, Clock, ArrowRight,
  Sparkles, Trophy, Flag, Plus, MessageSquare, Pin, ChevronDown,
  ChevronUp, Send, ExternalLink, FileText, Video, Link2, X,
  ImageIcon, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

// ─── مجمع الأقسام ──────────────────────
export function SectionWrapper({ children, title, icon: Icon }: { children: React.ReactNode; title: string; icon: any }) {
  return (
    <motion.div initial={fadeIn.initial} animate={fadeIn.animate} className="space-y-6">
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

// ─── مساعد: الوقت النسبي بالعربي ──────────────────────
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  return date.toLocaleDateString("ar-EG");
}

function UserAvatar({ name, avatar, size = "sm" }: { name: string; avatar?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };
  if (avatar) return <img src={avatar} alt={name} className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-background`} />;
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold ring-2 ring-background`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// قسم الرئيسية - Home
// ═══════════════════════════════════════════════════════════════════════
export function HomeSection() {
  const { currentUser, setActiveSection } = useAppStore();
  const [honorData, setHonorData] = useState<any>(null);
  const [honorLoading, setHonorLoading] = useState(true);

  useEffect(() => {
    fetch("/api/honor").then(res => res.json()).then(data => { setHonorData(data); setHonorLoading(false); }).catch(() => setHonorLoading(false));
  }, []);

  const quickActions = [
    { label: "الذكريات", icon: BookHeart, section: "memories" as const, color: "from-rose-500/20 to-pink-500/20", iconColor: "text-rose-500" },
    { label: "المعرض", icon: Images, section: "gallery" as const, color: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-500" },
    { label: "الأكاديميا", icon: GraduationCap, section: "academic" as const, color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-500" },
    { label: "الألعاب", icon: Gamepad2, section: "games" as const, color: "from-cyan-500/20 to-teal-500/20", iconColor: "text-cyan-500" },
  ];

  return (
    <SectionWrapper title="الرئيسية" icon={LayoutDashboard}>
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-teal-500/10 to-emerald-500/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-1">
                مرحباً بعودتك، {currentUser?.name || "زائر"}! 👋
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                خليك متصل مع دفعتك. شارك ذكرياتك، حمل ملفاتك، واستمتع بوقتك!
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setActiveSection("memories")} className="gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  شارك ذكرى
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveSection("ai")} className="gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  دردشة الذكاء الاصطناعي
                </Button>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center h-24 w-24 rounded-2xl bg-primary/10">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Card key={action.section} className={`cursor-pointer border-0 bg-gradient-to-br ${action.color} hover:scale-[1.02] transition-all`} onClick={() => setActiveSection(action.section)}>
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <action.icon className={`h-8 w-8 ${action.iconColor}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                آخر النشاطات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <p className="text-xs text-muted-foreground">لا توجد نشاطات حديثة حالياً.</p>
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
               <p className="text-xs text-muted-foreground">لا توجد أحداث مجدولة قريباً.</p>
            </CardContent>
         </Card>
      </div>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// قسم الذكريات - Memories
// ═══════════════════════════════════════════════════════════════════════
export function MemoriesSection() {
  const { currentUser } = useAppStore();
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formText, setFormText] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/memories");
      const data = await res.json();
      setMemories(data.memories || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const handleSubmit = async () => {
    if (!currentUser || !formText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, text: formText.trim(), imageUrl: formImageUrl.trim() || undefined }),
      });
      if (res.ok) {
        toast.success("تم نشر الذكرى بنجاح! ✨");
        setFormText(""); setFormImageUrl(""); setShowForm(false);
        fetchMemories();
      }
    } catch { toast.error("فشل النشر، حاول مرة ثانية"); }
    finally { setSubmitting(false); }
  };

  return (
    <SectionWrapper title="ذكرياتنا" icon={BookHeart}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{memories.length} ذكرى تمت مشاركتها</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "إلغاء" : "إضافة ذكرى"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <Textarea placeholder="اكتب ذكرى جميلة هنا..." value={formText} onChange={(e) => setFormText(e.target.value)} rows={4} className="bg-background" />
                <Input placeholder="رابط صورة (اختياري)" value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} className="bg-background" />
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={handleSubmit} disabled={submitting || !formText.trim()}>
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    نشر الذكرى
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? <p className="text-center">جاري تحميل اللحظات الجميلة...</p> : memories.map((m) => (
          <Card key={m.id} className="border-border/50 group">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserAvatar name={m.user.name} avatar={m.user.avatar} />
                <div>
                  <p className="text-sm font-medium">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(m.createdAt)}</p>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{m.text}</p>
              {m.imageUrl && <img src={m.imageUrl} alt="ذكرى" className="rounded-lg mt-2 w-full max-h-80 object-cover border" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// قسم الأكاديميا - Academic
// ═══════════════════════════════════════════════════════════════════════
export function AcademicSection() {
  return (
    <SectionWrapper title="المكتبة الأكاديمية" icon={GraduationCap}>
      <Tabs defaultValue="resources">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resources">المصادر والملفات</TabsTrigger>
          <TabsTrigger value="discussions">النقاشات</TabsTrigger>
        </TabsList>
        <TabsContent value="resources" className="mt-4">
           <Card className="p-8 text-center border-dashed">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد ملفات أكاديمية مرفوعة حتى الآن.</p>
           </Card>
        </TabsContent>
        <TabsContent value="discussions" className="mt-4">
            <Card className="p-8 text-center border-dashed">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">ابدأ نقاشاً مع زملائك حول المقررات.</p>
           </Card>
        </TabsContent>
      </Tabs>
    </SectionWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// قسم الألعاب - Games
// ═══════════════════════════════════════════════════════════════════════
export function GamesSection() {
  const { currentUser } = useAppStore();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const games = [
    { id: "xo", name: "إكس أو", icon: "❌", color: "from-cyan-500/15 to-teal-500/15" },
    { id: "memory", name: "اختبار الذاكرة", icon: "🧠", color: "from-violet-500/15 to-purple-500/15" },
    { id: "chess", name: "شطرنج", icon: "♟️", color: "from-emerald-500/15 to-green-500/15" },
    { id: "quiz", name: "مسابقة الذكاء", icon: "📝", color: "from-amber-500/15 to-orange-500/15" },
  ];

  if (activeGame) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => setActiveGame(null)}>← العودة للألعاب</Button>
        <Card className="p-6">
          {activeGame === "xo" && <TicTacToeGame onScore={(s) => toast.success(`كفيت ووفيت! حصلت على ${s} نقطة`)} />}
          {activeGame === "memory" && <MemoryMatchGame onScore={(s) => toast.success(`ذاكرة حديدية! +${s}`)} />}
          {/* بقية الألعاب هنا بنفس النمط */}
        </Card>
      </div>
    );
  }

  return (
    <SectionWrapper title="مركز الألعاب" icon={Gamepad2}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map((g) => (
          <Card key={g.id} className={`cursor-pointer hover:scale-105 transition-all bg-gradient-to-br ${g.color}`} onClick={() => setActiveGame(g.id)}>
            <CardContent className="p-6 text-center">
              <span className="text-4xl">{g.icon}</span>
              <h4 className="font-bold mt-2">{g.name}</h4>
              <p className="text-xs text-muted-foreground">العب واجمع النقاط</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWrapper>
  );
}

// تصدير الأقسام الإضافية
export { AIChatSection } from "./ai-chat-section";
export { AdminSection } from "./admin-section";
