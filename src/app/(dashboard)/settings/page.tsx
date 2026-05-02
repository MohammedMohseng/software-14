"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Mail,
  Shield,
  FileText,
  Sun,
  Moon,
  Monitor,
  Lock,
  LogOut,
  Edit3,
  Save,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionWrapper } from "@/components/sections";
import { useAppStore, type UserRole } from "@/stores/app-store";
import { toast } from "sonner";

const roleLabels: Record<UserRole, string> = {
  admin: "مدير",
  moderator: "مشرف",
  professor: "أستاذ",
  student: "طالب",
  visitor: "زائر",
};

const roleBadgeClasses: Record<UserRole, string> = {
  admin: "bg-emerald-600 text-white",
  moderator: "bg-teal-500 text-white",
  professor: "bg-amber-500 text-white",
  student: "bg-primary/15 text-primary",
  visitor: "bg-muted text-muted-foreground",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { currentUser } = useAppStore();
  const { theme, setTheme } = useTheme();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim(),
          requesterId: currentUser.id,
        }),
      });
      if (res.ok) {
        toast.success("تم تحديث الملف الشخصي بنجاح");
        setIsEditingProfile(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل تحديث الملف الشخصي");
      }
    } catch {
      toast.error("حدث خطأ أثناء التحديث");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser) return;
    if (!currentPassword) {
      toast.error("يرجى إدخال كلمة المرور الحالية");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          requesterId: currentUser.id,
        }),
      });
      if (res.ok) {
        toast.success("تم تغيير كلمة المرور بنجاح");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        toast.error(data.error || "فشل تغيير كلمة المرور");
      }
    } catch {
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setChangingPassword(false);
    }
  };

  const userRole = currentUser?.role || "visitor";

  return (
    <SectionWrapper title="الإعدادات" icon={Settings}>
      {/* Profile Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              الملف الشخصي
            </CardTitle>
            {!isEditingProfile ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditName(currentUser?.name || "");
                  setEditBio(currentUser?.bio || "");
                  setIsEditingProfile(true);
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                تعديل
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(false)}
                >
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  حفظ
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingProfile ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="أدخل اسمك"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">نبذة عني</label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="اكتب نبذة مختصرة عنك..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary text-xl font-bold">
                  {currentUser?.name?.charAt(0) || "م"}
                </div>
                <div>
                  <p className="text-lg font-semibold">{currentUser?.name || "مستخدم"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${roleBadgeClasses[userRole]} border-0 text-[10px]`}>
                      {roleLabels[userRole]}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="text-sm font-medium">{currentUser?.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">الدور</p>
                    <p className="text-sm font-medium">{roleLabels[userRole]}</p>
                  </div>
                </div>
              </div>
              {currentUser?.bio && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">نبذة</p>
                    <p className="text-sm">{currentUser.bio}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Preferences */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            تفضيلات المظهر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light", label: "فاتح", icon: Sun },
              { value: "dark", label: "داكن", icon: Moon },
              { value: "system", label: "النظام", icon: Monitor },
            ].map((option) => {
              const isActive = theme === option.value;
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "outline"}
                  className={`flex flex-col items-center gap-2 h-auto py-4 ${
                    isActive ? "shadow-md" : ""
                  }`}
                  onClick={() => setTheme(option.value)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password Change */}
          <div className="space-y-3">
            <p className="text-sm font-medium">تغيير كلمة المرور</p>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="كلمة المرور الحالية"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="تأكيد كلمة المرور الجديدة"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {changingPassword ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              تحديث كلمة المرور
            </Button>
          </div>

          <Separator />

          {/* Sign Out */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">تسجيل الخروج</p>
              <p className="text-xs text-muted-foreground">
                تسجيل الخروج من حسابك الحالي
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              <LogOut className="h-3.5 w-3.5" />
              تسجيل الخروج
            </Button>
          </div>
        </CardContent>
      </Card>
    </SectionWrapper>
  );
}
