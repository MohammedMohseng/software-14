import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Brain, Crown, Gamepad2, Grid3x3, HelpCircle, Trophy } from "lucide-react";
import TriviaGame from "@/components/games/TriviaGame";
import ChessGame from "@/components/games/ChessGame";
import TicTacToeGame from "@/components/games/TicTacToeGame";
import MemoryMatch from "@/components/games/MemoryMatch";

type Score = {
  id: string;
  user_id: string;
  game: string;
  score: number;
  created_at: string;
  profile?: { username: string | null; full_name: string | null } | null;
};

function Leaderboard({ game, label }: { game: string; label: string }) {
  const [scores, setScores] = useState<Score[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("game_scores")
      .select("*")
      .eq("game", game)
      .order("score", { ascending: false })
      .limit(10);
    if (!data) return;
    const userIds = [...new Set(data.map((s) => s.user_id))];
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", userIds);
    const map = new Map(profs?.map((p) => [p.id, p]) ?? []);
    setScores(data.map((s) => ({ ...s, profile: map.get(s.user_id) ?? null })));
  };

  useEffect(() => {
    load();
  }, [game]);

  return (
    <Card className="bg-card/60 border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-warning" />
          <h3 className="font-bold">أبطال {label}</h3>
        </div>
        {scores.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            لا توجد نتائج بعد. كن أول لاعب!
          </p>
        ) : (
          <ol className="space-y-2">
            {scores.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/40"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center text-sm font-bold ${
                      i === 0 ? "text-warning" : "text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm">
                    {s.profile?.full_name || s.profile?.username || "مستخدم"}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-primary">{s.score}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default function Games() {
  const { user } = useAuth();
  const [tab, setTab] = useState("trivia");
  const [refreshKey, setRefreshKey] = useState(0);

  const submitScore = async (game: string, score: number) => {
    if (!user) {
      toast.info("سجّل الدخول لحفظ نتيجتك");
      return;
    }
    const { error } = await supabase
      .from("game_scores")
      .insert({ user_id: user.id, game, score });
    if (error) toast.error(error.message);
    else {
      toast.success(`تم حفظ نتيجتك: ${score}`);
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-warning mb-2">
            <Gamepad2 className="h-4 w-4" />
            GAMING ZONE
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">منطقة الألعاب</h1>
          <p className="text-muted-foreground mt-2">
            تنافس مع زملائك أو تحدّى الذكاء الاصطناعي.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 max-w-2xl">
            <TabsTrigger value="trivia">
              <HelpCircle className="ms-1 h-4 w-4" />
              معلومات
            </TabsTrigger>
            <TabsTrigger value="memory">
              <Brain className="ms-1 h-4 w-4" />
              ذاكرة
            </TabsTrigger>
            <TabsTrigger value="chess">
              <Crown className="ms-1 h-4 w-4" />
              شطرنج
            </TabsTrigger>
            <TabsTrigger value="xo">
              <Grid3x3 className="ms-1 h-4 w-4" />
              XO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trivia" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card/60 border-border/60">
                <CardContent className="p-5 md:p-7">
                  <TriviaGame onScore={(s) => submitScore("trivia", s)} />
                </CardContent>
              </Card>
              <Leaderboard key={`trivia-${refreshKey}`} game="trivia" label="المعلومات" />
            </div>
          </TabsContent>

          <TabsContent value="memory" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card/60 border-border/60">
                <CardContent className="p-5 md:p-7">
                  <MemoryMatch onScore={(s) => submitScore("memory_match", s)} />
                </CardContent>
              </Card>
              <Leaderboard key={`mem-${refreshKey}`} game="memory_match" label="الذاكرة" />
            </div>
          </TabsContent>

          <TabsContent value="chess" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card/60 border-border/60">
                <CardContent className="p-5 md:p-7">
                  <ChessGame onScore={(s) => submitScore("chess", s)} />
                </CardContent>
              </Card>
              <Leaderboard key={`chess-${refreshKey}`} game="chess" label="الشطرنج" />
            </div>
          </TabsContent>

          <TabsContent value="xo" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card/60 border-border/60">
                <CardContent className="p-5 md:p-7">
                  <TicTacToeGame onScore={(s) => submitScore("tictactoe", s)} />
                </CardContent>
              </Card>
              <Leaderboard key={`xo-${refreshKey}`} game="tictactoe" label="XO" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
