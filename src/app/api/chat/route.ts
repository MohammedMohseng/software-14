import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

const SYSTEM_PROMPTS = {
  platform:
    "You are the Software-14 platform assistant. You help users navigate the platform, understand features, and answer questions about the Software Engineering batch 14 community. The platform has sections for Memories, Gallery, Academic Resources, News, Games, and AI Chat. Be friendly, helpful, and concise. Use emojis sparingly to add warmth. If you don't know something specific about the platform, be honest and suggest where the user might find the information.",
  general:
    "You are a helpful AI assistant. You can answer questions about programming, academics, general knowledge, and more. Be friendly and helpful. Provide clear, well-structured answers. Use code examples when relevant. Be concise but thorough.",
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment before sending another message." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, context = "general", history = [] } = body as {
      message?: string;
      context?: "platform" | "general";
      history?: Array<{ role: string; content: string }>;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 4000 characters." },
        { status: 400 }
      );
    }

    // Validate history
    const validHistory = Array.isArray(history)
      ? history
          .filter(
            (h) =>
              h &&
              typeof h.role === "string" &&
              typeof h.content === "string" &&
              (h.role === "user" || h.role === "assistant")
          )
          .slice(-20) // Keep last 20 messages max
      : [];

    const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;

    // Call z-ai-web-dev-sdk
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        ...validHistory.map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message.trim() },
      ],
      thinking: { type: "disabled" },
    });

    const responseText =
      completion?.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        response:
          "I'm having trouble connecting right now. Please try again in a moment. If the issue persists, the AI service might be temporarily unavailable.",
      },
      { status: 200 } // Return 200 with fallback message so UI shows something useful
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to send messages." },
    { status: 405 }
  );
}
