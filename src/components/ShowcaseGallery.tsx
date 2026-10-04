import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Sparkles, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import type { Showcase } from "@/lib/store";

interface ShowcaseGalleryProps {
  showcase: Showcase;
}

export function ShowcaseGallery({ showcase }: ShowcaseGalleryProps) {
  const allImages = [showcase.mainImage, ...(showcase.gallery || [])].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 6 seconds if user is not hovering/interacting
  useEffect(() => {
    if (allImages.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % allImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [allImages.length, isPaused]);

  if (allImages.length === 0) return null;

  const currentImage = allImages[activeIndex] || allImages[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % allImages.length);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Editorial Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary backdrop-blur-md shadow-xs">
          <Sparkles className="size-3.5 animate-pulse" />
          <span>إطلالة الموسم الحصرية · Editorial Lookbook</span>
        </div>
        <h2 className="font-display mt-3 text-2xl font-black tracking-tight sm:text-4xl text-foreground">
          تفاصيل تأسر الأنظار بالفخامة
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          تصفحي زوايا العباية المختلفة بدقة استثنائية وجودة ملكية
        </p>
      </div>

      {/* Main Grid: Dual layout on large screens, stacked on mobile */}
      <div 
        className="grid gap-6 lg:grid-cols-12 lg:items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Main Stage (Large Image) */}
        <div className="lg:col-span-8 relative">
          {/* Ambient colorful backlight matching active dress */}
          <div className="absolute -inset-4 rounded-4xl bg-primary/15 blur-3xl -z-10 opacity-70 transition-all duration-700 pointer-events-none" />

          <div className="relative aspect-[3/4] sm:aspect-[4/5] md:aspect-[16/11] w-full overflow-hidden rounded-3xl border border-border/60 bg-secondary/30 shadow-2xl">
            {/* Animated Image with crossfade */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage}
                src={currentImage}
                alt="إطلالة العباية المميزة"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full object-cover object-top select-none"
              />
            </AnimatePresence>

            {/* Gradient Vignette overlay for text legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="الصورة السابقة"
                  className="tap-pulse absolute right-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 transition hover:bg-black/60 hover:scale-105"
                >
                  <ChevronRight className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="الصورة التالية"
                  className="tap-pulse absolute left-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 transition hover:bg-black/60 hover:scale-105"
                >
                  <ChevronLeft className="size-5" />
                </button>
              </>
            )}

            {/* Floating Glass Bottom Bar */}
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-black/50 p-3.5 text-white backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-primary/30 border border-primary/50 text-[11px] font-bold text-primary-foreground font-mono">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-xs font-bold text-white drop-shadow-sm">
                    زاوية العرض {activeIndex + 1} من {allImages.length}
                  </p>
                  <p className="text-[10px] text-white/70">
                    تصميم دبي الأصيل بأقمشة ملكية فاخرة
                  </p>
                </div>
              </div>

              {showcase.link && (
                <Link
                  to={showcase.link}
                  className="tap-pulse inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition"
                >
                  <span>تسوقي الإطلالة</span>
                  <ArrowLeft className="size-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel: Thumbnails & Quick Actions */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">
                زوايا وتفاصيل القطعة
              </h3>
              <span className="text-[11px] font-medium text-muted-foreground">
                اضغطي للمعاينة
              </span>
            </div>

            {/* Thumbnails grid */}
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-2.5 sm:gap-3">
              {allImages.map((img, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`group relative aspect-[3/4] overflow-hidden rounded-2xl border-2 transition-all duration-300 text-right cursor-pointer ${
                      isActive
                        ? "border-primary ring-2 ring-primary/40 shadow-md scale-102"
                        : "border-transparent opacity-75 hover:opacity-100 hover:border-border"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`تفصيل ${idx + 1}`}
                      className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                    />
                    
                    {/* Active Overlay Badge */}
                    {isActive ? (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-end p-1.5">
                        <span className="w-full text-center rounded-lg bg-primary py-0.5 text-[10px] font-extrabold text-primary-foreground shadow-xs">
                          معروضة
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="size-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Call to action card */}
          {showcase.link && (
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4.5 text-center">
              <p className="text-xs font-bold text-foreground">
                أعجبتكِ هذه الإطلالة؟
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                يمكنك طلبها بالمقاس واللون المناسب لكِ مباشرة
              </p>
              <Link
                to={showcase.link}
                className="tap-pulse mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-2.5 text-xs font-bold text-background transition hover:bg-foreground/90 shadow-sm"
              >
                <span>مشاهدة تفاصيل المنتج والطلب</span>
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
