import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM_HINTS = [
  "لخّص لي مفهوم الذكاء الاصطناعي في فقرة قصيرة",
  "أعطني أفكاراً لمشروع تخرج في تطوير الويب",
  "اشرح الفرق بين SQL وNoSQL",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: next }),
        },
      );

      if (resp.status === 429) {
        toast.error("الكثير من الطلبات. حاول بعد قليل.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("تم استنفاد رصيد الذكاء الاصطناعي.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error("تعذّر الاتصال بالمساعد");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
              setTimeout(() => {
                scrollRef.current?.scrollTo({
                  top: scrollRef.current.scrollHeight,
                  behavior: "smooth",
                });
              }, 0);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-8 md:py-12 max-w-3xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-secondary mb-2">
            <Sparkles className="h-4 w-4" />
            AI ASSISTANT
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">المساعد الذكي</h1>
          <p className="text-muted-foreground mt-2">اسأل عن أي شيء تعليمي أو تقني.</p>
        </div>

        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-0">
            <div ref={scrollRef} className="h-[55vh] overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bot className="h-14 w-14 text-primary mb-3" />
                  <p className="font-bold text-lg">كيف أساعدك اليوم؟</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md">
                    {SYSTEM_HINTS.map((h) => (
                      <Button
                        key={h}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => send(h)}
                      >
                        {h}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      m.role === "user"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary/20 text-secondary"
                    }`}
                  >
                    {m.role === "user" ? (
                      <UserIcon className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50 border border-border/60"
                    }`}
                  >
                    {m.content || (loading && i === messages.length - 1 ? "..." : "")}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/60 p-3 flex gap-2">
              <Input
                placeholder="اكتب سؤالك..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={loading}
              />
              <Button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
