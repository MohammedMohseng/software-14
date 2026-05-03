"use client";

import React, { useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAppStore, type UserRole } from "@/stores/app-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LayoutDashboard,
  BookHeart,
  Images,
  GraduationCap,
  Newspaper,
  Gamepad2,
  Bot,
  Shield,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  Star,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIChatWidget } from "@/components/shared/ai-chat-widget";

// ─── Navigation Items ────────────────────────────────────────────────
const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/memories", label: "الذكريات", icon: BookHeart },
  { href: "/gallery", label: "المعرض", icon: Images },
  { href: "/academic", label: "الأكاديمي", icon: GraduationCap },
  { href: "/news", label: "الأخبار", icon: Newspaper },
  { href: "/games", label: "الألعاب", icon: Gamepad2 },
  { href: "/ai", label: "المحادثة الذكية", icon: Bot },
] as const;

const adminItem = { href: "/admin", label: "الإدارة", icon: Shield };

// ─── Route-to-Title Mapping ──────────────────────────────────────────
const routeTitles: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/memories": "الذكريات",
  "/gallery": "المعرض",
  "/academic": "الأكاديمي",
  "/news": "الأخبار والفعاليات",
  "/games": "الألعاب",
  "/ai": "المحادثة الذكية",
  "/admin": "لوحة الإدارة",
  "/settings": "الإعدادات",
};

// ─── Role Config ─────────────────────────────────────────────────────
const roleBadgeClasses: Record<UserRole, string> = {
  admin: "bg-emerald-600 text-white",
  moderator: "bg-teal-500 text-white",
  professor: "bg-amber-500 text-white",
  student: "bg-primary/15 text-primary",
  visitor: "bg-muted text-muted-foreground",
};

const roleLabels: Record<UserRole, string> = {
  admin: "مدير",
  moderator: "مشرف",
  professor: "أستاذ",
  student: "طالب",
  visitor: "زائر",
};

// ─── Mobile Bottom Nav Items ─────────────────────────────────────────
const mobileNavItems = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/memories", label: "الذكريات", icon: BookHeart },
  { href: "/academic", label: "الأكاديمي", icon: GraduationCap },
  { href: "/games", label: "الألعاب", icon: Gamepad2 },
  { href: "/ai", label: "المساعد", icon: Bot },
] as const;

// ─── Helper: Role Badge ──────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge className={`${roleBadgeClasses[role]} border-0 text-[10px] px-1.5 py-0`}>
      {roleLabels[role]}
    </Badge>
  );
}

// ─── Sidebar Content (shared between desktop & mobile) ───────────────
function SidebarContent({
  pathname,
  onClose,
  currentUser,
}: {
  pathname: string;
  onClose?: () => void;
  currentUser: useAppStore extends { getState: () => infer S } ? S["currentUser"] : never;
}) {
  const { theme, setTheme } = useTheme();
  const userRole = currentUser?.role || "visitor";
  const isAdminOrModerator = userRole === "admin" || userRole === "moderator";

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/50">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-teal-500 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-lg font-bold bg-gradient-to-l from-primary to-teal-500 bg-clip-text text-transparent">
          Software-14
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group
                ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }
              `}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="mr-auto h-1.5 w-1.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {/* Admin Link */}
        {isAdminOrModerator && (
          <>
            <Separator className="my-2" />
            <Link
              href={adminItem.href}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group
                ${
                  pathname === adminItem.href || pathname.startsWith(adminItem.href + "/")
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }
              `}
            >
              <Shield
                className={`h-5 w-5 shrink-0 transition-colors ${
                  pathname === adminItem.href
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground group-hover:text-accent-foreground"
                }`}
              />
              <span>{adminItem.label}</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom: Current User + Theme Toggle */}
      <div className="border-t border-border/50 p-4 space-y-3">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">المظهر</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="تبديل المظهر"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Current User */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {currentUser.avatar ? (
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {currentUser.name?.slice(0, 2) || "م"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RoleBadge role={userRole} />
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                  {currentUser.points}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile Bottom Navigation ────────────────────────────────────────
function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border/50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-lg
                transition-colors duration-200 min-w-0
                ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-accent-foreground"
                }
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Loading Screen ──────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="h-10 w-10 rounded-full border-3 border-primary border-t-transparent"
      />
      <p className="text-sm text-muted-foreground font-medium">جاري التحميل...</p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD LAYOUT
// ═════════════════════════════════════════════════════════════════════
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const {
    currentUser,
    setCurrentUser,
    sidebarOpen,
    setSidebarOpen,
    setActiveSection,
  } = useAppStore();

  // ─── Redirect if unauthenticated ─────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // ─── Sync user data to Zustand store ─────────────────────────────
  useEffect(() => {
    if (session?.user) {
      setCurrentUser({
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: (session.user.role as UserRole) || "visitor",
        avatar: session.user.avatar ?? null,
        points: session.user.points ?? 0,
        bio: session.user.bio ?? null,
        themePref: session.user.themePref ?? null,
      });
    }
  }, [session, setCurrentUser]);

  // ─── Update active section based on pathname ─────────────────────
  useEffect(() => {
    const section = pathname.split("/").filter(Boolean)[0] || "dashboard";
    setActiveSection(section);
  }, [pathname, setActiveSection]);

  // ─── Loading state ───────────────────────────────────────────────
  if (status === "loading") {
    return <LoadingScreen />;
  }

  // ─── No session → render nothing (redirect in progress) ──────────
  if (!session) {
    return null;
  }

  // ─── Derived values ──────────────────────────────────────────────
  const pageTitle = routeTitles[pathname] || "لوحة التحكم";
  const userRole = currentUser?.role || "visitor";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1">
        {/* ─── Desktop Sidebar (right side in RTL) ─────────────────── */}
        {!isMobile && (
          <aside className="hidden md:flex w-64 flex-col border-s border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 h-screen">
            <SidebarContent
              pathname={pathname}
              currentUser={currentUser}
            />
          </aside>
        )}

        {/* ─── Mobile Sidebar (Sheet) ──────────────────────────────── */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>القائمة الجانبية</SheetTitle>
              </SheetHeader>
              <SidebarContent
                pathname={pathname}
                currentUser={currentUser}
                onClose={() => setSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* ─── Main Content Area ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ─── Header ─────────────────────────────────────────────── */}
          <header className="sticky top-0 z-30 flex items-center gap-3 h-16 px-4 md:px-6 border-b border-border/50 bg-background/80 backdrop-blur-lg">
            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => setSidebarOpen(true)}
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Mobile Logo */}
            {isMobile && (
              <div className="flex items-center gap-2 md:hidden">
                <div className="flex items-center justify-center h-7 w-7 rounded-md bg-gradient-to-br from-primary to-teal-500">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-l from-primary to-teal-500 bg-clip-text text-transparent">
                  S-14
                </span>
              </div>
            )}

            {/* Desktop: Page Title */}
            {!isMobile && (
              <h2 className="text-lg font-semibold hidden md:block">
                {pageTitle}
              </h2>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Points Display */}
            {currentUser && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-xs font-semibold">{currentUser.points}</span>
              </div>
            )}

            {/* Theme Toggle (Desktop) */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="تبديل المظهر"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === "dark" ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            )}

            {/* User Dropdown */}
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9 px-2"
                >
                  <Avatar className="h-7 w-7">
                    {currentUser?.avatar ? (
                      <AvatarImage src={currentUser.avatar} alt={currentUser?.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                      {currentUser?.name?.slice(0, 2) || "م"}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {currentUser?.name}
                    </span>
                  )}
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{currentUser?.name}</span>
                      <RoleBadge role={userRole} />
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {currentUser?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>الملف الشخصي</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* ─── Main Content ───────────────────────────────────────── */}
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>

          {/* ─── Footer ─────────────────────────────────────────────── */}
          <footer className="hidden md:block border-t border-border/50 bg-card/50 py-4 px-6 text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 دفعة Software-14. جميع الحقوق محفوظة.
            </p>
          </footer>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation ──────────────────────────────── */}
      {isMobile && <MobileBottomNav pathname={pathname} />}

      {/* ─── AI Chat Widget ────────────────────────────────────────── */}
      <AIChatWidget />
    </div>
  );
}
