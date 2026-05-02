import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Cell = "X" | "O" | "-";

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinner(b: Cell[]): "X" | "O" | "draw" | null {
  for (const [a, c, d] of WIN_LINES) {
    if (b[a] !== "-" && b[a] === b[c] && b[c] === b[d]) return b[a] as "X" | "O";
  }
  if (b.every((x) => x !== "-")) return "draw";
  return null;
}

export default function TicTacToeGame({ onScore }: { onScore: (score: number) => void }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill("-"));
  const [thinking, setThinking] = useState(false);
  const [winner, setWinner] = useState<"X" | "O" | "draw" | null>(null);
  const [reported, setReported] = useState(false);

  const playAi = async (current: Cell[]) => {
    setThinking(true);
    try {
      const boardStr = current.join("");
      const { data, error } = await supabase.functions.invoke("game-ai", {
        body: { game: "tictactoe", payload: { board: boardStr } },
      });
      if (error) throw error;
      let mv = parseInt((data?.move ?? "").toString(), 10);
      if (isNaN(mv) || current[mv] !== "-") {
        // fallback to first empty
        mv = current.findIndex((c) => c === "-");
      }
      if (mv >= 0) {
        const next = [...current];
        next[mv] = "O";
        setBoard(next);
        const w = getWinner(next);
        if (w) setWinner(w);
      }
    } catch (e: any) {
      toast.error("فشل تحريك الذكاء الاصطناعي");
      console.error(e);
    } finally {
      setThinking(false);
    }
  };

  const click = (i: number) => {
    if (thinking || winner || board[i] !== "-") return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    const w = getWinner(next);
    if (w) {
      setWinner(w);
      return;
    }
    setTimeout(() => playAi(next), 250);
  };

  useEffect(() => {
    if (winner && !reported) {
      let s = 0;
      if (winner === "X") s = 500;
      else if (winner === "draw") s = 200;
      else s = 50;
      onScore(s);
      setReported(true);
    }
  }, [winner, reported, onScore]);

  const reset = () => {
    setBoard(Array(9).fill("-"));
    setWinner(null);
    setReported(false);
  };

  return (
    <div className="max-w-xs mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline">
          {winner === "X" ? "🏆 فزت!" :
            winner === "O" ? "💀 خسرت" :
            winner === "draw" ? "🤝 تعادل" :
            thinking ? "AI يفكر..." : "دورك (X)"}
        </Badge>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="ms-1 h-3.5 w-3.5" />
          جديدة
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={!!winner || thinking || c !== "-"}
            className={`aspect-square rounded-lg text-4xl font-bold flex items-center justify-center transition-all ${
              c === "-"
                ? "bg-card border border-border hover:border-primary hover:bg-primary/5"
                : c === "X"
                ? "bg-primary/15 border border-primary/40 text-primary"
                : "bg-secondary/15 border border-secondary/40 text-secondary"
            }`}
          >
            {c === "-" ? "" : c}
          </button>
        ))}
      </div>

      {thinking && (
        <div className="flex justify-center mt-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
