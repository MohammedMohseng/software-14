"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  GraduationCap,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const roles = [
  { value: "student", label: "طالب", icon: GraduationCap, color: "text-primary" },
  { value: "professor", label: "أستاذ", icon: BookOpen, color: "text-amber-500" },
  { value: "visitor", label: "زائر", icon: User, color: "text-muted-foreground" },
];

function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!name.trim()) {
        setError("يرجى إدخال الاسم");
        return;
      }

      if (!email.trim()) {
        setError("يرجى إدخال البريد الإلكتروني");
        return;
      }

      if (password.length < 6) {
        setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
      }

      if (password !== confirmPassword) {
        setError("كلمة المرور غير متطابقة");
        return;
      }

      setIsLoading(true);

      try {
        // Register the user
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
          }),
        });

        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          setError(registerData.error || "فشل إنشاء الحساب");
          setIsLoading(false);
          return;
        }

        // Auto sign-in after registration
        const result = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        });

        if (result?.ok) {
          router.push("/dashboard");
        } else {
          // Registration succeeded but auto-login failed — go to login page
          router.push("/auth/login?registered=true");
        }
      } catch {
        setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى");
        setIsLoading(false);
      }
    },
    [name, email, password, confirmPassword, role, router]
  );

  const handleGoogleSignIn = useCallback(() => {
    signIn("google", { callbackUrl: "/dashboard" });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="glass border-white/20 dark:border-white/10 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary/40 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold bg-gradient-to-l from-primary via-primary/80 to-teal-500 bg-clip-text text-transparent">
                إنشاء حساب جديد
              </h1>
              <p className="text-sm text-muted-foreground">
                انضم إلى منصة Software-14
              </p>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="relative"
            >
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pr-10 pl-3 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                autoComplete="name"
                disabled={isLoading}
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="relative"
            >
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10 pl-3 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                dir="ltr"
                autoComplete="email"
                disabled={isLoading}
              />
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="relative"
            >
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="كلمة المرور (6 أحرف على الأقل)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                dir="ltr"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="relative"
            >
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="تأكيد كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                dir="ltr"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </motion.div>

            {/* Role Selection */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <Label className="text-sm font-medium mb-2 block">الدور</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => {
                  const isActive = role === r.value;
                  const Icon = r.icon;
                  return (
                    <Button
                      key={r.value}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      className={`flex flex-col items-center gap-1.5 h-auto py-3 ${
                        isActive ? "shadow-md" : ""
                      }`}
                      onClick={() => setRole(r.value)}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "" : r.color}`} />
                      <span className="text-xs font-medium">{r.label}</span>
                    </Button>
                  );
                })}
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-gradient-to-l from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75 shadow-md shadow-primary/20 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارٍ إنشاء الحساب...
                  </span>
                ) : (
                  "إنشاء حساب"
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">أو</span>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <Button
            variant="outline"
            className="w-full h-11 gap-2 border-border/50 hover:bg-accent/50"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>التسجيل بحساب Google</span>
          </Button>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              تسجيل الدخول
              <ArrowRight className="inline h-3.5 w-3.5 mr-1" />
            </Link>
          </p>
        </CardContent>
      </Card>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-xs text-muted-foreground mt-6"
      >
        Software-14 &copy; {new Date().getFullYear()} — جميع الحقوق محفوظة
      </motion.p>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
