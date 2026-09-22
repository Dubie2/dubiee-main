import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Upload, Loader2, Star, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard, uploadImageFile } from "@/components/admin/AdminUI";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/showcase")({
  component: AdminShowcase,
});

function AdminShowcase() {
  const { state, refreshData } = useStore();
  const { showcase } = state;
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for edits
  const [mainImage, setMainImage] = useState(showcase?.mainImage || "");
  const [gallery, setGallery] = useState<string[]>(showcase?.gallery || []);

  const handleUploadMain = async (file: File) => {
    setIsUploadingMain(true);
    try {
      await uploadImageFile(file, (url) => {
        setMainImage(url);
      });
    } catch (e) {
      toast.error("فشل رفع الصورة الرئيسية");
    } finally {
      setIsUploadingMain(false);
    }
  };

  const handleUploadGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        await new Promise<void>((resolve) => {
          uploadImageFile(file, (url) => {
            urls.push(url);
            resolve();
          });
        });
      }
      if (urls.length > 0) {
        setGallery((prev) => [...prev, ...urls]);
      }
    } catch (e) {
      toast.error("حدث خطأ أثناء رفع الصور");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key_name: "showcaseMain", key_value: mainImage },
        { key_name: "showcaseGallery", key_value: JSON.stringify(gallery) },
      ];

      for (const u of updates) {
        const { error } = await supabase.from("system_settings").upsert(u, { onConflict: "key_name" });
        if (error) throw error;
      }

      toast.success("تم حفظ إعدادات الواجهة بنجاح!");
      await refreshData();
    } catch (e: any) {
      toast.error("حدث خطأ أثناء الحفظ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminCard title="إعدادات واجهة المتجر (الرئيسية)">
      <div className="space-y-8">
        {/* Main Image */}
        <div>
          <h3 className="font-bold text-lg mb-2">الصورة الرئيسية (العرض الكبير)</h3>
          <p className="text-xs text-muted-foreground mb-4">هذه الصورة ستظهر كأول عنصر في الصفحة الرئيسية لتعرض أفضل منتجاتك أو عروضك.</p>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-full sm:w-1/2 aspect-[4/5] sm:aspect-[21/9] rounded-3xl border-2 border-dashed border-border flex items-center justify-center bg-background/50 overflow-hidden relative">
              {mainImage ? (
                <img src={mainImage} className="w-full h-full object-cover" alt="Main Showcase" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                  <ImageIcon className="size-12" />
                  <span className="text-sm font-medium">لم يتم رفع صورة رئيسية</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="tap-pulse flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition">
                {isUploadingMain ? (
                  <><Loader2 className="size-4 animate-spin" /> جاري الرفع...</>
                ) : (
                  <><Upload className="size-4" /> رفع صورة جديدة</>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingMain}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleUploadMain(e.target.files[0]);
                  }}
                />
              </label>
              {mainImage && (
                <AdminButton tone="danger" onClick={() => setMainImage("")}>
                  إزالة الصورة
                </AdminButton>
              )}
            </div>
          </div>
        </div>

        <hr className="border-border/50" />

        {/* Gallery Images */}
        <div>
          <h3 className="font-bold text-lg mb-2">الصور الفرعية (أسفل الصورة الرئيسية)</h3>
          <p className="text-xs text-muted-foreground mb-4">أضف صوراً إضافية لزوايا مختلفة أو لمنتجات مشابهة تظهر مباشرة تحت العرض الرئيسي.</p>
          
          <div className="mb-4">
            <label className="tap-pulse inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary bg-primary/10 px-6 py-3 text-sm font-bold text-primary hover:bg-primary/20 transition">
              {isUploadingGallery ? (
                <><Loader2 className="size-4 animate-spin" /> جاري الرفع...</>
              ) : (
                <><Plus className="size-4" /> إضافة صور فرعية</>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                disabled={isUploadingGallery}
                className="hidden"
                onChange={(e) => handleUploadGallery(e.target.files)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-4">
            {gallery.length === 0 ? (
              <p className="text-sm text-muted-foreground w-full p-4 border border-dashed rounded-xl text-center">
                لا توجد صور فرعية حالياً.
              </p>
            ) : (
              gallery.map((img, idx) => (
                <div key={idx} className="group relative size-32 rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
                  <img src={img} className="w-full h-full object-cover" alt={`Sub ${idx}`} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      title="حذف"
                      onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))}
                      className="grid size-8 place-items-center rounded-full bg-destructive text-white hover:scale-110 transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <AdminButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات نهائياً"}
          </AdminButton>
        </div>
      </div>
    </AdminCard>
  );
}
