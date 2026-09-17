import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CATEGORY_PROMPTS: Record<string, string> = {
  programming: "أنشئ سؤال اختبار في البرمجة وعلوم الحاسوب. يمكن أن تشمل المواضيع: الخوارزميات، هياكل البيانات، لغات البرمجة، هندسة البرمجيات، قواعد البيانات، تطوير الويب، أنظمة التشغيل، الشبكات.",
  general: "أنشئ سؤال اختبار في المعرفة العامة. يمكن أن تشمل المواضيع: الجغرافيا، التاريخ، العلوم، الأدب، الفن، الثقافة، الأحداث الجارية، الطبيعة.",
  mathematics: "أنشئ سؤال اختبار في الرياضيات. يمكن أن تشمل المواضيع: الجبر، التفاضل والتكامل، الهندسة، الإحصاء، نظرية الأعداد، الاحتمالات، المنطق.",
  religious: "أنشئ سؤال اختبار في المعرفة الدينية/الإسلامية. يمكن أن تشمل المواضيع: القرآن، الحديث، التاريخ الإسلامي، الفقه، الأنبياء، أركان الإسلام، القيم الإسلامية.",
};

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();

    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.general;

    // Generate question via Gemini
    try {
      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        throw new Error("متغير البيئة AI_API_KEY غير موجود.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `أنت مولّد أسئلة اختبارات. أنشئ سؤال اختيار من متعدد واحد فقط.
يجب أن يكون السؤال والخيارات ونص الإجابة بالكامل باللغة العربية الفصحى فقط، دون أي كلمات إنجليزية داخل النصوص.
يجب أن ترد فقط بكائن JSON صالح بهذا الشكل بالضبط، بدون أي نص آخر:
{"question":"نص السؤال","options":["الخيار أ","الخيار ب","الخيار ج","الخيار د"],"correctIndex":0}

حيث correctIndex هو رقم الإجابة الصحيحة (من 0 إلى 3).
اجعل السؤال متوسط الصعوبة إلى صعب لكن عادلاً. يجب أن تكون الخيارات الخاطئة منطقية ومقنعة.
نوّع في مستوى الصعوبة.`,
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const result = await model.generateContent(
        `${categoryPrompt}\n\nأنشئ سؤال الاختبار الآن. تذكر: رد فقط بكائن JSON، بدون أي نص إضافي.`
      );

      const text = result.response.text()?.trim() ?? "";

      // Try to parse JSON from the response
      // Sometimes the AI wraps it in markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (
            parsed.question &&
            Array.isArray(parsed.options) &&
            parsed.options.length === 4 &&
            typeof parsed.correctIndex === "number" &&
            parsed.correctIndex >= 0 &&
            parsed.correctIndex <= 3
          ) {
            return NextResponse.json({
              question: parsed.question,
              options: parsed.options,
              correctIndex: parsed.correctIndex,
            });
          }
        } catch {
          // JSON parse failed, fall through to fallback
        }
      }
    } catch (e) {
      console.error("AI quiz generation failed:", e);
    }

    // Fallback questions per category
    const fallbacks: Record<string, Array<{ question: string; options: string[]; correctIndex: number }>> = {
      programming: [
        { question: "ما هي التعقيد الزمني للبحث الثنائي (Binary Search)؟", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctIndex: 1 },
        { question: "أي هيكل بيانات يعتمد على مبدأ FIFO (الأول دخولاً الأول خروجاً)؟", options: ["المكدس (Stack)", "الطابور (Queue)", "الشجرة (Tree)", "الرسم البياني (Graph)"], correctIndex: 1 },
        { question: "ماذا تعني اختصار HTML؟", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correctIndex: 0 },
        { question: "أي كلمة مفتاحية تُستخدم لتعريف متغير في JavaScript؟", options: ["var", "int", "string", "dim"], correctIndex: 0 },
        { question: "ما هو الغرض من لغة CSS؟", options: ["إدارة قواعد البيانات", "تنسيق صفحات الويب", "منطق جانب الخادم", "إنشاء واجهات برمجة تطبيقات"], correctIndex: 1 },
        { question: "أي خوارزمية ترتيب تتمتع بأفضل تعقيد زمني في المتوسط؟", options: ["الفقاعي (Bubble Sort)", "الاختياري (Selection Sort)", "الدمج (Merge Sort)", "الإدراج (Insertion Sort)"], correctIndex: 2 },
        { question: "ماذا تعني اختصار API؟", options: ["Application Programming Interface", "Advanced Protocol Integration", "Automated Process Interface", "Application Process Integration"], correctIndex: 0 },
      ],
      general: [
        { question: "ما هو أكبر محيط على وجه الأرض؟", options: ["الأطلسي", "الهندي", "الهادئ", "المتجمد الشمالي"], correctIndex: 2 },
        { question: "من رسم لوحة الموناليزا؟", options: ["فان جوخ", "بيكاسو", "دافينشي", "رامبرانت"], correctIndex: 2 },
        { question: "ما هي عاصمة أستراليا؟", options: ["سيدني", "ملبورن", "كانبيرا", "بريزبان"], correctIndex: 2 },
        { question: "كم عدد القارات في العالم؟", options: ["5", "6", "7", "8"], correctIndex: 2 },
        { question: "ما هي أصلب مادة طبيعية؟", options: ["الذهب", "الحديد", "الألماس", "البلاتين"], correctIndex: 2 },
        { question: "أي كوكب يُعرف بالكوكب الأحمر؟", options: ["الزهرة", "المريخ", "المشتري", "زحل"], correctIndex: 1 },
        { question: "ما هي أصغر دولة في العالم؟", options: ["موناكو", "الفاتيكان", "سان مارينو", "ليختنشتاين"], correctIndex: 1 },
      ],
      mathematics: [
        { question: "ما هي قيمة العدد π (باي) لأقرب رقمين عشريين؟", options: ["3.12", "3.14", "3.16", "3.18"], correctIndex: 1 },
        { question: "ما هو مشتق الدالة x²؟", options: ["x", "2x", "x²", "2x²"], correctIndex: 1 },
        { question: "ما هو مجموع زوايا المثلث؟", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
        { question: "ما هو الجذر التربيعي للعدد 144؟", options: ["10", "11", "12", "13"], correctIndex: 2 },
        { question: "ما ناتج !7 (مضروب 7)؟", options: ["720", "5040", "40320", "362880"], correctIndex: 1 },
        { question: "ما هي معادلة مساحة الدائرة؟", options: ["2πr", "πr²", "πd", "2πr²"], correctIndex: 1 },
        { question: "ما ناتج log₁₀(1000)؟", options: ["1", "2", "3", "4"], correctIndex: 2 },
      ],
      religious: [
        { question: "كم عدد سور القرآن الكريم؟", options: ["112", "114", "116", "120"], correctIndex: 1 },
        { question: "ما هو الركن الأول من أركان الإسلام؟", options: ["الصلاة", "الشهادتان", "الزكاة", "الحج"], correctIndex: 1 },
        { question: "من هو أول نبي في الإسلام؟", options: ["إبراهيم", "موسى", "آدم", "نوح"], correctIndex: 2 },
        { question: "في أي شهر يصوم المسلمون؟", options: ["شوال", "رمضان", "ذو الحجة", "رجب"], correctIndex: 1 },
        { question: "كم مرة يصلي المسلمون في اليوم؟", options: ["3", "4", "5", "6"], correctIndex: 2 },
        { question: "ما اسم الكتاب المقدس الذي أُنزل على النبي موسى عليه السلام؟", options: ["القرآن", "الإنجيل", "التوراة", "الزبور"], correctIndex: 2 },
        { question: "ما هي السورة الثانية في القرآن الكريم؟", options: ["الفاتحة", "البقرة", "آل عمران", "النساء"], correctIndex: 1 },
      ],
    };

    const categoryFallbacks = fallbacks[category] || fallbacks.general;
    const randomQuestion = categoryFallbacks[Math.floor(Math.random() * categoryFallbacks.length)];

    return NextResponse.json(randomQuestion);
  } catch (error) {
    console.error("Quiz API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}