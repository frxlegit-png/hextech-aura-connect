import { Button } from "@/components/ui/button";
import { Wifi, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteContent } from "@/hooks/useSiteContent";

const HeroSection = () => {
  const { getSection } = useSiteContent();
  const heroContent = getSection('hero');

  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating hexagons */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 opacity-10"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <polygon
              points="50,5 93,25 93,75 50,95 7,75 7,25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </motion.div>
        <motion.div 
          className="absolute top-1/3 right-1/4 w-48 h-48 opacity-5"
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -5, 0],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1 
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <polygon
              points="50,5 93,25 93,75 50,95 7,75 7,25"
              fill="currentColor"
            />
          </svg>
        </motion.div>
        <motion.div 
          className="absolute bottom-1/4 right-1/3 w-32 h-32 opacity-10"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2 
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <polygon
              points="50,5 93,25 93,75 50,95 7,75 7,25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
        
        {/* Gradient orbs */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              {heroContent?.subtitle || "Next-Gen Wireless Internet"}
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
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
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {heroContent?.description || "Experience ultra-fast, reliable wireless connectivity that keeps you connected 24/7. No cables, no limits, just pure speed."}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="hero" size="xl" asChild>
                <a href="#contact" className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Get Connected
                </a>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="heroOutline" size="xl" asChild>
                <a href="#services">View Plans</a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature badges */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {[
              { icon: Wifi, label: "High Speed" },
              { icon: Shield, label: "99.9% Uptime" },
              { icon: Zap, label: "Instant Setup" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-secondary/30 border border-border/30"
                whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary) / 0.5)" }}
                transition={{ duration: 0.2 }}
              >
                <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
