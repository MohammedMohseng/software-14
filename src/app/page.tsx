"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookHeart,
  Images,
  GraduationCap,
  Gamepad2,
  Bot,
  Trophy,
  Sparkles,
  Heart,
  Users,
  Star,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ───────────── animation variants ───────────── */

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ───────────── reusable section wrapper ───────────── */

function SectionWrapper({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ───────────── data ───────────── */

const features = [
  {
    title: "الذكريات",
    description: "شارك لحظاتك مع زملائك",
    icon: BookHeart,
    color: "rose",
    gradient: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50",
    bgDark: "dark:bg-rose-950/30",
    iconColor: "text-rose-500",
    borderHover: "hover:border-rose-300 dark:hover:border-rose-800",
  },
  {
    title: "المعرض",
    description: "ألبومات صور لكل مناسبة",
    icon: Images,
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    bgDark: "dark:bg-violet-950/30",
    iconColor: "text-violet-500",
    borderHover: "hover:border-violet-300 dark:hover:border-violet-800",
  },
  {
    title: "الأكاديمي",
    description: "مصادر ومناقشات أكاديمية",
    icon: GraduationCap,
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-950/30",
    iconColor: "text-amber-500",
    borderHover: "hover:border-amber-300 dark:hover:border-amber-800",
  },
  {
    title: "الألعاب",
    description: "ألعاب مدعومة بالذكاء الاصطناعي",
    icon: Gamepad2,
    color: "cyan",
    gradient: "from-cyan-500 to-teal-600",
    bgLight: "bg-cyan-50",
    bgDark: "dark:bg-cyan-950/30",
    iconColor: "text-cyan-500",
    borderHover: "hover:border-cyan-300 dark:hover:border-cyan-800",
  },
  {
    title: "المحادثة الذكية",
    description: "مساعد ذكي للإجابة على أسئلتك",
    icon: Bot,
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-950/30",
    iconColor: "text-emerald-500",
    borderHover: "hover:border-emerald-300 dark:hover:border-emerald-800",
  },
  {
    title: "لوحة الشرف",
    description: "شرف أسبوعي للمتميزين",
    icon: Trophy,
    color: "primary",
    gradient: "from-primary to-teal-600",
    bgLight: "bg-primary/5",
    bgDark: "dark:bg-primary/10",
    iconColor: "text-primary",
    borderHover: "hover:border-primary/40 dark:hover:border-primary/30",
  },
];

const stats = [
  { label: "زميل", value: 0, icon: Users, color: "text-rose-500", api: "users" },
  { label: "ذكرى", value: 0, icon: Heart, color: "text-violet-500", api: "memories" },
  { label: "مصدر أكاديمي", value: 0, icon: GraduationCap, color: "text-amber-500", api: "academic" },
  { label: "ألعاب", value: 4, icon: Gamepad2, color: "text-cyan-500", api: null },
];

const honorCategories = [
  { title: "أكاديمي", icon: GraduationCap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { title: "ألعاب", icon: Gamepad2, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  { title: "تصويت", icon: Star, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
];

const honorUsers = [
  { name: "المركز الأول", medal: "🥇" },
  { name: "المركز الثاني", medal: "🥈" },
  { name: "المركز الثالث", medal: "🥉" },
];

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [liveStats, setLiveStats] = useState<Record<string, number>>({
    users: 0,
    memories: 0,
    academic: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [memRes, acadRes] = await Promise.all([
          fetch("/api/memories").catch(() => null),
          fetch("/api/academic").catch(() => null),
        ]);
        const memData = memRes ? await memRes.json() : null;
        const acadData = acadRes ? await acadRes.json() : null;
        setLiveStats({
          users: memData?.memories?.length ? new Set(memData.memories.map((m: { userId: string }) => m.userId)).size : 0,
          memories: memData?.memories?.length || 0,
          academic: acadData?.resources?.length || 0,
        });
      } catch {
        // silently fail — keep zeros
      }
    }
    fetchStats();
  }, []);

  const displayStats = stats.map((s) => ({
    ...s,
    value: s.api && liveStats[s.api] > 0 ? liveStats[s.api] : s.value,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ────────── HERO ────────── */}
      <section className="relative overflow-hidden">
        {/* gradient background */}
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 via-teal-500/10 to-emerald-500/15 dark:from-primary/10 dark:via-teal-900/20 dark:to-emerald-900/10" />

        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />

        {/* content */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {/* sparkle badge */}
            <motion.div variants={slideUp} className="flex justify-center mb-6">
              <Badge
                variant="secondary"
                className="gap-1.5 px-4 py-1.5 text-sm font-medium glass"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                مرحبًا بكم في منصتنا
              </Badge>
            </motion.div>

            {/* heading */}
            <motion.h1
              variants={slideUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              <span className="bg-gradient-to-l from-primary via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                منصة Software-14
              </span>
            </motion.h1>

            {/* subtitle */}
            <motion.p
              variants={slideUp}
              className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10"
            >
              منصة تفاعلية اجتماعية وأكاديمية لدفعتنا. شارك الذكريات، العب ألعاب
              الذكاء الاصطناعي، وصل إلى المصادر الأكاديمية والمزيد.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={slideUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                asChild
                size="lg"
                className="gap-2 text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
              >
                <Link href="/auth/login">
                  تسجيل الدخول
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 text-base px-8 h-12 rounded-xl"
              >
                <Link href="/auth/register">
                  إنشاء حساب جديد
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base px-8 h-12 rounded-xl"
                onClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                اكتشف المزيد
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ────────── FEATURES GRID ────────── */}
      <SectionWrapper
        id="features"
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
      >
        <motion.div variants={slideUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">مميزات المنصة</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            كل ما تحتاجه في مكان واحد — من الذكريات إلى الألعاب والأكاديمي
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={slideUp}>
              <Card
                className={`group relative overflow-hidden border transition-all duration-300 ${f.borderHover} hover:shadow-lg hover:-translate-y-1`}
              >
                {/* top accent gradient */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <CardHeader className="pb-3">
                  <div
                    className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${f.bgLight} ${f.bgDark} mb-3`}
                  >
                    <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </SectionWrapper>

      {/* ────────── STATS ────────── */}
      <SectionWrapper className="relative overflow-hidden">
        {/* subtle background */}
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-teal-500/5 dark:from-primary/5 dark:via-transparent dark:to-teal-900/10" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {displayStats.map((s) => (
              <motion.div key={s.label} variants={slideUp}>
                <Card className="text-center glass border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <s.icon className={`h-7 w-7 mx-auto mb-3 ${s.color}`} />
                    <div className="text-3xl sm:text-4xl font-extrabold mb-1">
                      {s.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionWrapper>

      {/* ────────── HONOR ROLL PREVIEW ────────── */}
      <SectionWrapper className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <motion.div variants={slideUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">لوحة الشرف الأسبوعية</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            المتميزون من دفعتنا في مختلف المجالات
          </p>
        </motion.div>

        <motion.div variants={slideUp}>
          <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-gradient-to-l from-primary/5 to-teal-500/5 dark:from-primary/10 dark:to-teal-900/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">لوحة الشرف</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* categories */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {honorCategories.map((cat) => (
                  <Badge
                    key={cat.title}
                    variant="secondary"
                    className={`gap-1.5 px-4 py-1.5 text-sm ${cat.bg} border-0`}
                  >
                    <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                    {cat.title}
                  </Badge>
                ))}
              </div>

              {/* top 3 podium */}
              <div className="flex items-end justify-center gap-4 sm:gap-6">
                {/* 2nd place */}
                <motion.div
                  variants={slideUp}
                  className="flex flex-col items-center"
                >
                  <div className="h-16 w-16 rounded-full bg-gradient-to-bl from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-2xl mb-2 ring-4 ring-gray-200 dark:ring-gray-700">
                    👤
                  </div>
                  <span className="text-2xl mb-1">🥈</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    المركز الثاني
                  </span>
                </motion.div>

                {/* 1st place */}
                <motion.div
                  variants={slideUp}
                  className="flex flex-col items-center -mt-4"
                >
                  <div className="h-20 w-20 rounded-full bg-gradient-to-bl from-amber-300 to-amber-500 dark:from-amber-500 dark:to-amber-700 flex items-center justify-center text-3xl mb-2 ring-4 ring-amber-200 dark:ring-amber-800 shadow-lg shadow-amber-200/40 dark:shadow-amber-900/30">
                    👤
                  </div>
                  <span className="text-3xl mb-1">🥇</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    المركز الأول
                  </span>
                </motion.div>

                {/* 3rd place */}
                <motion.div
                  variants={slideUp}
                  className="flex flex-col items-center"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-bl from-orange-300 to-orange-400 dark:from-orange-600 dark:to-orange-800 flex items-center justify-center text-xl mb-2 ring-4 ring-orange-200 dark:ring-orange-800">
                    👤
                  </div>
                  <span className="text-2xl mb-1">🥉</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    المركز الثالث
                  </span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </SectionWrapper>

      {/* ────────── CTA ────────── */}
      <SectionWrapper className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-teal-500/5 to-emerald-500/10 dark:from-primary/15 dark:via-teal-900/10 dark:to-emerald-900/15" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <motion.div variants={staggerContainer}>
            <motion.div variants={slideUp}>
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 dark:bg-primary/15 mb-6 mx-auto">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </motion.div>

            <motion.h2
              variants={slideUp}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              انضم إلى مجتمعنا
            </motion.h2>

            <motion.p
              variants={slideUp}
              className="text-muted-foreground text-lg max-w-lg mx-auto mb-8 leading-relaxed"
            >
              سجل دخولك الآن لتستفيد من جميع ميزات المنصة
            </motion.p>

            <motion.div variants={slideUp}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 text-base px-10 h-12 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                >
                  <Link href="/auth/login">
                    تسجيل الدخول
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="gap-2 text-base px-10 h-12 rounded-xl"
                >
                  <Link href="/auth/register">
                    إنشاء حساب جديد
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* ────────── FOOTER (sticky) ────────── */}
      <footer className="mt-auto border-t border-border/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>© 2026 دفعة Software-14. جميع الحقوق محفوظة.</span>
            <span className="flex items-center gap-1">
              صُنع بـ <span className="text-rose-500">❤️</span> من فريق Software-14
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
