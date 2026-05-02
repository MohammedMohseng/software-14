"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Chess, Square } from "chess.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Trophy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Difficulty = "easy" | "medium" | "hard";

const PIECE_UNICODE: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

function getPieceChar(piece: { type: string; color: string }): string {
  const key = piece.color === "w" ? `w${piece.type}` : `b${piece.type}`;
  return PIECE_UNICODE[key] || "";
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

interface ChessGameProps {
  onScore: (score: number) => void;
}

export default function ChessGame({ onScore }: ChessGameProps) {
  const [game, setGame] = useState(() => new Chess());
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [moveCount, setMoveCount] = useState(0);
  const [reported, setReported] = useState(false);
  const [scoreEarned, setScoreEarned] = useState<number | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const fen = game.fen();

  // Build board position from chess.js
  const boardPositions = useMemo(() => {
    const positions: Record<string, { type: string; color: string } | null> = {};
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = FILES[c] + RANKS[r];
        positions[sq] = board[r][c];
      }
    }
    return positions;
  }, [fen]);

  // Check game state
  useEffect(() => {
    if (game.isGameOver()) {
      let msg = "Game Over";
      let bonus = 0;
      if (game.isCheckmate()) {
        if (game.turn() === "b") {
          msg = "🏆 Checkmate! You Win!";
          bonus = difficulty === "hard" ? 1500 : difficulty === "medium" ? 1000 : 500;
        } else {
          msg = "💀 Checkmate! You Lose";
          bonus = 50;
        }
      } else if (game.isDraw()) {
        msg = "🤝 Draw";
        bonus = 200;
      } else if (game.isStalemate()) {
        msg = "🤝 Stalemate";
        bonus = 200;
      }
      setStatus(msg);
      if (!reported) {
        const finalScore = Math.max(0, bonus - moveCount * 5);
        setScoreEarned(finalScore);
        onScore(finalScore);
        setReported(true);
      }
    } else if (game.inCheck()) {
      setStatus("⚠️ Check!");
    } else {
      setStatus("");
    }
  }, [fen, game, moveCount, difficulty, onScore, reported]);

  const askAi = useCallback(async (currentFen: string) => {
    setThinking(true);
    try {
      const res = await fetch("/api/games/chess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: currentFen, difficulty }),
      });
      const data = await res.json();
      const moveStr = (data.move ?? "").trim();

      const next = new Chess(currentFen);
      let moveResult;
      try {
        const from = moveStr.slice(0, 2) as Square;
        const to = moveStr.slice(2, 4) as Square;
        const promotion = moveStr.length === 5 ? moveStr[4] : "q";
        moveResult = next.move({ from, to, promotion });
      } catch {
        moveResult = null;
      }

      if (!moveResult) {
        // fallback: random legal move
        const legal = next.moves({ verbose: true });
        if (legal.length === 0) return;
        const r = legal[Math.floor(Math.random() * legal.length)];
        moveResult = next.move({ from: r.from as Square, to: r.to as Square, promotion: "q" });
      }

      if (moveResult) {
        setLastMove({ from: moveResult.from, to: moveResult.to });
      }
      setGame(next);
    } catch {
      toast.error("AI move failed. Trying random move...");
      // Fallback: random legal move
      const next = new Chess(currentFen);
      const legal = next.moves({ verbose: true });
      if (legal.length > 0) {
        const r = legal[Math.floor(Math.random() * legal.length)];
        const result = next.move({ from: r.from as Square, to: r.to as Square, promotion: "q" });
        if (result) setLastMove({ from: result.from, to: result.to });
        setGame(next);
      }
    } finally {
      setThinking(false);
    }
  }, [difficulty]);

  const handleSquareClick = (sq: string) => {
    if (thinking || game.isGameOver()) return;
    // Only allow white pieces
    if (game.turn() !== "w") return;

    const piece = boardPositions[sq];

    if (selectedSquare) {
      // Try to move
      const next = new Chess(game.fen());
      try {
        const moveResult = next.move({
          from: selectedSquare as Square,
          to: sq as Square,
          promotion: "q",
        });
        if (moveResult) {
          setGame(next);
          setMoveCount((m) => m + 1);
          setLastMove({ from: moveResult.from, to: moveResult.to });
          setSelectedSquare(null);
          setValidMoves([]);

          if (!next.isGameOver()) {
            setTimeout(() => askAi(next.fen()), 300);
          }
          return;
        }
      } catch {
        // Invalid move
      }

      // If clicked on own piece, select it instead
      if (piece && piece.color === "w") {
        setSelectedSquare(sq);
        const moves = game.moves({ square: sq as Square, verbose: true });
        setValidMoves(moves.map((m) => m.to));
        return;
      }

      // Deselect
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // Select a white piece
    if (piece && piece.color === "w") {
      setSelectedSquare(sq);
      const moves = game.moves({ square: sq as Square, verbose: true });
      setValidMoves(moves.map((m) => m.to));
    }
  };

  const reset = () => {
    setGame(new Chess());
    setStatus("");
    setMoveCount(0);
    setReported(false);
    setScoreEarned(null);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
  };

  const isLightSquare = (file: string, rank: string) => {
    const fileIdx = FILES.indexOf(file);
    const rankIdx = RANKS.indexOf(rank);
    return (fileIdx + rankIdx) % 2 === 0;
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">Moves: {moveCount}</Badge>
          {status && (
            <Badge
              variant="outline"
              className={
                status.includes("Win")
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : status.includes("Lose")
                  ? "bg-red-500/10 text-red-600 border-red-500/30"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
              }
            >
              {status}
            </Badge>
          )}
          {thinking && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> AI Thinking...
            </Badge>
          )}
          {!status && !thinking && game.turn() === "w" && (
            <Badge variant="outline" className="gap-1">Your Turn (White)</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="px-3 py-1.5 rounded-md bg-card border border-border text-sm cursor-pointer"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Chess Board */}
      <div className="flex justify-center">
        <div className="w-full max-w-[480px]">
          {/* Rank labels on top */}
          <div className="flex">
            <div className="w-6" />
            <div className="flex-1 grid grid-cols-8">
              {FILES.map((f) => (
                <div key={f} className="text-center text-[10px] text-muted-foreground pb-1">
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Board with rank labels */}
          {RANKS.map((rank) => (
            <div key={rank} className="flex">
              <div className="w-6 flex items-center justify-center text-[10px] text-muted-foreground">
                {rank}
              </div>
              <div className="flex-1 grid grid-cols-8">
                {FILES.map((file) => {
                  const sq = file + rank;
                  const piece = boardPositions[sq];
                  const isLight = isLightSquare(file, rank);
                  const isSelected = selectedSquare === sq;
                  const isValidMove = validMoves.includes(sq);
                  const isLastMoveFrom = lastMove?.from === sq;
                  const isLastMoveTo = lastMove?.to === sq;

                  return (
                    <motion.button
                      key={sq}
                      onClick={() => handleSquareClick(sq)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`aspect-square flex items-center justify-center text-2xl sm:text-3xl relative transition-colors ${
                        isLight
                          ? "bg-[#e8dcc8] dark:bg-[#7c6f5e]"
                          : "bg-[#b58863] dark:bg-[#574a3a]"
                      } ${isSelected ? "ring-2 ring-inset ring-primary z-10" : ""} ${
                        isLastMoveFrom || isLastMoveTo
                          ? isLight
                            ? "bg-[#cdd26a] dark:bg-[#8a9336]"
                            : "bg-[#aaa23a] dark:bg-[#6b7229]"
                          : ""
                      }`}
                    >
                      {piece && (
                        <span
                          className={`select-none leading-none ${
                            piece.color === "w" ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" : "text-gray-900 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
                          }`}
                        >
                          {getPieceChar(piece)}
                        </span>
                      )}
                      {isValidMove && !piece && (
                        <div className="w-3 h-3 rounded-full bg-primary/40" />
                      )}
                      {isValidMove && piece && (
                        <div className="absolute inset-0 border-2 border-primary/50 rounded-sm" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* File labels on bottom */}
          <div className="flex">
            <div className="w-6" />
            <div className="flex-1 grid grid-cols-8">
              {FILES.map((f) => (
                <div key={f} className="text-center text-[10px] text-muted-foreground pt-1">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <AnimatePresence>
        {scoreEarned !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
              <Trophy className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                +{scoreEarned} points!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-center text-muted-foreground mt-3">
        Click a white piece to select, then click a highlighted square to move.
      </p>

      {/* Score Guide */}
      <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <span>Easy Win: 500</span>
        <span>Med Win: 1000</span>
        <span>Hard Win: 1500</span>
        <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />-5/move</span>
      </div>
    </div>
  );
}
