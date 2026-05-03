import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const BASE_IDENTITY = `أنت مساعد ذكاء اصطناعي خاص بمنصة الدفعة الرابعة عشرة - تخصص هندسة البرمجيات، جامعة السودان للعلوم والتكنولوجيا. يجب أن تتحدث دائمًا باللغة العربية وأن تكون ردودك واضحة ومفيدة وودية.`;

const SYSTEM_PROMPTS = {
  platform: `${BASE_IDENTITY}
أنت مساعد المنصة المتخصص. تساعد المستخدمين في التنقل داخل المنصة وفهم ميزاتها والإجابة على أسئلتهم المتعلقة بمجتمع الدفعة الرابعة عشرة. تحتوي المنصة على أقسام: الذكريات، المعرض، الموارد الأكاديمية، الأخبار، الألعاب، ومحادثة الذكاء الاصطناعي. كن ودودًا ومختصرًا. إذا لم تكن متأكدًا من معلومة معينة عن المنصة، كن صريحًا واقترح على المستخدم من أين يمكنه إيجاد المعلومة.`,

  general: `${BASE_IDENTITY}
يمكنك الإجابة على أسئلة البرمجة، المواد الأكاديمية، المعلومات العامة، وكل ما يخص طلاب هندسة البرمجيات. قدّم إجابات منظمة وواضحة، واستخدم أمثلة برمجية عند الحاجة. كن مختصرًا دون الإخلال بالشمولية.`,
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "تجاوزت الحد المسموح به من الرسائل. يرجى الانتظار قليلاً قبل إرسال رسالة أخرى.",
        },
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
        { error: "الرسالة مطلوبة ولا يمكن أن تكون فارغة." },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "الرسالة طويلة جدًا. يرجى الإبقاء عليها أقل من 4000 حرف." },
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

    // Initialize Gemini client
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error("متغير البيئة AI_API_KEY غير موجود.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    // Map history to Gemini format (role "assistant" → "model")
    let geminiHistory = validHistory.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));

    // ✅ الإصلاح: Gemini يشترط أن تبدأ الـ history بـ "user" دائمًا
    // نشيل أي رسائل "model" من البداية حتى نصل لأول "user"
    while (geminiHistory.length > 0 && geminiHistory[0].role === "model") {
      geminiHistory.shift();
    }

    const chat = model.startChat({ history: geminiHistory });

    const result = await chat.sendMessage(message.trim());
    const responseText =
      result.response.text() ||
      "عذرًا، لم أتمكن من توليد رد. يرجى المحاولة مرة أخرى.";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        response:
          "أواجه مشكلة في الاتصال حاليًا. يرجى المحاولة مرة أخرى بعد قليل. إذا استمرت المشكلة، فقد تكون خدمة الذكاء الاصطناعي غير متاحة مؤقتًا.",
      },
      { status: 200 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "الطريقة غير مدعومة. استخدم POST لإرسال الرسائل." },
    { status: 405 }
  );
}