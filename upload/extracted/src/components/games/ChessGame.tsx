import { useEffect, useMemo, useState } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Difficulty = "easy" | "medium" | "hard";

export default function ChessGame({ onScore }: { onScore: (score: number) => void }) {
  const [game, setGame] = useState(() => new Chess());
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [moves, setMoves] = useState(0);
  const [reported, setReported] = useState(false);

  const fen = game.fen();

  useEffect(() => {
    if (game.isGameOver()) {
      let msg = "انتهت اللعبة";
      let bonus = 0;
      if (game.isCheckmate()) {
        if (game.turn() === "b") {
          msg = "🏆 كش ملك! فزت";
          bonus = difficulty === "hard" ? 1500 : difficulty === "medium" ? 1000 : 500;
        } else {
          msg = "💀 كش ملك! خسرت";
          bonus = 50;
        }
      } else if (game.isDraw()) {
        msg = "تعادل";
        bonus = 200;
      }
      setStatus(msg);
      if (!reported) {
        const finalScore = Math.max(0, bonus - moves * 5);
        onScore(finalScore);
        setReported(true);
      }
    } else if (game.inCheck()) {
      setStatus("⚠️ كش");
    } else {
      setStatus("");
    }
  }, [fen, game, moves, difficulty, onScore, reported]);

  const askAi = async (currentFen: string) => {
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("game-ai", {
        body: { game: "chess", payload: { fen: currentFen } },
      });
      if (error) throw error;
      const move = (data?.move ?? "").trim();
      if (!move) throw new Error("لم يستجب الذكاء");

      const next = new Chess(currentFen);
      const from = move.slice(0, 2) as Square;
      const to = move.slice(2, 4) as Square;
      const promotion = move.length === 5 ? move[4] : "q";

      const result = next.move({ from, to, promotion });
      if (!result) {
        // fallback: random legal move
        const legal = next.moves({ verbose: true });
        if (legal.length === 0) return;
        const r = legal[Math.floor(Math.random() * legal.length)];
        next.move({ from: r.from, to: r.to, promotion: "q" });
      }
      setGame(next);
    } catch (e: any) {
      toast.error("فشل تحريك الذكاء الاصطناعي");
      console.error(e);
    } finally {
      setThinking(false);
    }
  };

  const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!targetSquare) return false;
    if (thinking || game.isGameOver()) return false;
    const next = new Chess(game.fen());
    let move;
    try {
      move = next.move({ from: sourceSquare as Square, to: targetSquare as Square, promotion: "q" });
    } catch {
      return false;
    }
    if (!move) return false;
    setGame(next);
    setMoves((m) => m + 1);

    if (!next.isGameOver()) {
      setTimeout(() => askAi(next.fen()), 200);
    }
    return true;
  };

  const reset = () => {
    setGame(new Chess());
    setStatus("");
    setMoves(0);
    setReported(false);
  };

  // Board width responsive
  const boardWidth = useMemo(() => {
    if (typeof window === "undefined") return 360;
    const w = Math.min(window.innerWidth - 48, 480);
    return Math.max(280, w);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">حركات: {moves}</Badge>
          {status && (
            <Badge
              variant="outline"
              className={
                status.includes("فزت")
                  ? "bg-success/10 text-success border-success/30"
                  : status.includes("خسرت")
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : "bg-warning/10 text-warning border-warning/30"
              }
            >
              {status}
            </Badge>
          )}
          {thinking && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              يفكر...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="px-3 py-1.5 rounded-md bg-card border border-border text-sm"
          >
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
          <Button variant="outline" size="sm" onClick={reset}>
            <RefreshCw className="ms-1 h-3.5 w-3.5" />
            جولة جديدة
          </Button>
        </div>
      </div>

      <div className="flex justify-center" dir="ltr">
        <div style={{ width: boardWidth }}>
          <Chessboard
            options={{
              position: fen,
              onPieceDrop: onDrop,
              darkSquareStyle: { backgroundColor: "hsl(220 30% 18%)" },
              lightSquareStyle: { backgroundColor: "hsl(220 25% 32%)" },
              boardStyle: {
                borderRadius: 8,
                boxShadow: "0 4px 20px hsl(var(--primary) / 0.15)",
              },
              animationDurationInMs: 200,
            }}
          />
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">
        أنت تلعب بالأبيض ضد ذكاء اصطناعي (Gemini).
      </p>
    </div>
  );
}
