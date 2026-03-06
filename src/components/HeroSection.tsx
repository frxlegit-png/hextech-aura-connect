import { Button } from "@/components/ui/button";
import { Wifi, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteContent } from "@/hooks/useSiteContent";
import { lazy, Suspense } from "react";

const Scene3D = lazy(() => import("@/components/Scene3D"));

const HeroSection = () => {
  const { getSection } = useSiteContent();
  const heroContent = getSection('hero');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Deep dark base */}
      <div className="absolute inset-0 hero-gradient" />

      {/* 3D Scene */}
      <Suspense fallback={null}>
        <Scene3D className="opacity-60" />
      </Suspense>

      {/* Gradient orbs */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(183 100% 50% / 0.06), transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(256 100% 62% / 0.04), transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 backdrop-blur-sm mb-8"
            style={{ background: "hsl(0 0% 6% / 0.6)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground font-display">
              {heroContent?.subtitle || "Next-Gen Wireless Internet"}
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-8 font-display leading-[0.95]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {heroContent?.title ? (
              <span className="text-foreground">
                {heroContent.title.split('.')[0]}
                {heroContent.title.includes('.') && (
                  <>
                    <br />
                    <span className="text-primary glow-text">{heroContent.title.split('.').slice(1).join('.')}</span>
                  </>
                )}
              </span>
            ) : (
              <>
                <span className="text-foreground">Internet at the</span>
                <br />
                <span className="text-primary glow-text">Speed of Light</span>
              </>
            )}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {heroContent?.description || "Experience ultra-fast, reliable wireless connectivity that keeps you connected 24/7. No cables, no limits, just pure speed."}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="hero" size="xl" asChild>
                <a href="#contact" className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Get Connected
                </a>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="heroOutline" size="xl" asChild>
                <a href="#services">View Plans</a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {[
              { icon: Wifi, label: "High Speed" },
              { icon: Shield, label: "99.9% Uptime" },
              { icon: Zap, label: "Instant Setup" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/30"
                style={{ background: "hsl(0 0% 6% / 0.5)" }}
                whileHover={{ scale: 1.05, borderColor: "hsl(183 100% 50% / 0.4)" }}
                transition={{ duration: 0.25 }}
              >
                <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground font-display whitespace-nowrap">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-display">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
