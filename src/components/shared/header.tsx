"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useAppStore, type UserRole, type AppSection } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Moon, Sun, Sparkles, Trophy, LogOut, User as UserIcon, ChevronDown } from "lucide-react";

const sectionTitles: Record<AppSection, string> = {
  home: "Home",
  memories: "Memories",
  gallery: "Gallery",
  academic: "Academic",
  news: "News & Events",
  games: "Games",
  ai: "AI Chat",
  admin: "Admin Panel",
};

function RoleBadgeHeader({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; className: string }> = {
    admin: { label: "Admin", className: "bg-emerald-600 text-white hover:bg-emerald-600" },
    moderator: { label: "Mod", className: "bg-teal-500 text-white hover:bg-teal-500" },
    professor: { label: "Prof", className: "bg-amber-500 text-white hover:bg-amber-500" },
    student: { label: "Student", className: "bg-primary/15 text-primary hover:bg-primary/15" },
    visitor: { label: "Guest", className: "bg-muted text-muted-foreground hover:bg-muted" },
  };
  const { label, className } = config[role];
  return <Badge className={cn("text-[10px] px-1.5 py-0 hidden sm:inline-flex", className)}>{label}</Badge>;
}

export function Header() {
  const { activeSection, currentUser, setSidebarOpen } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 glass">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Mobile menu + Logo */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-primary via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Software-14
            </span>
          </div>

          {/* Desktop section title */}
          <div className="hidden md:flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">
              {sectionTitles[activeSection]}
            </h1>
          </div>
        </div>

        {/* Right: Theme + User */}
        <div className="flex items-center gap-2">
          {/* Points display */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Trophy className="h-3.5 w-3.5" />
              <span>{currentUser.points.toLocaleString()}</span>
            </div>
          )}

          {/* Theme toggle */}
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

          {/* User dropdown */}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <RoleBadgeHeader role={currentUser.role} />
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 sm:hidden">
                  <Trophy className="h-4 w-4" />
                  {currentUser.points.toLocaleString()} points
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
