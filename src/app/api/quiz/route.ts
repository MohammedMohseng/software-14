import { NextRequest, NextResponse } from "next/server";

const CATEGORY_PROMPTS: Record<string, string> = {
  programming: "Generate a programming/computer science quiz question. Topics can include: algorithms, data structures, programming languages, software engineering, databases, web development, operating systems, networking.",
  general: "Generate a general knowledge quiz question. Topics can include: geography, history, science, literature, art, culture, current events, nature.",
  mathematics: "Generate a mathematics quiz question. Topics can include: algebra, calculus, geometry, statistics, number theory, probability, logic.",
  religious: "Generate a religious/Islamic knowledge quiz question. Topics can include: Quran, Hadith, Islamic history, Fiqh, prophets, pillars of Islam, Islamic values.",
};

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();

    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const categoryPrompt = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.general;

    // Generate question via z-ai-web-dev-sdk
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a quiz question generator. Generate a single multiple-choice quiz question.
You MUST respond with ONLY a valid JSON object in this exact format, no other text:
{"question":"The question text","options":["Option A","Option B","Option C","Option D"],"correctIndex":0}

Where correctIndex is the 0-based index of the correct answer (0-3).
Make the question challenging but fair. The distractors (wrong answers) should be plausible.
Vary the difficulty level.`
          },
          {
            role: "user",
            content: `${categoryPrompt}\n\nGenerate a quiz question now. Remember: respond with ONLY the JSON object, nothing else.`
          }
        ],
        thinking: { type: "disabled" },
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";

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
        { question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctIndex: 1 },
        { question: "Which data structure uses FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], correctIndex: 1 },
        { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correctIndex: 0 },
        { question: "Which keyword is used to declare a variable in JavaScript?", options: ["var", "int", "string", "dim"], correctIndex: 0 },
        { question: "What is the purpose of CSS?", options: ["Database management", "Styling web pages", "Server-side logic", "API creation"], correctIndex: 1 },
        { question: "Which sorting algorithm has the best average time complexity?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correctIndex: 2 },
        { question: "What does API stand for?", options: ["Application Programming Interface", "Advanced Protocol Integration", "Automated Process Interface", "Application Process Integration"], correctIndex: 0 },
      ],
      general: [
        { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correctIndex: 2 },
        { question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"], correctIndex: 2 },
        { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correctIndex: 2 },
        { question: "How many continents are there?", options: ["5", "6", "7", "8"], correctIndex: 2 },
        { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctIndex: 2 },
        { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
        { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correctIndex: 1 },
      ],
      mathematics: [
        { question: "What is the value of π (pi) to 2 decimal places?", options: ["3.12", "3.14", "3.16", "3.18"], correctIndex: 1 },
        { question: "What is the derivative of x²?", options: ["x", "2x", "x²", "2x²"], correctIndex: 1 },
        { question: "What is the sum of angles in a triangle?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
        { question: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctIndex: 2 },
        { question: "What is 7! (7 factorial)?", options: ["720", "5040", "40320", "362880"], correctIndex: 1 },
        { question: "What is the formula for the area of a circle?", options: ["2πr", "πr²", "πd", "2πr²"], correctIndex: 1 },
        { question: "What is log₁₀(1000)?", options: ["1", "2", "3", "4"], correctIndex: 2 },
      ],
      religious: [
        { question: "How many Surahs are in the Quran?", options: ["112", "114", "116", "120"], correctIndex: 1 },
        { question: "What is the first pillar of Islam?", options: ["Salah", "Shahada", "Zakat", "Hajj"], correctIndex: 1 },
        { question: "Who was the first Prophet in Islam?", options: ["Ibrahim", "Musa", "Adam", "Nuh"], correctIndex: 2 },
        { question: "During which month do Muslims fast?", options: ["Shawwal", "Ramadan", "Dhul Hijjah", "Rajab"], correctIndex: 1 },
        { question: "How many times a day do Muslims pray?", options: ["3", "4", "5", "6"], correctIndex: 2 },
        { question: "What is the name of the holy book revealed to Prophet Musa?", options: ["Quran", "Injil", "Tawrat", "Zabur"], correctIndex: 2 },
        { question: "What is the second Surah of the Quran?", options: ["Al-Fatiha", "Al-Baqarah", "Al-Imran", "An-Nisa"], correctIndex: 1 },
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
