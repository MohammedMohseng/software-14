import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Github, Linkedin, Loader2, MapPin, Phone, Search, Sparkles, Users, GraduationCap, BookOpen } from "lucide-react";
import { AppRole } from "@/hooks/useUserRoles";

type Member = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  major: string | null;
  academic_year: string | null;
  location: string | null;
  interests: string[] | null;
  skills: string[] | null;
  github_url: string | null;
  linkedin_url: string | null;
  roles: AppRole[];
};

const roleLabels: Record<AppRole, string> = {
  visitor: "زائر",
  member: "عضو",
  professor: "أستاذ",
  moderator: "مشرف",
  admin: "أدمن",
};

const roleColors: Record<AppRole, string> = {
  visitor: "bg-muted text-muted-foreground border-border",
  member: "bg-primary/15 text-primary border-primary/30",
  professor: "bg-success/15 text-success border-success/30",
  moderator: "bg-warning/15 text-warning border-warning/30",
  admin: "bg-secondary/15 text-secondary border-secondary/30",
};

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const byUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        byUser.set(r.user_id, arr);
      });

      setMembers(
        (profiles ?? []).map((p: any) => ({
          ...p,
          roles: byUser.get(p.id) ?? [],
        })),
      );
      setLoading(false);
    };
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const total = members.length;
    const profs = members.filter((m) => m.roles.includes("professor")).length;
    const mods = members.filter((m) => m.roles.includes("moderator")).length;
    const majors = new Set(members.map((m) => m.major).filter(Boolean));
    const cities = new Set(members.map((m) => m.location).filter(Boolean));
    const allSkills = members.flatMap((m) => m.skills ?? []);
    const skillCount = new Map<string, number>();
    allSkills.forEach((s) => skillCount.set(s, (skillCount.get(s) ?? 0) + 1));
    const topSkills = [...skillCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { total, profs, mods, majors: majors.size, cities: cities.size, topSkills };
  }, [members]);

  const filtered = members.filter((m) => {
    if (roleFilter !== "all" && !m.roles.includes(roleFilter)) return false;
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(t) ||
      m.username?.toLowerCase().includes(t) ||
      m.bio?.toLowerCase().includes(t) ||
      m.major?.toLowerCase().includes(t) ||
      m.location?.toLowerCase().includes(t) ||
      (m.skills ?? []).some((s) => s.toLowerCase().includes(t))
    );
  });

  return (
    <>
      <Navbar />
      <main className="container py-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono mb-2">
            <Users className="h-3.5 w-3.5" />
            BATCH DIRECTORY
          </div>
          <h1 className="text-3xl font-bold">أعضاء الدفعة</h1>
          <p className="text-muted-foreground mt-1">تعرّف على زملائك واستكشف خبراتهم</p>
        </div>

        {/* Batch stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard icon={<Users className="h-4 w-4" />} label="الأعضاء" value={stats.total} accent="primary" />
          <StatCard icon={<GraduationCap className="h-4 w-4" />} label="الأساتذة" value={stats.profs} accent="success" />
          <StatCard icon={<Sparkles className="h-4 w-4" />} label="المشرفون" value={`${stats.mods}/5`} accent="warning" />
          <StatCard icon={<BookOpen className="h-4 w-4" />} label="تخصصات" value={stats.majors} accent="secondary" />
          <StatCard icon={<MapPin className="h-4 w-4" />} label="مدن" value={stats.cities} accent="primary" />
        </div>

        {stats.topSkills.length > 0 && (
          <Card className="mb-6 bg-card/60 backdrop-blur border-border/60">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-mono mb-2">أبرز مهارات الدفعة</div>
              <div className="flex flex-wrap gap-2">
                {stats.topSkills.map(([s, n]) => (
                  <Badge key={s} variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                    {s} <span className="text-muted-foreground ms-1">×{n}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم، التخصص، أو مهارة..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pe-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "member", "professor", "moderator", "admin"] as const).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={roleFilter === r ? "default" : "outline"}
                onClick={() => setRoleFilter(r as any)}
              >
                {r === "all" ? "الكل" : roleLabels[r as AppRole]}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">لا توجد نتائج مطابقة.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => {
              const initials = (m.full_name || m.username || "؟").trim().slice(0, 2);
              return (
                <Card
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="border-border/60 bg-card/60 backdrop-blur hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                        <AvatarImage src={m.avatar_url ?? undefined} alt={m.full_name ?? ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{m.full_name || "بدون اسم"}</h3>
                        <p className="text-xs text-muted-foreground truncate font-mono ltr text-left">@{m.username || "user"}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.roles.length === 0 ? (
                            <Badge variant="outline" className="text-[10px]">—</Badge>
                          ) : (
                            m.roles.map((r) => (
                              <Badge key={r} variant="outline" className={`text-[10px] ${roleColors[r]}`}>
                                {roleLabels[r]}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {(m.major || m.academic_year) && (
                      <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        {m.major && (
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {m.major}
                          </span>
                        )}
                        {m.academic_year && (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {m.academic_year}
                          </span>
                        )}
                      </div>
                    )}

                    {m.location && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {m.location}
                      </div>
                    )}

                    {(m.skills?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(m.skills ?? []).slice(0, 4).map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                            {s}
                          </Badge>
                        ))}
                        {(m.skills?.length ?? 0) > 4 && (
                          <Badge variant="outline" className="text-[10px]">+{(m.skills?.length ?? 0) - 4}</Badge>
                        )}
                      </div>
                    )}

                    {m.bio && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{m.bio}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Member detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right">بطاقة عضو</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                    <AvatarImage src={selected.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold">
                      {(selected.full_name || selected.username || "؟").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{selected.full_name || "بدون اسم"}</h3>
                    <p className="text-xs text-muted-foreground font-mono ltr text-left">@{selected.username}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.roles.map((r) => (
                        <Badge key={r} variant="outline" className={`text-[10px] ${roleColors[r]}`}>
                          {roleLabels[r]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {selected.bio && (
                  <p className="text-sm leading-relaxed text-muted-foreground border-r-2 border-primary/40 pe-3 ps-3 py-1">
                    {selected.bio}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selected.major && <Info icon={<BookOpen className="h-4 w-4" />} label="التخصص" value={selected.major} />}
                  {selected.academic_year && <Info icon={<GraduationCap className="h-4 w-4" />} label="السنة" value={selected.academic_year} />}
                  {selected.location && <Info icon={<MapPin className="h-4 w-4" />} label="الموقع" value={selected.location} />}
                  {selected.phone && <Info icon={<Phone className="h-4 w-4" />} label="الهاتف" value={selected.phone} />}
                </div>

                {(selected.skills?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">المهارات</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.skills!.map((s) => (
                        <Badge key={s} variant="outline" className="bg-primary/5 border-primary/20 text-primary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(selected.interests?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5">الاهتمامات</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.interests!.map((s) => (
                        <Badge key={s} variant="outline" className="bg-secondary/5 border-secondary/20 text-secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {selected.github_url && (
                    <a href={selected.github_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <Github className="ms-1 h-4 w-4" />
                        GitHub
                      </Button>
                    </a>
                  )}
                  {selected.linkedin_url && (
                    <a href={selected.linkedin_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <Linkedin className="ms-1 h-4 w-4" />
                        LinkedIn
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="truncate">{value}</div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: "primary" | "secondary" | "success" | "warning";
}) {
  const colors: Record<string, string> = {
    primary: "text-primary border-primary/20 bg-primary/5",
    secondary: "text-secondary border-secondary/20 bg-secondary/5",
    success: "text-success border-success/20 bg-success/5",
    warning: "text-warning border-warning/20 bg-warning/5",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[accent]}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 font-mono">{value}</div>
    </div>
  );
}
