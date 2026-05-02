import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Download, Edit, FolderPlus, Loader2, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import RoleManager from "./admin/RoleManager";

type Category = { id: string; name: string; description: string | null; icon: string | null };
type Question = {
  id: string;
  category_id: string;
  question: string;
  options: string[];
  correct_index: number;
  difficulty: string;
};

function CategoriesPanel({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("trivia_categories").insert({
      name: name.trim(),
      description: description.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast({ title: "تعذّر الإضافة", description: error.message, variant: "destructive" });
      return;
    }
    setName("");
    setDescription("");
    toast({ title: "تمت إضافة الفئة" });
    onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الفئة سيحذف كل أسئلتها. متابعة؟")) return;
    const { error } = await supabase.from("trivia_categories").delete().eq("id", id);
    if (error) {
      toast({ title: "تعذّر الحذف", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم الحذف" });
    onChange();
  };

  return (
    <Card className="bg-card/60 border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5 text-primary" />
          فئات الأسئلة
        </CardTitle>
        <CardDescription>أنشئ فئات لتنظيم بنك الأسئلة.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-2">
          <Input placeholder="اسم الفئة" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="الوصف (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="md:col-span-2"
          />
        </div>
        <Button onClick={add} disabled={busy || !name.trim()}>
          <Plus className="ms-1 h-4 w-4" />
          إضافة فئة
        </Button>

        <ul className="divide-y divide-border/60 mt-4">
          {categories.map((c) => (
            <li key={c.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                {c.description && (
                  <div className="text-xs text-muted-foreground truncate">{c.description}</div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => remove(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">لا توجد فئات بعد.</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function QuestionsPanel({
  categories,
  questions,
  onChange,
}: {
  categories: Category[];
  questions: Question[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState<Question | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const blank = (): Question => ({
    id: "",
    category_id: categories[0]?.id ?? "",
    question: "",
    options: ["", "", "", ""],
    correct_index: 0,
    difficulty: "medium",
  });

  const startNew = () => {
    if (categories.length === 0) {
      toast({ title: "أضف فئة أولاً", variant: "destructive" });
      return;
    }
    setEditing(blank());
    setOpen(true);
  };

  const startEdit = (q: Question) => {
    setEditing({ ...q, options: [...q.options] });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.question.trim() || editing.options.some((o) => !o.trim())) {
      toast({ title: "املأ السؤال وكل الخيارات", variant: "destructive" });
      return;
    }
    const payload = {
      category_id: editing.category_id,
      question: editing.question.trim(),
      options: editing.options.map((o) => o.trim()),
      correct_index: editing.correct_index,
      difficulty: editing.difficulty,
    };
    const { error } = editing.id
      ? await supabase.from("trivia_questions").update(payload).eq("id", editing.id)
      : await supabase.from("trivia_questions").insert(payload);
    if (error) {
      toast({ title: "تعذّر الحفظ", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing.id ? "تم التحديث" : "تمت الإضافة" });
    setOpen(false);
    setEditing(null);
    onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا السؤال؟")) return;
    const { error } = await supabase.from("trivia_questions").delete().eq("id", id);
    if (error) {
      toast({ title: "تعذّر الحذف", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم الحذف" });
    onChange();
  };

  const filtered = filter === "all" ? questions : questions.filter((q) => q.category_id === filter);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <Card className="bg-card/60 border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-wrap gap-2">
        <div>
          <CardTitle>بنك الأسئلة ({questions.length})</CardTitle>
          <CardDescription>أضف، عدّل، احذف، أو استورد أسئلة عبر JSON.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            id="trivia-json-input"
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                const items = Array.isArray(parsed) ? parsed : parsed.questions;
                if (!Array.isArray(items)) throw new Error("الملف يجب أن يحتوي مصفوفة أسئلة");

                const catByName = new Map(categories.map((c) => [c.name.trim(), c.id]));
                const rows: any[] = [];
                const errors: string[] = [];

                for (let i = 0; i < items.length; i++) {
                  const it = items[i];
                  const catId =
                    it.category_id ||
                    (it.category ? catByName.get(String(it.category).trim()) : null);
                  if (!catId) {
                    errors.push(`#${i + 1}: فئة غير معروفة (${it.category ?? "—"})`);
                    continue;
                  }
                  const opts = Array.isArray(it.options) ? it.options.map((o: any) => String(o)) : [];
                  if (opts.length < 2) {
                    errors.push(`#${i + 1}: يجب توفير خيارين على الأقل`);
                    continue;
                  }
                  let correct = Number(it.correct_index);
                  if (isNaN(correct) && it.answer) {
                    correct = opts.findIndex((o: string) => o.trim() === String(it.answer).trim());
                  }
                  if (correct < 0 || correct >= opts.length) {
                    errors.push(`#${i + 1}: correct_index غير صحيح`);
                    continue;
                  }
                  if (!it.question || !String(it.question).trim()) {
                    errors.push(`#${i + 1}: نص السؤال مفقود`);
                    continue;
                  }
                  rows.push({
                    category_id: catId,
                    question: String(it.question).trim(),
                    options: opts,
                    correct_index: correct,
                    difficulty: ["easy", "medium", "hard"].includes(it.difficulty)
                      ? it.difficulty
                      : "medium",
                  });
                }

                if (rows.length === 0) {
                  toast({
                    title: "لم يُستورد أي سؤال",
                    description: errors.slice(0, 3).join(" · ") || "تحقق من تنسيق الملف",
                    variant: "destructive",
                  });
                  return;
                }
                const { error } = await supabase.from("trivia_questions").insert(rows);
                if (error) {
                  toast({ title: "تعذّر الاستيراد", description: error.message, variant: "destructive" });
                  return;
                }
                toast({
                  title: `تم استيراد ${rows.length} سؤال`,
                  description: errors.length ? `تخطّي ${errors.length} عنصر` : undefined,
                });
                onChange();
              } catch (err: any) {
                toast({ title: "JSON غير صالح", description: err.message, variant: "destructive" });
              }
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              const sample = [
                {
                  category: categories[0]?.name ?? "اسم الفئة",
                  question: "ما هو ناتج 2 + 2؟",
                  options: ["3", "4", "5", "22"],
                  correct_index: 1,
                  difficulty: "easy",
                },
                {
                  category: categories[0]?.name ?? "اسم الفئة",
                  question: "عاصمة فرنسا؟",
                  options: ["لندن", "برلين", "باريس", "روما"],
                  answer: "باريس",
                  difficulty: "medium",
                },
              ];
              const blob = new Blob([JSON.stringify(sample, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "trivia-template.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="ms-1 h-4 w-4" />
            قالب JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("trivia-json-input")?.click()}
          >
            <Upload className="ms-1 h-4 w-4" />
            استيراد JSON
          </Button>
          <Button onClick={startNew}>
            <Plus className="ms-1 h-4 w-4" />
            سؤال جديد
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            الكل
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={filter === c.id ? "default" : "outline"}
              onClick={() => setFilter(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <ul className="divide-y divide-border/60">
          {filtered.map((q) => (
            <li key={q.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">{catName(q.category_id)}</Badge>
                  <Badge variant="outline" className="text-[10px]">{q.difficulty}</Badge>
                </div>
                <div className="font-medium">{q.question}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ✓ {q.options[q.correct_index]}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => startEdit(q)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(q.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">لا توجد أسئلة.</p>
          )}
        </ul>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editing?.id ? "تعديل سؤال" : "سؤال جديد"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>الفئة</Label>
                <Select
                  value={editing.category_id}
                  onValueChange={(v) => setEditing({ ...editing, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>السؤال</Label>
                <Textarea
                  rows={2}
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>الخيارات (اختر الإجابة الصحيحة)</Label>
                {editing.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, correct_index: i })}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        editing.correct_index === i
                          ? "bg-success border-success text-success-foreground"
                          : "border-border"
                      }`}
                      aria-label="الإجابة الصحيحة"
                    >
                      {editing.correct_index === i ? "✓" : ""}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const arr = [...editing.options];
                        arr[i] = e.target.value;
                        setEditing({ ...editing, options: arr });
                      }}
                      placeholder={`الخيار ${i + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>الصعوبة</Label>
                <Select
                  value={editing.difficulty}
                  onValueChange={(v) => setEditing({ ...editing, difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">سهل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="hard">صعب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: rolesLoading } = useUserRoles();
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const loadTrivia = async () => {
    const [{ data: cats }, { data: qs }] = await Promise.all([
      supabase.from("trivia_categories").select("*").order("name"),
      supabase.from("trivia_questions").select("*").order("created_at", { ascending: false }),
    ]);
    setCategories((cats ?? []) as Category[]);
    setQuestions(
      ((qs ?? []) as any[]).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
      })) as Question[],
    );
  };

  useEffect(() => {
    if (isAdmin || isModerator) loadTrivia();
  }, [isAdmin, isModerator]);

  if (authLoading || rolesLoading) {
    return (
      <>
        <Navbar />
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!user || (!isAdmin && !isModerator)) {
    return (
      <>
        <Navbar />
        <div className="container py-20 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-semibold">ممنوع الوصول</h2>
          <p className="text-muted-foreground">هذه الصفحة مخصصة للأدمن والمشرفين.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-mono mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            ADMIN PANEL
          </div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        </div>

        <Tabs defaultValue={isAdmin ? "roles" : "questions"}>
          <TabsList className="grid grid-cols-3 max-w-lg">
            {isAdmin && <TabsTrigger value="roles">الأدوار</TabsTrigger>}
            <TabsTrigger value="categories">فئات الأسئلة</TabsTrigger>
            <TabsTrigger value="questions">بنك الأسئلة</TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="roles" className="mt-6">
              <RoleManager />
            </TabsContent>
          )}

          <TabsContent value="categories" className="mt-6">
            <CategoriesPanel categories={categories} onChange={loadTrivia} />
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <QuestionsPanel categories={categories} questions={questions} onChange={loadTrivia} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
