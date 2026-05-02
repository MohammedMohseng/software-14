import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy } from "lucide-react";

type Category = { id: string; name: string; description: string | null; icon: string | null };
type Question = {
  id: string;
  category_id: string;
  question: string;
  options: string[];
  correct_index: number;
  difficulty: string;
};

export default function TriviaGame({
  onScore,
}: {
  onScore: (score: number, meta: { category: string }) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase
      .from("trivia_categories")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setCategories((data ?? []) as Category[]);
        setLoading(false);
      });
  }, []);

  const startCategory = async (c: Category) => {
    setLoading(true);
    const { data } = await supabase
      .from("trivia_questions")
      .select("*")
      .eq("category_id", c.id);
    const shuffled = ((data ?? []) as any[])
      .map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 7);
    setQuestions(shuffled as Question[]);
    setSelectedCat(c);
    setIdx(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    setLoading(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === questions[idx].correct_index;
    if (correct) setScore((s) => s + 100);
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setDone(true);
        const finalScore = correct ? score + 100 : score;
        onScore(finalScore, { category: selectedCat?.name ?? "" });
      } else {
        setIdx((x) => x + 1);
        setPicked(null);
      }
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedCat) {
    return (
      <div>
        <h3 className="font-bold text-lg mb-1">اختر فئة الأسئلة</h3>
        <p className="text-sm text-muted-foreground mb-4">7 أسئلة عشوائية لكل جولة.</p>
        {categories.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            لا توجد فئات بعد. يمكن للأدمن إضافتها من لوحة التحكم.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => startCategory(c)}
                className="text-right p-4 rounded-lg border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="font-bold mb-1">{c.name}</div>
                {c.description && (
                  <div className="text-xs text-muted-foreground">{c.description}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">لا توجد أسئلة في هذه الفئة بعد.</p>
        <Button variant="outline" onClick={() => setSelectedCat(null)}>
          اختر فئة أخرى
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-warning mx-auto mb-3" />
        <p className="text-2xl font-bold">
          نتيجتك: <span className="gradient-text">{score}</span>
        </p>
        <p className="text-muted-foreground mt-2">
          من أصل {questions.length * 100} · فئة: {selectedCat.name}
        </p>
        <div className="flex justify-center gap-2 mt-6">
          <Button onClick={() => startCategory(selectedCat)}>
            <RefreshCw className="ms-1 h-4 w-4" />
            أعد المحاولة
          </Button>
          <Button variant="outline" onClick={() => setSelectedCat(null)}>
            تغيير الفئة
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline">
          {selectedCat.name} · سؤال {idx + 1}/{questions.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          النقاط: <span className="text-primary font-bold">{score}</span>
        </div>
      </div>
      <div className="text-lg md:text-xl font-bold mb-6 leading-relaxed">{q.question}</div>
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.correct_index;
          const showResult = picked !== null;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`text-start px-4 py-3 rounded-lg border transition-all ${
                showResult && isCorrect
                  ? "border-success bg-success/10 text-success"
                  : showResult && isPicked
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
