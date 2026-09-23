import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dubai Abaya · معرض العبايات والجلابيات الفاخرة" },
      {
        name: "description",
        content:
          "متجر Dubai Abaya الرقمي: عبايات وجلابيات فاخرة بتصاميم دبي، تجربة تسوق بصرية ثلاثية الأبعاد بلمسة لافندر أنيقة.",
      },
      { property: "og:title", content: "Dubai Abaya · معرض العبايات الفاخرة" },
      {
        property: "og:description",
        content: "عبايات وجلابيات فاخرة بتصاميم دبي في معرض رقمي ثلاثي الأبعاد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Index() {
  const { state } = useStore();
  const featured = state.products.slice(0, 16);

  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-hidden">

      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 1, ease, delay: 0.15 }}
        style={{ originY: 0 }}
        className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-b from-accent to-background"
      />

      <SiteHeader />

      <main id="top">
        <section className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-5 pt-28 pb-4 md:pt-32 md:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.2 }}
            className="w-full text-center"
          >
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/products"
                className="tap-pulse rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft"
              >
                اكتشفي المجموعة
              </Link>
              <Link
                to="/offers"
                className="tap-pulse glass rounded-full px-5 py-2 text-sm font-bold text-accent-foreground"
              >
                العروض الحالية
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Showcase Area */}
        {state.showcase?.mainImage && (
          <section className="mx-auto max-w-6xl px-5 py-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease }}
              className="flex flex-col gap-4"
            >
              {state.showcase.link ? (
                <Link to={state.showcase.link} className="w-full aspect-[4/5] sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl relative group block cursor-pointer">
                  <img 
                    src={state.showcase.mainImage} 
                    alt="عرض مميز" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </Link>
              ) : (
                <div className="w-full aspect-[4/5] sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl relative group">
                  <img 
                    src={state.showcase.mainImage} 
                    alt="عرض مميز" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </div>
              )}

              {state.showcase.gallery && state.showcase.gallery.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                  {state.showcase.gallery.map((img, idx) => {
                    const content = (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="aspect-square rounded-2xl overflow-hidden shadow-md group"
                      >
                        <img 
                          src={img} 
                          alt={`صورة فرعية ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </motion.div>
                    );
                    
                    return state.showcase.link ? (
                      <Link key={idx} to={state.showcase.link} className="block cursor-pointer">
                        {content}
                      </Link>
                    ) : content;
                  })}
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* Collection */}
        <section id="collection" className="mx-auto max-w-6xl px-5 py-10">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-6 text-center"
          >
            <p className="text-xs tracking-[0.4em] text-primary uppercase">Collection</p>
            <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl">
              قطع مختارة بعناية
            </h2>
          </motion.header>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>

        {/* Craft */}
        <section id="craft" className="mx-auto max-w-6xl px-5 py-10">
          <div className="glass-strong grid gap-8 rounded-4xl p-8 sm:p-12 md:grid-cols-3">
            {[
              { t: "أقمشة نادرة", d: "حرير وشيفون مختار من أرقى دور النسيج." },
              { t: "تفصيل يدوي", d: "كل غرزة تُنفَّذ يدوياً في أتيليه دبي." },
              { t: "توصيل مخملي", d: "تغليف فاخر وتسليم خلال ٤٨ ساعة." },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.1 }}
                className="tap-pulse rounded-3xl bg-background/60 p-6 shadow-neu"
              >
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-display mt-4 text-lg font-bold">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        {(() => {
          const allReviews = state.products.flatMap(p => p.reviews || []).slice(0, 6);
          if (allReviews.length === 0) return null;
          return (
            <section className="mx-auto max-w-6xl px-5 py-10">
              <motion.header
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
                className="mb-6 text-center"
              >
                <p className="text-xs tracking-[0.4em] text-primary uppercase">Testimonials</p>
                <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl">
                  آراء عملائنا
                </h2>
              </motion.header>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {allReviews.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                    className="glass rounded-3xl p-6"
                  >
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <svg key={idx} className={`size-4 ${idx < r.rating ? "fill-current" : "text-border fill-transparent"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-6">"{r.text}"</p>
                    <p className="text-xs font-bold text-muted-foreground">{r.name}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Story */}
        <section id="story" className="mx-auto max-w-3xl px-5 py-10 text-center">
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="font-display text-2xl leading-[1.6] font-bold sm:text-3xl"
          >
            «الأناقة ليست ما ترتدينه، بل الأثر الذي تتركينه حين تمرّين.»
          </motion.blockquote>
          <p className="mt-6 text-sm tracking-[0.3em] text-muted-foreground uppercase">
            Dubai Abaya Atelier
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
