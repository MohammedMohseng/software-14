import { NextRequest, NextResponse } from "next/server";
import { Chess } from "chess.js";

export async function POST(req: NextRequest) {
  try {
    const { fen, difficulty } = await req.json();

    if (!fen || typeof fen !== "string") {
      return NextResponse.json({ error: "Invalid FEN" }, { status: 400 });
    }

    // Validate the FEN with chess.js
    let game: Chess;
    try {
      game = new Chess(fen);
    } catch {
      return NextResponse.json({ error: "Invalid FEN position" }, { status: 400 });
    }

    const legalMoves = game.moves({ verbose: true });
    if (legalMoves.length === 0) {
      return NextResponse.json({ error: "No legal moves" }, { status: 400 });
    }

    // Try AI move via z-ai-web-dev-sdk
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const boardStr = game.ascii();
      const legalMovesStr = legalMoves.map((m) => `${m.from}${m.to}${m.promotion || ""}`).join(", ");

      const diffInstruction = difficulty === "easy"
        ? "Pick a move that is not necessarily the best. You can make suboptimal moves sometimes."
        : difficulty === "hard"
        ? "Pick the best possible move. Think carefully about strategy, tactics, and long-term advantage."
        : "Pick a good move. Balance between optimal and interesting play.";

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a chess AI playing as Black. ${diffInstruction}
Return ONLY the move in format: from_square + to_square + optional_promotion (e.g., "e2e4", "e7e8q"). No explanation.
Current board:\n${boardStr}
Legal moves: ${legalMovesStr}`
          },
          {
            role: "user",
            content: "Make your move:"
          }
        ],
        thinking: { type: "disabled" },
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      // Extract move pattern (e.g., e2e4, e7e8q)
      const moveMatch = text.match(/([a-h][1-8][a-h][1-8][qrbn]?)/i);
      if (moveMatch) {
        const moveStr = moveMatch[1].toLowerCase();
        // Verify it's a legal move
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promo = moveStr.length === 5 ? moveStr[4] : undefined;
        const isLegal = legalMoves.some(
          (m) => m.from === from && m.to === to && (promo ? m.promotion === promo : true)
        );
        if (isLegal) {
          return NextResponse.json({ move: moveStr });
        }
      }
    } catch (e) {
      console.error("AI chess failed, using fallback:", e);
    }

    // Fallback: random legal move with some basic strategy
    // Prefer captures and checks
    const captures = legalMoves.filter((m) => m.captured);
    const checks = legalMoves.filter((m) => {
      const testGame = new Chess(fen);
      testGame.move({ from: m.from, to: m.to, promotion: m.promotion || "q" });
      return testGame.inCheck();
    });

    let chosenMove;
    if (difficulty === "easy") {
      chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else if (checks.length > 0) {
      chosenMove = checks[Math.floor(Math.random() * checks.length)];
    } else if (captures.length > 0 && difficulty !== "easy") {
      chosenMove = captures[Math.floor(Math.random() * captures.length)];
    } else {
      chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    const moveStr = `${chosenMove.from}${chosenMove.to}${chosenMove.promotion || ""}`;
    return NextResponse.json({ move: moveStr });
  } catch (error) {
    console.error("Chess API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
