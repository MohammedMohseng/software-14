"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJIS = ["🚀", "💻", "🧠", "⚡", "🎮", "🌟", "🔥", "💎"];

type Card = {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
};

function shuffleDeck(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  return pairs
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

interface MemoryMatchProps {
  onScore: (score: number) => void;
}

export default function MemoryMatch({ onScore }: MemoryMatchProps) {
  const [deck, setDeck] = useState<Card[]>(shuffleDeck);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [scoreEarned, setScoreEarned] = useState<number | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const flippedRef = useRef<number[]>([]);
  const lockedRef = useRef(false);

  const flip = (id: number) => {
    if (lockedRef.current || done) return;
    const card = deck.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (flippedRef.current.length >= 2) return;

    // Flip the card
    const newDeck = deck.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setDeck(newDeck);
    flippedRef.current = [...flippedRef.current, id];

    if (flippedRef.current.length === 2) {
      const [a, b] = flippedRef.current;
      const newMoves = moves + 1;
      setMoves(newMoves);
      lockedRef.current = true;

      const ca = newDeck.find((c) => c.id === a)!;
      const cb = newDeck.find((c) => c.id === b)!;

      if (ca.emoji === cb.emoji) {
        // Match found
        const matchDeck = newDeck.map((c) =>
          c.id === a || c.id === b ? { ...c, matched: true } : c
        );
        setDeck(matchDeck);
        const newMatchedCount = matchedCount + 1;
        setMatchedCount(newMatchedCount);
        flippedRef.current = [];
        lockedRef.current = false;

        // Check if all matched
        if (newMatchedCount === 8) {
          setDone(true);
          const score = Math.max(100, 1000 - newMoves * 30);
          setScoreEarned(score);
          onScore(score);
        }
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setDeck((d) =>
            d.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c))
          );
          flippedRef.current = [];
          lockedRef.current = false;
        }, 700);
      }
    }
  };

  const reset = () => {
    setDeck(shuffleDeck());
    setMoves(0);
    setDone(false);
    setScoreEarned(null);
    setMatchedCount(0);
    flippedRef.current = [];
    lockedRef.current = false;
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Badge variant="outline">
            Moves: <span className="font-bold text-foreground ml-1">{moves}</span>
          </Badge>
          <Badge variant="outline">
            Pairs: <span className="font-bold text-emerald-500 ml-1">{matchedCount}/8</span>
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {deck.map((c) => (
          <motion.button
            key={c.id}
            onClick={() => flip(c.id)}
            initial={false}
            animate={{ rotateY: c.flipped || c.matched ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="aspect-square relative [perspective:600px]"
            disabled={done}
          >
            <div
              className={`absolute inset-0 rounded-xl flex items-center justify-center text-3xl sm:text-4xl transition-colors duration-200 ${
                c.flipped || c.matched
                  ? "bg-gradient-to-br from-primary/15 to-teal-500/15 border-2 border-primary/40"
                  : "bg-card border-2 border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
              } ${c.matched ? "opacity-60" : ""}`}
              style={{ backfaceVisibility: "hidden" as const, transform: c.flipped || c.matched ? "rotateY(180deg)" : "rotateY(0)" }}
            >
              <span style={{ transform: "rotateY(180deg)" }}>
                {c.flipped || c.matched ? c.emoji : ""}
              </span>
            </div>
            {/* Back of card */}
            {!(c.flipped || c.matched) && (
              <div
                className="absolute inset-0 rounded-xl flex items-center justify-center bg-card border-2 border-border"
                style={{ backfaceVisibility: "hidden" as const }}
              >
                <span className="text-2xl text-muted-foreground/40">?</span>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Victory Celebration */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-amber-500" />
                <Trophy className="h-6 w-6 text-emerald-500" />
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-foreground">
                Completed in {moves} moves!
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  +{scoreEarned} points!
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Formula */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        Score: max(100, 1000 - moves × 30)
      </div>
    </div>
  );
}
