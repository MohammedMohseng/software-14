import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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

export default function MemoryMatch({ onScore }: { onScore: (score: number) => void }) {
  const [deck, setDeck] = useState<Card[]>(shuffleDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (flipped.length === 2) {
      const [a, b] = flipped;
      setMoves((m) => m + 1);
      const ca = deck.find((c) => c.id === a)!;
      const cb = deck.find((c) => c.id === b)!;
      if (ca.emoji === cb.emoji) {
        setDeck((d) => d.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)));
        setFlipped([]);
      } else {
        setTimeout(() => {
          setDeck((d) => d.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)));
          setFlipped([]);
        }, 700);
      }
    }
  }, [flipped, deck]);

  useEffect(() => {
    if (deck.length > 0 && deck.every((c) => c.matched) && !done) {
      setDone(true);
      const score = Math.max(100, 1000 - moves * 30);
      onScore(score);
    }
  }, [deck, moves, done, onScore]);

  const flip = (id: number) => {
    if (flipped.length === 2) return;
    const card = deck.find((c) => c.id === id)!;
    if (card.flipped || card.matched) return;
    setDeck((d) => d.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setFlipped((f) => [...f, id]);
  };

  const reset = () => {
    setDeck(shuffleDeck());
    setFlipped([]);
    setMoves(0);
    setDone(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          الحركات: <span className="text-foreground font-bold">{moves}</span>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="ms-1 h-3.5 w-3.5" />
          جولة جديدة
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
        {deck.map((c) => (
          <button
            key={c.id}
            onClick={() => flip(c.id)}
            className={`aspect-square rounded-lg text-3xl sm:text-4xl flex items-center justify-center transition-all duration-300 ${
              c.flipped || c.matched
                ? "bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/40"
                : "bg-card hover:bg-muted border border-border"
            } ${c.matched ? "opacity-60" : ""}`}
          >
            {c.flipped || c.matched ? c.emoji : "?"}
          </button>
        ))}
      </div>
      {done && (
        <div className="text-center mt-6">
          <p className="text-lg font-bold text-primary">🎉 أحسنت! تم في {moves} حركة</p>
        </div>
      )}
    </div>
  );
}
