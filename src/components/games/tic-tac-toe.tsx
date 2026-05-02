"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Trophy, X, Circle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Cell = "X" | "O" | "-";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinner(b: Cell[]): { result: "X" | "O" | "draw" | null; line: number[] | null } {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] !== "-" && b[a] === b[c] && b[c] === b[d]) {
      return { result: b[a] as "X" | "O", line: [a, c, d] };
    }
  }
  if (b.every((x) => x !== "-")) return { result: "draw", line: null };
  return { result: null, line: null };
}

interface TicTacToeGameProps {
  onScore: (score: number) => void;
}

export default function TicTacToeGame({ onScore }: TicTacToeGameProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill("-"));
  const [thinking, setThinking] = useState(false);
  const [winner, setWinner] = useState<{ result: "X" | "O" | "draw" | null; line: number[] | null }>({ result: null, line: null });
  const [reported, setReported] = useState(false);
  const [scoreEarned, setScoreEarned] = useState<number | null>(null);

  const playAi = useCallback(async (current: Cell[]) => {
    setThinking(true);
    try {
      const boardStr = current.join("");
      const res = await fetch("/api/games/tictactoe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: boardStr }),
      });
      const data = await res.json();
      let mv = parseInt(String(data.move ?? ""), 10);
      if (isNaN(mv) || current[mv] !== "-") {
        mv = current.findIndex((c) => c === "-");
      }
      if (mv >= 0) {
        const next = [...current];
        next[mv] = "O";
        setBoard(next);
        const w = getWinner(next);
        if (w.result) setWinner(w);
      }
    } catch {
      toast.error("AI move failed. Try again.");
    } finally {
      setThinking(false);
    }
  }, []);

  const click = (i: number) => {
    if (thinking || winner.result || board[i] !== "-") return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    const w = getWinner(next);
    if (w.result) {
      setWinner(w);
      return;
    }
    setTimeout(() => playAi(next), 300);
  };

  useEffect(() => {
    if (winner.result && !reported) {
      let s = 0;
      if (winner.result === "X") s = 500;
      else if (winner.result === "draw") s = 200;
      else s = 50;
      setScoreEarned(s);
      onScore(s);
      setReported(true);
    }
  }, [winner, reported, onScore]);

  const reset = () => {
    setBoard(Array(9).fill("-"));
    setWinner({ result: null, line: null });
    setReported(false);
    setScoreEarned(null);
  };

  const isWinningCell = (i: number) => winner.line?.includes(i) ?? false;

  return (
    <div className="max-w-sm mx-auto">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {winner.result === "X" && (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
              <Trophy className="h-3 w-3" /> You Win!
            </Badge>
          )}
          {winner.result === "O" && (
            <Badge className="bg-red-500/15 text-red-600 border-red-500/30 gap-1">
              <X className="h-3 w-3" /> You Lose
            </Badge>
          )}
          {winner.result === "draw" && (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1">
              Draw!
            </Badge>
          )}
          {!winner.result && thinking && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> AI Thinking...
            </Badge>
          )}
          {!winner.result && !thinking && (
            <Badge variant="outline" className="gap-1">
              <Circle className="h-3 w-3" /> Your Turn (X)
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {board.map((c, i) => (
          <motion.button
            key={i}
            onClick={() => click(i)}
            disabled={!!winner.result || thinking || c !== "-"}
            initial={false}
            animate={{
              scale: isWinningCell(i) ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.4, repeat: isWinningCell(i) ? Infinity : 0 }}
            className={`aspect-square rounded-xl text-4xl font-bold flex items-center justify-center transition-all duration-200 ${
              c === "-"
                ? "bg-card border-2 border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                : isWinningCell(i)
                ? "bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-600 dark:text-emerald-400"
                : c === "X"
                ? "bg-primary/10 border-2 border-primary/40 text-primary"
                : "bg-red-500/10 border-2 border-red-500/40 text-red-500 dark:text-red-400"
            } ${c !== "-" ? "cursor-default" : ""}`}
          >
            <AnimatePresence mode="wait">
              {c === "X" && (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="font-black"
                >
                  X
                </motion.span>
              )}
              {c === "O" && (
                <motion.span
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="font-black"
                >
                  O
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Score Display */}
      <AnimatePresence>
        {scoreEarned !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
              <Trophy className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                +{scoreEarned} points earned!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Guide */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>Win: <span className="text-emerald-500 font-semibold">500</span></span>
        <span>Draw: <span className="text-amber-500 font-semibold">200</span></span>
        <span>Loss: <span className="text-red-500 font-semibold">50</span></span>
      </div>
    </div>
  );
}
