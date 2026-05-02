import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpenCheck, ExternalLink, FileText, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Resource = {
  id: string;
  uploader_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  resource_type: string;
  url: string;
  created_at: string;
};

export default function Academic() {
  const { user } = useAuth();
  const { isProfessor, isModerator, isAdmin } = useUserRoles();
  const canUpload = isProfessor || isModerator || isAdmin;

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    resource_type: "link",
    url: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("فشل تحميل الموارد");
    setResources(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("العنوان والرابط مطلوبان");
      return;
    }
    const { error } = await supabase.from("resources").insert({
      uploader_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject: form.subject.trim() || null,
      resource_type: form.resource_type,
      url: form.url.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تمت الإضافة");
    setOpen(false);
    setForm({ title: "", description: "", subject: "", resource_type: "link", url: "" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setResources((prev) => prev.filter((r) => r.id !== id));
    toast.success("تم الحذف");
  };

  const filtered = resources.filter((r) => {
    if (filter !== "all" && r.resource_type !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      (r.subject ?? "").toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-success mb-2">
              <BookOpenCheck className="h-4 w-4" />
              ACADEMIC HUB
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">المكتبة الأكاديمية</h1>
            <p className="text-muted-foreground mt-2">محاضرات، ملخصات، وروابط تعليمية للدفعة.</p>
          </div>
          {canUpload && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                  <Plus className="ms-1 h-4 w-4" />
                  إضافة مورد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>مورد جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="العنوان"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <Input
                    placeholder="المادة (مثلاً: قواعد البيانات)"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                  <Textarea
                    placeholder="وصف مختصر (اختياري)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                  <Select
                    value={form.resource_type}
                    onValueChange={(v) => setForm({ ...form, resource_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">رابط تعليمي</SelectItem>
                      <SelectItem value="pdf">ملف PDF</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="https://..."
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                  <Button onClick={submit} className="w-full">
                    حفظ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Input
            placeholder="ابحث بالعنوان أو المادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-md"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="link">روابط</SelectItem>
              <SelectItem value="pdf">ملفات PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card className="bg-card/40 border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              لا توجد موارد بعد.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <Card key={r.id} className="bg-card/60 border-border/60 hover:border-primary/40 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {r.resource_type === "pdf" ? (
                        <FileText className="h-5 w-5 text-secondary" />
                      ) : (
                        <LinkIcon className="h-5 w-5 text-primary" />
                      )}
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {r.resource_type.toUpperCase()}
                      </Badge>
                    </div>
                    {(user?.id === r.uploader_id || isModerator) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => remove(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <h3 className="font-bold text-base mb-1">{r.title}</h3>
                  {r.subject && (
                    <div className="text-xs text-primary mb-2">{r.subject}</div>
                  )}
                  {r.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {r.description}
                    </p>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={r.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="ms-1 h-3.5 w-3.5" />
                      فتح
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
