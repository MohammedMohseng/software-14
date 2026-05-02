import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Theme presets with both light and dark mode colors
export const THEME_PRESETS: Record<string, {
  name: string;
  nameAr: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}> = {
  default: {
    name: "Default Emerald",
    nameAr: "الزمرد الافتراضي",
    light: {
      "primary": "#10b981",
      "accent": "#14b8a6",
      "background": "#f8faf9",
      "card": "#ffffff",
      "sidebar": "#f0fdf4",
      "text-primary": "#0f172a",
      "text-secondary": "#64748b",
      "border": "#e2e8f0",
    },
    dark: {
      "primary": "#34d399",
      "accent": "#2dd4bf",
      "background": "#0f1a15",
      "card": "#162019",
      "sidebar": "#0d1610",
      "text-primary": "#f0fdf4",
      "text-secondary": "#94a3b8",
      "border": "#1e3a2a",
    },
  },
  ocean: {
    name: "Ocean Blue",
    nameAr: "أزرق المحيط",
    light: {
      "primary": "#0ea5e9",
      "accent": "#06b6d4",
      "background": "#f0f9ff",
      "card": "#ffffff",
      "sidebar": "#e0f2fe",
      "text-primary": "#0c4a6e",
      "text-secondary": "#64748b",
      "border": "#bae6fd",
    },
    dark: {
      "primary": "#38bdf8",
      "accent": "#22d3ee",
      "background": "#0c1929",
      "card": "#12233d",
      "sidebar": "#0a1525",
      "text-primary": "#e0f2fe",
      "text-secondary": "#94a3b8",
      "border": "#1e3a5f",
    },
  },
  sunset: {
    name: "Sunset Orange",
    nameAr: "برتقالي الغروب",
    light: {
      "primary": "#f97316",
      "accent": "#ef4444",
      "background": "#fff7ed",
      "card": "#ffffff",
      "sidebar": "#ffedd5",
      "text-primary": "#7c2d12",
      "text-secondary": "#78716c",
      "border": "#fed7aa",
    },
    dark: {
      "primary": "#fb923c",
      "accent": "#f87171",
      "background": "#1a120c",
      "card": "#231812",
      "sidebar": "#150e08",
      "text-primary": "#ffedd5",
      "text-secondary": "#a8a29e",
      "border": "#3d2517",
    },
  },
  rose: {
    name: "Rose Garden",
    nameAr: "حديقة الورد",
    light: {
      "primary": "#e11d48",
      "accent": "#f43f5e",
      "background": "#fff1f2",
      "card": "#ffffff",
      "sidebar": "#ffe4e6",
      "text-primary": "#881337",
      "text-secondary": "#78716c",
      "border": "#fecdd3",
    },
    dark: {
      "primary": "#fb7185",
      "accent": "#f43f5e",
      "background": "#1a0c10",
      "card": "#231218",
      "sidebar": "#150a0e",
      "text-primary": "#ffe4e6",
      "text-secondary": "#a8a29e",
      "border": "#3d1725",
    },
  },
  violet: {
    name: "Royal Violet",
    nameAr: "بنفسجي ملكي",
    light: {
      "primary": "#8b5cf6",
      "accent": "#a78bfa",
      "background": "#f5f3ff",
      "card": "#ffffff",
      "sidebar": "#ede9fe",
      "text-primary": "#4c1d95",
      "text-secondary": "#6b7280",
      "border": "#ddd6fe",
    },
    dark: {
      "primary": "#a78bfa",
      "accent": "#c4b5fd",
      "background": "#140e1f",
      "card": "#1c1430",
      "sidebar": "#100a18",
      "text-primary": "#ede9fe",
      "text-secondary": "#9ca3af",
      "border": "#2d2050",
    },
  },
  amber: {
    name: "Golden Amber",
    nameAr: "العنبر الذهبي",
    light: {
      "primary": "#d97706",
      "accent": "#f59e0b",
      "background": "#fffbeb",
      "card": "#ffffff",
      "sidebar": "#fef3c7",
      "text-primary": "#78350f",
      "text-secondary": "#78716c",
      "border": "#fde68a",
    },
    dark: {
      "primary": "#fbbf24",
      "accent": "#f59e0b",
      "background": "#1a150c",
      "card": "#231c10",
      "sidebar": "#151008",
      "text-primary": "#fef3c7",
      "text-secondary": "#a8a29e",
      "border": "#3d3017",
    },
  },
  forest: {
    name: "Deep Forest",
    nameAr: "الغابة العميقة",
    light: {
      "primary": "#16a34a",
      "accent": "#22c55e",
      "background": "#f0fdf4",
      "card": "#ffffff",
      "sidebar": "#dcfce7",
      "text-primary": "#14532d",
      "text-secondary": "#6b7280",
      "border": "#bbf7d0",
    },
    dark: {
      "primary": "#4ade80",
      "accent": "#22c55e",
      "background": "#0c1a10",
      "card": "#122318",
      "sidebar": "#0a150d",
      "text-primary": "#dcfce7",
      "text-secondary": "#9ca3af",
      "border": "#1e3d25",
    },
  },
  midnight: {
    name: "Midnight Slate",
    nameAr: "الإردوازي",
    light: {
      "primary": "#475569",
      "accent": "#64748b",
      "background": "#f8fafc",
      "card": "#ffffff",
      "sidebar": "#f1f5f9",
      "text-primary": "#0f172a",
      "text-secondary": "#64748b",
      "border": "#e2e8f0",
    },
    dark: {
      "primary": "#94a3b8",
      "accent": "#cbd5e1",
      "background": "#0f172a",
      "card": "#1e293b",
      "sidebar": "#0c1220",
      "text-primary": "#f1f5f9",
      "text-secondary": "#94a3b8",
      "border": "#334155",
    },
  },
};

export async function GET() {
  try {
    const configs = await db.themeConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const config of configs) {
      configMap[config.key] = config.value;
    }

    const activeTheme = configMap["active-theme"] || "default";
    const preset = THEME_PRESETS[activeTheme] || THEME_PRESETS.default;

    return NextResponse.json({
      activeTheme,
      presets: Object.entries(THEME_PRESETS).map(([key, val]) => ({
        key,
        name: val.name,
        nameAr: val.nameAr,
        light: val.light,
        dark: val.dark,
      })),
      currentTheme: {
        key: activeTheme,
        name: preset.name,
        nameAr: preset.nameAr,
        light: preset.light,
        dark: preset.dark,
      },
      customOverrides: configMap,
    });
  } catch (error) {
    console.error("Get theme error:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, requesterId, themeKey, lightColors, darkColors } = body;

    if (!requesterId) {
      return NextResponse.json(
        { error: "requesterId is required" },
        { status: 400 }
      );
    }

    // Verify role — only admin (1) and moderator (2) can edit themes
    const requester = await db.user.findUnique({ where: { id: requesterId } });
    if (!requester || (requester.role !== "admin" && requester.role !== "moderator")) {
      return NextResponse.json(
        { error: "صلاحية المدير أو المشرف مطلوبة لتعديل المظهر" },
        { status: 403 }
      );
    }

    switch (action) {
      case "apply-theme": {
        // Apply a preset theme site-wide
        if (!themeKey || !THEME_PRESETS[themeKey]) {
          return NextResponse.json(
            { error: "مظهر غير صالح" },
            { status: 400 }
          );
        }

        await db.themeConfig.upsert({
          where: { key: "active-theme" },
          update: { value: themeKey },
          create: { key: "active-theme", value: themeKey },
        });

        // Clear any custom overrides when switching presets
        const overrideKeys = ["primary", "accent", "background", "card", "sidebar", "text-primary", "text-secondary", "border"];
        for (const k of overrideKeys) {
          const existing = await db.themeConfig.findUnique({ where: { key: `override-light-${k}` } });
          if (existing) await db.themeConfig.delete({ where: { key: `override-light-${k}` } });
          const existingDark = await db.themeConfig.findUnique({ where: { key: `override-dark-${k}` } });
          if (existingDark) await db.themeConfig.delete({ where: { key: `override-dark-${k}` } });
        }

        // Log the action
        await db.auditLog.create({
          data: {
            actorId: requesterId,
            action: "apply-theme",
            targetType: "theme",
            targetId: themeKey,
            details: `Applied theme: ${THEME_PRESETS[themeKey].nameAr}`,
          },
        });

        return NextResponse.json({
          success: true,
          message: `تم تطبيق مظهر "${THEME_PRESETS[themeKey].nameAr}" بنجاح`,
          activeTheme: themeKey,
        });
      }

      case "update-colors": {
        // Update individual colors (light and/or dark)
        const updates: Record<string, string> = {};

        if (lightColors) {
          for (const [key, value] of Object.entries(lightColors)) {
            if (typeof value === "string") {
              updates[`override-light-${key}`] = value;
            }
          }
        }

        if (darkColors) {
          for (const [key, value] of Object.entries(darkColors)) {
            if (typeof value === "string") {
              updates[`override-dark-${key}`] = value;
            }
          }
        }

        for (const [key, value] of Object.entries(updates)) {
          await db.themeConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          });
        }

        await db.auditLog.create({
          data: {
            actorId: requesterId,
            action: "update-theme-colors",
            targetType: "theme",
            targetId: "custom",
            details: "Updated custom theme colors",
          },
        });

        return NextResponse.json({
          success: true,
          message: "تم تحديث ألوان المظهر بنجاح",
        });
      }

      default:
        return NextResponse.json(
          { error: "إجراء غير صالح" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Update theme error:", error);
    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 }
    );
  }
}
