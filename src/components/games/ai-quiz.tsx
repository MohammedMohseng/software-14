"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Trophy, Sparkles, CheckCircle, XCircle, ArrowRight, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
};

const CATEGORIES: Category[] = [
  { id: "programming", name: "Programming", icon: "💻", description: "Code, algorithms & software" },
  { id: "general", name: "General Knowledge", icon: "🌍", description: "World facts & trivia" },
  { id: "mathematics", name: "Mathematics", icon: "🔢", description: "Numbers & logic" },
  { id: "religious", name: "Religious", icon: "📖", description: "Faith & knowledge" },
];

const QUESTIONS_PER_ROUND = 7;
const POINTS_PER_CORRECT = 100;

interface AIQuizProps {
  onScore: (score: number) => void;
}

export default function AIQuiz({ onScore }: AIQuizProps) {
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingQ, setLoadingQ] = useState(false);
  const [scoreEarned, setScoreEarned] = useState<number | null>(null);

  const fetchQuestion = useCallback(async (category: string): Promise<Question | null> => {
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (data.question && data.options && typeof data.correctIndex === "number") {
        return data as Question;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const startCategory = async (cat: Category) => {
    setLoading(true);
    setSelectedCat(cat);
    setCurrentIdx(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    setScoreEarned(null);

    // Fetch all questions
    const fetched: Question[] = [];
    for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
      const q = await fetchQuestion(cat.id);
      if (q) fetched.push(q);
    }

    if (fetched.length === 0) {
      toast.error("Failed to generate questions. Please try again.");
      setSelectedCat(null);
      setLoading(false);
      return;
    }

    setQuestions(fetched);
    setLoading(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = i === questions[currentIdx].correctIndex;
    const newScore = isCorrect ? score + POINTS_PER_CORRECT : score;
    if (isCorrect) setScore(newScore);

    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        setDone(true);
        setScoreEarned(newScore);
        onScore(newScore);
      } else {
        setCurrentIdx((x) => x + 1);
        setPicked(null);
      }
    }, 1000);
  };

  const retry = () => {
    if (selectedCat) startCategory(selectedCat);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating questions with AI...</p>
      </div>
    );
  }

  // Category Selection
  if (!selectedCat) {
    return (
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 mb-3">
            <Brain className="h-7 w-7 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold">AI Quiz Challenge</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {QUESTIONS_PER_ROUND} questions per round · {POINTS_PER_CORRECT} points each
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => startCategory(cat)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{cat.name}</div>
                  <div className="text-xs text-muted-foreground">{cat.description}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Results Screen
  if (done) {
    const maxScore = questions.length * POINTS_PER_CORRECT;
    const percentage = Math.round((score / maxScore) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <div className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <Trophy className="h-8 w-8 text-emerald-500" />
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-foreground">{score}</p>
          <p className="text-sm text-muted-foreground">
            {score} / {maxScore} ({percentage}%)
          </p>
          <Badge variant="outline" className="mt-1">
            {selectedCat.icon} {selectedCat.name}
          </Badge>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              +{scoreEarned} points!
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Button onClick={retry} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => setSelectedCat(null)} className="gap-1.5">
            <ArrowRight className="h-4 w-4" />
            Change Category
          </Button>
        </div>
      </motion.div>
    );
  }

  // Question Screen
  if (questions.length === 0) return null;

  const q = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress & Score */}
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline">
          {selectedCat.icon} {selectedCat.name} · Q{currentIdx + 1}/{questions.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          Score: <span className="text-primary font-bold">{score}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border/50 mb-5">
          <CardContent className="p-5">
            <p className="text-base sm:text-lg font-semibold leading-relaxed">{q.question}</p>
          </CardContent>
        </Card>

        {/* Options */}
        <div className="grid gap-3">
          {q.options.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = i === q.correctIndex;
            const showResult = picked !== null;

            return (
              <motion.button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                whileHover={!showResult ? { scale: 1.01 } : {}}
                whileTap={!showResult ? { scale: 0.99 } : {}}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                  showResult && isCorrect
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : showResult && isPicked
                    ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                    : showResult
                    ? "border-border bg-muted/50 opacity-50"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-muted text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-sm">{opt}</span>
                {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
                {showResult && isPicked && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
