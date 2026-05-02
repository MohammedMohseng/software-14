import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Heart, ImagePlus, Loader2, MessageSquareHeart, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Memory = {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  liked_by_me: boolean;
};

const memorySchema = z.object({
  content: z.string().trim().min(1, "اكتب شيئاً أولاً").max(2000, "النص طويل جداً"),
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "الآن";
  const min = Math.floor(sec / 60);
  if (min < 60) return `قبل ${min} دقيقة`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `قبل ${hr} ساعة`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `قبل ${d} يوم`;
  return new Date(iso).toLocaleDateString("ar");
}

export default function Memories() {
  const { user } = useAuth();
  const { isModerator } = useUserRoles();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data: posts } = await supabase
      .from("memories")
      .select("id, author_id, content, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!posts || posts.length === 0) {
      setMemories([]);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set(posts.map((p: any) => p.author_id))];
    const memoryIds = posts.map((p: any) => p.id);

    const [{ data: profiles }, { data: likes }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", authorIds),
      supabase.from("memory_likes").select("memory_id, user_id").in("memory_id", memoryIds),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const likeCounts = new Map<string, number>();
    const likedByMe = new Set<string>();
    (likes ?? []).forEach((l: any) => {
      likeCounts.set(l.memory_id, (likeCounts.get(l.memory_id) ?? 0) + 1);
      if (user && l.user_id === user.id) likedByMe.add(l.memory_id);
    });

    setMemories(
      posts.map((p: any) => ({
        ...p,
        author: profileMap.get(p.author_id) ?? null,
        likes_count: likeCounts.get(p.id) ?? 0,
        liked_by_me: likedByMe.has(p.id),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleFile = (f: File | null) => {
    if (!f) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      toast({ title: "ملف غير صالح", description: "اختر صورة فقط", variant: "destructive" });
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast({ title: "الصورة كبيرة جداً", description: "الحد الأقصى 5 ميجابايت", variant: "destructive" });
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("memories").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("memories").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const parsed = memorySchema.parse({ content });
      let image_url: string | null = null;
      if (imageFile) image_url = await uploadImage(imageFile);

      const { error } = await supabase.from("memories").insert({
        author_id: user.id,
        content: parsed.content,
        image_url,
      });
      if (error) throw error;
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "تم النشر 🎉" });
      load();
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || "حدث خطأ";
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (m: Memory) => {
    if (!user) {
      toast({ title: "سجّل دخولك أولاً", variant: "destructive" });
      return;
    }
    setMemories((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? { ...x, liked_by_me: !x.liked_by_me, likes_count: x.likes_count + (x.liked_by_me ? -1 : 1) }
          : x,
      ),
    );
    if (m.liked_by_me) {
      await supabase.from("memory_likes").delete().eq("memory_id", m.id).eq("user_id", user.id);
    } else {
      await supabase.from("memory_likes").insert({ memory_id: m.id, user_id: user.id });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا المنشور؟")) return;
    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) {
      toast({ title: "تعذّر الحذف", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم الحذف" });
    setMemories((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <>
      <Navbar />
      <main className="container max-w-2xl py-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-mono mb-2">
            <MessageSquareHeart className="h-3.5 w-3.5" />
            SOCIAL WALL
          </div>
          <h1 className="text-3xl font-bold">حائط الذكريات</h1>
          <p className="text-muted-foreground mt-1">شارك لحظاتك مع الدفعة</p>
        </div>

        {user ? (
          <Card className="mb-6 bg-card/60 backdrop-blur border-border/60">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="ما الذي يدور في بالك يا دفعة 14؟"
                  rows={3}
                  className="resize-none border-border/60 bg-muted/30"
                  maxLength={2000}
                />

                {imagePreview && (
                  <div className="relative rounded-lg overflow-hidden border border-border/60">
                    <img src={imagePreview} alt="معاينة" className="w-full max-h-80 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleFile(null)}
                      className="absolute top-2 left-2 bg-background/80 backdrop-blur rounded-full p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      aria-label="إزالة الصورة"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus className="ms-1 h-4 w-4" />
                    {imageFile ? "تغيير الصورة" : "إضافة صورة"}
                  </Button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">{content.length}/2000</span>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submitting || !content.trim()}
                      className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                    >
                      {submitting ? <Loader2 className="ms-1 h-4 w-4 animate-spin" /> : <Send className="ms-1 h-4 w-4" />}
                      نشر
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-border/60 bg-card/40 backdrop-blur">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">سجّل دخولك</Link> لمشاركة الذكريات
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            لا توجد ذكريات بعد. كن أول من ينشر! ✨
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((m) => {
              const initials = (m.author?.full_name || m.author?.username || "؟").trim().slice(0, 2);
              const canDelete = user && (user.id === m.author_id || isModerator);
              return (
                <Card key={m.id} className="bg-card/60 backdrop-blur border-border/60 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3 flex flex-row items-center gap-3 space-y-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.author?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.author?.full_name || "بدون اسم"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-mono ltr">@{m.author?.username || "user"}</span>
                        <span>·</span>
                        <span>{timeAgo(m.created_at)}</span>
                      </div>
                    </div>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    {m.image_url && (
                      <div className="rounded-lg overflow-hidden border border-border/60">
                        <img src={m.image_url} alt="" loading="lazy" className="w-full h-auto" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(m)}
                        className={cn("gap-1.5", m.liked_by_me && "text-destructive")}
                      >
                        <Heart className={cn("h-4 w-4", m.liked_by_me && "fill-current")} />
                        <span className="text-xs">{m.likes_count}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
