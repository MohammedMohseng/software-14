import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Trash2, X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

type Album = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
};

type Photo = {
  id: string;
  album_id: string;
  uploader_id: string;
  url: string;
  caption: string | null;
};

export default function Gallery() {
  const { user } = useAuth();
  const { isModerator } = useUserRoles();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [albumForm, setAlbumForm] = useState({ title: "", description: "", cover_url: "" });
  const [albumOpen, setAlbumOpen] = useState(false);

  const [photoForm, setPhotoForm] = useState({ url: "", caption: "" });
  const [photoOpen, setPhotoOpen] = useState(false);

  const loadAlbums = async () => {
    setLoading(true);
    const { data } = await supabase.from("albums").select("*").order("created_at", { ascending: false });
    setAlbums(data ?? []);
    setLoading(false);
  };

  const loadPhotos = async (albumId: string) => {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("album_id", albumId)
      .order("created_at", { ascending: false });
    setPhotos(data ?? []);
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
    if (activeAlbum) loadPhotos(activeAlbum.id);
  }, [activeAlbum]);

  const createAlbum = async () => {
    if (!user) return;
    if (!albumForm.title.trim()) return toast.error("العنوان مطلوب");
    const { error } = await supabase.from("albums").insert({
      owner_id: user.id,
      title: albumForm.title.trim(),
      description: albumForm.description.trim() || null,
      cover_url: albumForm.cover_url.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الألبوم");
    setAlbumOpen(false);
    setAlbumForm({ title: "", description: "", cover_url: "" });
    loadAlbums();
  };

  const addPhoto = async () => {
    if (!user || !activeAlbum) return;
    if (!photoForm.url.trim()) return toast.error("رابط الصورة مطلوب");
    const { error } = await supabase.from("photos").insert({
      album_id: activeAlbum.id,
      uploader_id: user.id,
      url: photoForm.url.trim(),
      caption: photoForm.caption.trim() || null,
    });
    if (error) return toast.error(error.message);
    setPhotoOpen(false);
    setPhotoForm({ url: "", caption: "" });
    loadPhotos(activeAlbum.id);
  };

  const deleteAlbum = async (id: string) => {
    const { error } = await supabase.from("albums").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setAlbums((prev) => prev.filter((a) => a.id !== id));
    if (activeAlbum?.id === id) setActiveAlbum(null);
  };

  const deletePhoto = async (id: string) => {
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + photos.length) % photos.length,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, photos.length]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container py-8 md:py-12">
        {!activeAlbum ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono text-primary mb-2">
                  <ImageIcon className="h-4 w-4" />
                  GALLERY
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">معرض الصور</h1>
                <p className="text-muted-foreground mt-2">ألبومات الذكريات والمناسبات.</p>
              </div>
              {user && (
                <Dialog open={albumOpen} onOpenChange={setAlbumOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                      <Plus className="ms-1 h-4 w-4" />
                      ألبوم جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء ألبوم</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder="عنوان الألبوم"
                        value={albumForm.title}
                        onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="وصف (اختياري)"
                        value={albumForm.description}
                        onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                      />
                      <Input
                        placeholder="رابط صورة الغلاف (اختياري)"
                        value={albumForm.cover_url}
                        onChange={(e) => setAlbumForm({ ...albumForm, cover_url: e.target.value })}
                      />
                      <Button onClick={createAlbum} className="w-full">إنشاء</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {loading ? (
              <div className="text-center text-muted-foreground py-12">جارٍ التحميل...</div>
            ) : albums.length === 0 ? (
              <Card className="bg-card/40 border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  لا توجد ألبومات بعد.
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {albums.map((a) => (
                  <Card
                    key={a.id}
                    className="group overflow-hidden cursor-pointer bg-card/60 border-border/60 hover:border-primary/40 transition-all"
                    onClick={() => setActiveAlbum(a)}
                  >
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {a.cover_url ? (
                        <img
                          src={a.cover_url}
                          alt={a.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold">{a.title}</h3>
                        {(user?.id === a.owner_id || isModerator) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAlbum(a.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {a.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 mb-6">
              <Button variant="ghost" onClick={() => setActiveAlbum(null)}>
                <ArrowRight className="ms-1 h-4 w-4" />
                كل الألبومات
              </Button>
              {user && (
                <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                      <Plus className="ms-1 h-4 w-4" />
                      صورة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة صورة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        placeholder="رابط الصورة"
                        value={photoForm.url}
                        onChange={(e) => setPhotoForm({ ...photoForm, url: e.target.value })}
                      />
                      <Input
                        placeholder="تعليق (اختياري)"
                        value={photoForm.caption}
                        onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                      />
                      <Button onClick={addPhoto} className="w-full">إضافة</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">{activeAlbum.title}</h1>
              {activeAlbum.description && (
                <p className="text-muted-foreground mt-1">{activeAlbum.description}</p>
              )}
            </div>

            {photos.length === 0 ? (
              <Card className="bg-card/40 border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  لا توجد صور في هذا الألبوم.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img
                      src={p.url}
                      alt={p.caption ?? ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    {(user?.id === p.uploader_id || isModerator) && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhoto(p.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) =>
                  i === null ? null : (i - 1 + photos.length) % photos.length,
                );
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[90vh]">
              <img
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].caption ?? ""}
                className="max-w-full max-h-[85vh] object-contain"
              />
              {photos[lightboxIndex].caption && (
                <p className="text-center text-white mt-3">{photos[lightboxIndex].caption}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
