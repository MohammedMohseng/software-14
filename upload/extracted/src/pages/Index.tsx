import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Bot,
  GamepadIcon,
  Image as ImageIcon,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  BookOpenCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: ImageIcon,
    title: "معرض الوسائط",
    desc: "صور وذكريات منظّمة بألبومات، مع تكبير تفاعلي ورفع جماعي.",
    color: "from-primary to-primary-glow",
  },
  {
    icon: MessageSquareHeart,
    title: "الحائط الاجتماعي",
    desc: "شارك ذكرياتك مع الدفعة، وذكر أصدقاءك بـ @username.",
    color: "from-secondary to-secondary",
  },
  {
    icon: BookOpenCheck,
    title: "المكتبة الأكاديمية",
    desc: "محاضرات وملخصات PDF موثّقة من الأساتذة، وروابط تعليمية.",
    color: "from-success to-primary",
  },
  {
    icon: GamepadIcon,
    title: "منطقة الألعاب",
    desc: "Memory Match وTrivia مع لوحة متصدرين، وXO جماعي مباشر.",
    color: "from-warning to-secondary",
  },
  {
    icon: Bot,
    title: "المساعد الذكي",
    desc: "ابحث في الموقع، ولخّص النصوص الطويلة بلغة طبيعية.",
    color: "from-primary to-secondary",
  },
  {
    icon: ShieldCheck,
    title: "نظام أدوار محكم",
    desc: "5 مستويات: زائر، عضو، أستاذ، مشرف، أدمن — مع صلاحيات دقيقة.",
    color: "from-secondary to-primary",
  },
];

const stats = [
  { value: "5", label: "مستويات صلاحية" },
  { value: "6", label: "وحدات أساسية" },
  { value: "∞", label: "ذكريات مشتركة" },
  { value: "1", label: "دفعة واحدة" },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="container relative pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              SOFTWARE · BATCH 14 · PLATFORM v1.0
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
              <span className="block">منصة دفعة</span>
              <span className="block gradient-text">14 برمجيات</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              مساحة موحّدة تجمع <span className="text-foreground font-semibold">الذكريات</span>،
              <span className="text-foreground font-semibold"> المحاضرات</span>،
              <span className="text-foreground font-semibold"> الألعاب</span>،
              ومساعداً ذكياً يخدم الدفعة على مدار الساعة.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              {user ? (
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground glow-primary">
                  <Link to="/profile">
                    اذهب إلى ملفك
                    <ArrowLeft className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground glow-primary">
                    <Link to="/auth?mode=signup">
                      انضم إلى الدفعة
                      <ArrowLeft className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary/30">
                    <Link to="/auth">تسجيل الدخول</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-4">
                  <div className="text-3xl font-black gradient-text">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-mono mb-3">
            <Users className="h-3.5 w-3.5" />
            MODULES
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">كل ما تحتاجه دفعة واحدة</h2>
          <p className="text-muted-foreground mt-3">
            ست وحدات متكاملة مصممة خصيصاً لتجربة طلابية حديثة، بصلاحيات ذكية لكل دور.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Card
              key={i}
              className="group relative overflow-hidden border-border/60 bg-card/60 backdrop-blur hover:border-primary/40 transition-all duration-300"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${f.color}`} />
              <CardContent className="p-6 relative">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-4`}>
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 p-10 md:p-16 text-center">
          <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold">
              جاهز تكون جزءاً من <span className="gradient-text">القصة</span>؟
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              أنشئ حسابك خلال ثوانٍ، واحصل على دور <span className="text-primary font-semibold">عضو</span> فوراً للوصول لكل الميزات.
            </p>
            {!user && (
              <Button asChild size="lg" className="mt-8 bg-gradient-to-r from-primary to-secondary text-primary-foreground glow-primary">
                <Link to="/auth?mode=signup">
                  ابدأ الآن مجاناً
                  <ArrowLeft className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} دفعة 14 برمجيات. صُنع بحب 💙</p>
          <p className="font-mono text-xs">SOFTWARE · BATCH 14 · v1.0</p>
        </div>
      </footer>
    </div>
  );
}
