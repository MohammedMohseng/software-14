import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Code2, Loader2 } from "lucide-react";

const emailSchema = z.string().trim().email("بريد إلكتروني غير صالح").max(255);
const passwordSchema = z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(72);
const nameSchema = z.string().trim().min(2, "الاسم قصير جداً").max(80);

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [tab, setTab] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsedEmail = emailSchema.parse(email);
      const parsedPassword = passwordSchema.parse(password);

      if (tab === "signup") {
        const parsedName = nameSchema.parse(fullName);
        const { error } = await supabase.auth.signUp({
          email: parsedEmail,
          password: parsedPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: parsedName },
          },
        });
        if (error) throw error;
        toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في دفعة 14 🎉" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsedEmail,
          password: parsedPassword,
        });
        if (error) throw error;
        toast({ title: "تم تسجيل الدخول", description: "أهلاً بعودتك 👋" });
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.message ||
        err?.message ||
        "حدث خطأ، حاول مرة أخرى";
      toast({ title: "خطأ", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/`,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast({ title: "تعذّر تسجيل الدخول عبر Google", description: err?.message ?? "حاول مرة أخرى", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary glow-primary">
            <Code2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold gradient-text">دفعة 14 برمجيات</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">SOFTWARE · BATCH 14</p>
          </div>
        </Link>

        <Card className="border-border/60 bg-card/60 backdrop-blur-xl shadow-card">
          <CardHeader>
            <CardTitle>الوصول إلى المنصة</CardTitle>
            <CardDescription>سجّل دخولك أو أنشئ حساباً جديداً للانضمام إلى الدفعة</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">حساب جديد</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">البريد الإلكتروني</Label>
                    <Input
                      id="email-login"
                      type="email"
                      dir="ltr"
                      className="text-left"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">كلمة المرور</Label>
                    <Input
                      id="password-login"
                      type="password"
                      dir="ltr"
                      className="text-left"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground" disabled={submitting}>
                    {submitting && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
                    دخول
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-signup">الاسم الكامل</Label>
                    <Input
                      id="name-signup"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: أحمد محمد"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">البريد الإلكتروني</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      dir="ltr"
                      className="text-left"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">كلمة المرور</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      dir="ltr"
                      className="text-left"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6 أحرف على الأقل"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground" disabled={submitting}>
                    {submitting && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
                    إنشاء الحساب
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">أو</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? (
                <Loader2 className="ms-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="ms-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
              )}
              المتابعة عبر Google
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          بإنشاء حسابك فأنت توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
}
