import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles, AppRole } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import Navbar from "@/components/Navbar";

const profileSchema = z.object({
  username: z.string().trim().min(3, "اسم المستخدم قصير").max(30, "طويل جداً"),
  full_name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(280, "النبذة طويلة جداً").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  avatar_url: z.string().trim().url("رابط غير صالح").max(500).optional().or(z.literal("")),
  major: z.string().trim().max(80).optional().or(z.literal("")),
  academic_year: z.string().trim().max(20).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  github_url: z.string().trim().url("رابط GitHub غير صالح").max(200).optional().or(z.literal("")),
  linkedin_url: z.string().trim().url("رابط LinkedIn غير صالح").max(200).optional().or(z.literal("")),
  interests: z.string().trim().max(200).optional().or(z.literal("")),
  skills: z.string().trim().max(200).optional().or(z.literal("")),
});

const roleLabels: Record<AppRole, string> = {
  visitor: "زائر",
  member: "عضو",
  professor: "أستاذ",
  moderator: "مشرف",
  admin: "أدمن",
};

const roleColors: Record<AppRole, string> = {
  visitor: "bg-muted text-muted-foreground",
  member: "bg-primary/15 text-primary border-primary/30",
  professor: "bg-success/15 text-success border-success/30",
  moderator: "bg-warning/15 text-warning border-warning/30",
  admin: "bg-secondary/15 text-secondary border-secondary/30",
};

export default function Profile() {
  const { user } = useAuth();
  const { roles } = useUserRoles();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    bio: "",
    phone: "",
    avatar_url: "",
    major: "",
    academic_year: "",
    location: "",
    github_url: "",
    linkedin_url: "",
    interests: "",
    skills: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            username: data.username ?? "",
            full_name: data.full_name ?? "",
            bio: data.bio ?? "",
            phone: data.phone ?? "",
            avatar_url: data.avatar_url ?? "",
            major: (data as any).major ?? "",
            academic_year: (data as any).academic_year ?? "",
            location: (data as any).location ?? "",
            github_url: (data as any).github_url ?? "",
            linkedin_url: (data as any).linkedin_url ?? "",
            interests: ((data as any).interests ?? []).join(", "),
            skills: ((data as any).skills ?? []).join(", "),
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const parsed = profileSchema.parse(form);
      const toArr = (s?: string) =>
        s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
      const { error } = await supabase
        .from("profiles")
        .update({
          username: parsed.username,
          full_name: parsed.full_name,
          bio: parsed.bio || null,
          phone: parsed.phone || null,
          avatar_url: parsed.avatar_url || null,
          major: parsed.major || null,
          academic_year: parsed.academic_year || null,
          location: parsed.location || null,
          github_url: parsed.github_url || null,
          linkedin_url: parsed.linkedin_url || null,
          interests: toArr(parsed.interests),
          skills: toArr(parsed.skills),
        })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "تم الحفظ", description: "تم تحديث ملفك الشخصي بنجاح" });
    } catch (err: any) {
      const message = err?.errors?.[0]?.message || err?.message || "خطأ أثناء الحفظ";
      toast({ title: "خطأ", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const initials = (form.full_name || form.username || "؟").trim().slice(0, 2);

  return (
    <>
      <Navbar />
      <main className="container max-w-3xl py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">الملف الشخصي</h1>
          <p className="text-muted-foreground mt-1">أدر معلوماتك المعروضة لبقية أعضاء الدفعة</p>
        </div>

        <Card className="mb-6 bg-card/60 backdrop-blur border-border/60">
          <CardContent className="pt-6 flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-2 ring-primary/30">
              <AvatarImage src={form.avatar_url} alt={form.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold truncate">{form.full_name || "بدون اسم"}</h2>
              <p className="text-sm text-muted-foreground truncate">@{form.username || "username"}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roles.length === 0 ? (
                  <Badge variant="outline">لا أدوار بعد</Badge>
                ) : (
                  roles.map((r) => (
                    <Badge key={r} variant="outline" className={roleColors[r]}>
                      {roleLabels[r]}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/60">
          <CardHeader>
            <CardTitle>تعديل المعلومات</CardTitle>
            <CardDescription>هذه المعلومات ستظهر في بطاقتك العامة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل</Label>
                  <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input id="username" dir="ltr" className="text-left" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">رابط الصورة الشخصية</Label>
                <Input id="avatar_url" dir="ltr" className="text-left" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">التخصص</Label>
                  <Input id="major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} placeholder="هندسة برمجيات" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year">السنة الدراسية</Label>
                  <Input id="academic_year" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="السنة الرابعة" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">الموقع / المدينة</Label>
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="غزة، فلسطين" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" dir="ltr" className="text-left" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+970..." />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub</Label>
                  <Input id="github_url" dir="ltr" className="text-left" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <Input id="linkedin_url" dir="ltr" className="text-left" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">المهارات (افصل بفاصلة)</Label>
                <Input id="skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, Python" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">الاهتمامات (افصل بفاصلة)</Label>
                <Input id="interests" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="ذكاء اصطناعي, ألعاب, تصميم" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">نبذة عنك</Label>
                <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="من أنت؟ ما اهتماماتك؟" />
              </div>

              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                {saving ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Save className="ms-2 h-4 w-4" />}
                حفظ التغييرات
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
