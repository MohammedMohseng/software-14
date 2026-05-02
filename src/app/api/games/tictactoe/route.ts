import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { board } = await req.json();

    if (!board || typeof board !== "string" || board.length !== 9) {
      return NextResponse.json({ error: "Invalid board" }, { status: 400 });
    }

    // Try AI move via z-ai-web-dev-sdk
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const boardDisplay = board.split("").map((c, i) => `${i}:${c}`).join(" | ");
      const winningLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a Tic Tac Toe AI. You play as O. The player is X. Empty cells are "-". 
You must return ONLY a single number (0-8) representing your move. No explanation.
The board positions are indexed 0-8:
0 | 1 | 2
3 | 4 | 5
6 | 7 | 8
Winning lines: ${JSON.stringify(winningLines)}
Choose the best move for O. Try to win, or block X from winning, or take center.`
          },
          {
            role: "user",
            content: `Current board: ${boardDisplay}\nYour move (0-8):`
          }
        ],
        thinking: { type: "disabled" },
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      const match = text.match(/\d/);
      if (match) {
        const move = parseInt(match[0], 10);
        if (move >= 0 && move <= 8 && board[move] === "-") {
          return NextResponse.json({ move });
        }
      }
    } catch (e) {
      console.error("AI tictactoe failed, using fallback:", e);
    }

    // Fallback: strategic random move
    const emptyCells = board.split("").map((c, i) => c === "-" ? i : -1).filter((i) => i >= 0);
    if (emptyCells.length === 0) {
      return NextResponse.json({ error: "No moves available" }, { status: 400 });
    }

    // Try to win
    const winLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const line of winLines) {
      const values = line.map((i) => board[i]);
      const oCount = values.filter((v) => v === "O").length;
      const emptyCount = values.filter((v) => v === "-").length;
      if (oCount === 2 && emptyCount === 1) {
        const move = line.find((i) => board[i] === "-")!;
        return NextResponse.json({ move });
      }
    }

    // Try to block
    for (const line of winLines) {
      const values = line.map((i) => board[i]);
      const xCount = values.filter((v) => v === "X").length;
      const emptyCount = values.filter((v) => v === "-").length;
      if (xCount === 2 && emptyCount === 1) {
        const move = line.find((i) => board[i] === "-")!;
        return NextResponse.json({ move });
      }
    }

    // Take center
    if (board[4] === "-") {
      return NextResponse.json({ move: 4 });
    }

    // Take corner
    const corners = [0, 2, 6, 8].filter((i) => board[i] === "-");
    if (corners.length > 0) {
      return NextResponse.json({ move: corners[Math.floor(Math.random() * corners.length)] });
    }

    // Random empty
    const move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return NextResponse.json({ move });
  } catch (error) {
    console.error("TicTacToe API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
