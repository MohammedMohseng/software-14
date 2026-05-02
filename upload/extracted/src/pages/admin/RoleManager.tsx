// Role management — extracted from Admin.tsx to support multi-tab admin layout.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/hooks/useUserRoles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

const ALL_ROLES: AppRole[] = ["visitor", "member", "professor", "moderator", "admin"];

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

type Row = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  roles: AppRole[];
};

export default function RoleManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [picker, setPicker] = useState<Record<string, AppRole>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      map.set(r.user_id, arr);
    });
    setRows(
      (profiles ?? []).map((p: any) => ({
        ...p,
        roles: map.get(p.id) ?? [],
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addRole = async (userId: string, role: AppRole) => {
    setBusy(userId + ":" + role);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    setBusy(null);
    if (error) {
      toast({
        title: "تعذّر إضافة الدور",
        description: error.message.includes("Maximum")
          ? "وصلنا للحد الأقصى من المشرفين (5)"
          : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "تمت الإضافة", description: `تم منح الدور: ${roleLabels[role]}` });
    load();
  };

  const removeRole = async (userId: string, role: AppRole) => {
    setBusy(userId + ":" + role);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    setBusy(null);
    if (error) {
      toast({ title: "تعذّر الحذف", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم الحذف", description: `تم سحب دور: ${roleLabels[role]}` });
    load();
  };

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return r.full_name?.toLowerCase().includes(t) || r.username?.toLowerCase().includes(t);
  });

  const modCount = rows.reduce((acc, r) => acc + (r.roles.includes("moderator") ? 1 : 0), 0);

  return (
    <Card className="bg-card/60 backdrop-blur border-border/60">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <CardTitle>إدارة الأدوار</CardTitle>
            <CardDescription>
              المشرفون الحاليون: <span className="font-mono text-warning">{modCount}/5</span>
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} className="pe-10" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((row) => {
              const initials = (row.full_name || row.username || "؟").trim().slice(0, 2);
              const available = ALL_ROLES.filter((r) => !row.roles.includes(r));
              const selected = picker[row.id] ?? available[0];
              return (
                <li key={row.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={row.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{row.full_name || "بدون اسم"}</div>
                      <div className="text-xs text-muted-foreground font-mono ltr text-left truncate">
                        @{row.username || "user"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {row.roles.length === 0 ? (
                      <Badge variant="outline" className="text-[10px]">بدون دور</Badge>
                    ) : (
                      row.roles.map((r) => (
                        <Badge key={r} variant="outline" className={`text-[10px] gap-1 ${roleColors[r]}`}>
                          {roleLabels[r]}
                          <button
                            onClick={() => removeRole(row.id, r)}
                            disabled={busy === row.id + ":" + r}
                            className="hover:text-destructive transition-colors"
                            aria-label={`حذف دور ${roleLabels[r]}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  {available.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selected}
                        onValueChange={(v) => setPicker({ ...picker, [row.id]: v as AppRole })}
                      >
                        <SelectTrigger className="w-[120px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {available.map((r) => (
                            <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => addRole(row.id, selected)}
                        disabled={busy === row.id + ":" + selected}
                      >
                        <Plus className="ms-1 h-4 w-4" />
                        إضافة
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
