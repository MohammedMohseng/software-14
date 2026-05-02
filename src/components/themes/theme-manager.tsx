"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Sun,
  Moon,
  Check,
  RotateCcw,
  Save,
  Loader2,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

interface ThemePreset {
  key: string;
  name: string;
  nameAr: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

interface ThemeData {
  activeTheme: string;
  presets: ThemePreset[];
  currentTheme: ThemePreset & { key: string };
  customOverrides: Record<string, string>;
}

export function ThemeManager() {
  const { currentUser } = useAppStore();
  const canEdit = currentUser?.role === "admin" || currentUser?.role === "moderator";

  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  const fetchTheme = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/theme");
      const data = await res.json();
      setThemeData(data);
    } catch {
      toast.error("فشل تحميل بيانات المظهر");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handleApplyTheme = async (themeKey: string) => {
    if (!canEdit || !currentUser?.id) return;
    setApplying(themeKey);
    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply-theme",
          themeKey,
          requesterId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "تم تطبيق المظهر بنجاح");
        fetchTheme();
      } else {
        toast.error(data.error || "فشل تطبيق المظهر");
      }
    } catch {
      toast.error("حدث خطأ أثناء تطبيق المظهر");
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!themeData) return null;

  const activeKey = themeData.activeTheme;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-teal-500/5 to-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">إدارة المظهر</h3>
                <p className="text-xs text-muted-foreground">
                  المظهر الحالي: <span className="font-medium text-foreground">{themeData.currentTheme?.nameAr || "الافتراضي"}</span>
                </p>
              </div>
            </div>
            {!canEdit && (
              <Badge variant="secondary" className="text-[10px]">
                عرض فقط
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={previewMode === "light" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setPreviewMode("light")}
        >
          <Sun className="h-3.5 w-3.5" />
          وضع الفاتح
        </Button>
        <Button
          variant={previewMode === "dark" ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setPreviewMode("dark")}
        >
          <Moon className="h-3.5 w-3.5" />
          وضع الداكن
        </Button>
      </div>

      {/* Theme Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {themeData.presets.map((preset, index) => {
            const isActive = preset.key === activeKey;
            const isApplying = applying === preset.key;
            const colors = previewMode === "light" ? preset.light : preset.dark;

            return (
              <motion.div
                key={preset.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 overflow-hidden ${
                    isActive
                      ? "ring-2 ring-primary shadow-lg shadow-primary/10"
                      : previewTheme === preset.key
                      ? "ring-1 ring-primary/50"
                      : "hover:shadow-md"
                  }`}
                  onMouseEnter={() => setPreviewTheme(preset.key)}
                  onMouseLeave={() => setPreviewTheme(null)}
                >
                  {/* Preview Strip */}
                  <div
                    className="h-24 relative"
                    style={{ backgroundColor: colors["background"] }}
                  >
                    {/* Mini UI preview */}
                    <div className="absolute inset-2 flex flex-col gap-1.5">
                      {/* Header bar */}
                      <div
                        className="h-3 rounded-sm flex items-center px-1 gap-0.5"
                        style={{ backgroundColor: colors["sidebar"] }}
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: colors["primary"] }}
                        />
                        <div
                          className="h-1 w-6 rounded-sm"
                          style={{ backgroundColor: colors["text-secondary"] }}
                        />
                      </div>
                      {/* Content area */}
                      <div className="flex-1 flex gap-1">
                        <div
                          className="w-8 rounded-sm flex flex-col gap-0.5 p-0.5"
                          style={{ backgroundColor: colors["sidebar"] }}
                        >
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-1 rounded-sm"
                              style={{
                                backgroundColor: i === 1 ? colors["primary"] : colors["border"],
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div
                            className="flex-1 rounded-sm p-1"
                            style={{ backgroundColor: colors["card"] }}
                          >
                            <div
                              className="h-1 w-8 rounded-sm mb-0.5"
                              style={{ backgroundColor: colors["text-primary"] }}
                            />
                            <div
                              className="h-1 w-12 rounded-sm"
                              style={{ backgroundColor: colors["text-secondary"] }}
                            />
                          </div>
                          <div
                            className="h-4 rounded-sm flex items-center justify-center"
                            style={{ backgroundColor: colors["primary"] }}
                          >
                            <div
                              className="h-1 w-6 rounded-sm"
                              style={{ backgroundColor: colors["text-primary"] }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active badge */}
                    {isActive && (
                      <div className="absolute top-1.5 left-1.5">
                        <Badge className="text-[9px] px-1.5 py-0 h-5 bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-2.5 w-2.5 ml-0.5" />
                          نشط
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{preset.nameAr}</p>
                        <p className="text-[10px] text-muted-foreground">{preset.name}</p>
                      </div>
                    </div>

                    {/* Color dots */}
                    <div className="flex items-center gap-1 mb-3">
                      {["primary", "accent", "background", "card"].map((colorKey) => (
                        <div
                          key={colorKey}
                          className="h-4 w-4 rounded-full border border-border/50"
                          style={{ backgroundColor: colors[colorKey] }}
                          title={colorKey}
                        />
                      ))}
                    </div>

                    {/* Apply button */}
                    {canEdit && !isActive && (
                      <Button
                        size="sm"
                        className="w-full text-xs gap-1"
                        onClick={() => handleApplyTheme(preset.key)}
                        disabled={isApplying}
                      >
                        {isApplying ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        تطبيق للجميع
                      </Button>
                    )}
                    {isActive && (
                      <div className="text-center text-xs text-primary font-medium">
                        ← المظهر المفعّل حالياً
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Current Theme Details */}
      {themeData.currentTheme && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              تفاصيل المظهر الحالي — {themeData.currentTheme.nameAr}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="light" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="light" className="gap-1.5 flex-1">
                  <Sun className="h-3.5 w-3.5" />
                  ألوان الفاتح
                </TabsTrigger>
                <TabsTrigger value="dark" className="gap-1.5 flex-1">
                  <Moon className="h-3.5 w-3.5" />
                  ألوان الداكن
                </TabsTrigger>
              </TabsList>
              <TabsContent value="light">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {Object.entries(themeData.currentTheme.light).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                      <div
                        className="h-6 w-6 rounded-md border border-border/50 shrink-0"
                        style={{ backgroundColor: value }}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground truncate">{key}</p>
                        <p className="text-xs font-mono truncate" dir="ltr">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="dark">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {Object.entries(themeData.currentTheme.dark).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                      <div
                        className="h-6 w-6 rounded-md border border-border/50 shrink-0"
                        style={{ backgroundColor: value }}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground truncate">{key}</p>
                        <p className="text-xs font-mono truncate" dir="ltr">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
