"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useAppStore, type AppSection, type UserRole } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  BookHeart,
  Images,
  GraduationCap,
  Newspaper,
  Gamepad2,
  Bot,
  Shield,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

interface NavItem {
  id: AppSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[]; // if undefined, visible to all
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "memories", label: "Memories", icon: BookHeart },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "news", label: "News", icon: Newspaper },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "ai", label: "AI Chat", icon: Bot },
  { id: "admin", label: "Admin", icon: Shield, roles: ["admin", "moderator"] },
];

function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; className: string }> = {
    admin: { label: "Admin", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
    moderator: { label: "Mod", className: "bg-teal-500 text-white hover:bg-teal-500" },
    professor: { label: "Prof", className: "bg-amber-500 text-white hover:bg-amber-500" },
    student: { label: "Student", className: "bg-primary/15 text-primary hover:bg-primary/15" },
    visitor: { label: "Guest", className: "bg-muted text-muted-foreground hover:bg-muted" },
  };
  const { label, className } = config[role];
  return <Badge className={cn("text-[10px] px-1.5 py-0", className)}>{label}</Badge>;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-8 w-8 rounded-lg"
      aria-label="Toggle theme"
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-primary" />
        )
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

function NavItems({ onItemClick }: { onItemClick?: () => void }) {
  const { activeSection, setActiveSection, currentUser } = useAppStore();

  return (
    <div className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        // Check role visibility
        if (item.roles && currentUser && !item.roles.includes(currentUser.role)) {
          return null;
        }
        if (item.roles && !currentUser) {
          return null;
        }

        const isActive = activeSection === item.id;
        const Icon = item.icon;

        return (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => {
              setActiveSection(item.id);
              onItemClick?.();
            }}
            className={cn(
              "w-full justify-start gap-3 h-10 px-3 font-medium transition-all duration-200",
              isActive
                ? "bg-primary/12 text-primary hover:bg-primary/18 hover:text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
            <span className="truncate">{item.label}</span>
            {isActive && (
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        );
      })}
    </div>
  );
}

export function SidebarNav() {
  return (
    <div className="hidden md:flex flex-col h-full w-64 border-r border-border/50 bg-sidebar">
      <SidebarContent />
    </div>
  );
}

function SidebarContent() {
  const { currentUser, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <>
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/15">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base bg-gradient-to-r from-primary via-teal-600 to-emerald-500 bg-clip-text text-transparent">
            Software-14
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">Community Platform</span>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Nav Items */}
      <ScrollArea className="flex-1 py-3">
        <NavItems />
      </ScrollArea>

      <Separator className="opacity-50" />

      {/* Bottom section - User + Theme */}
      <div className="p-3 space-y-2">
        {currentUser && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-accent/50">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RoleBadge role={currentUser.role} />
                <span className="text-[10px] text-muted-foreground">{currentUser.points} pts</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileBottomNav() {
  const { activeSection, setActiveSection, currentUser } = useAppStore();

  const mobileItems = navItems.filter((item) => {
    if (item.id === "admin") {
      return currentUser && (currentUser.role === "admin" || currentUser.role === "moderator");
    }
    return true;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around py-1 px-1 safe-area-pb">
        {mobileItems.slice(0, 5).map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex-col h-auto py-1.5 px-2 gap-0.5 min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              <span className={cn("text-[10px] leading-tight", isActive && "font-semibold")}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
