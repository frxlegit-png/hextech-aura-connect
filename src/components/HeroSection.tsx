import { Button } from "@/components/ui/button";
import { Wifi, Zap, Shield } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating hexagons */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 opacity-10 animate-float">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <polygon
              points="50,5 93,25 93,75 50,95 7,75 7,25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 opacity-5 animate-float" style={{ animationDelay: "2s" }}>
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <polygon
              points="50,5 93,25 93,75 50,95 7,75 7,25"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="absolute bottom-1/4 right-1/3 w-32 h-32 opacity-10 animate-float" style={{ animationDelay: "4s" }}>
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <polygon
              points="50,5 93,25 93,75 50,95 7,75 7,25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm mb-8 animate-fade-up">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Next-Gen Wireless Internet</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-fade-up-delay-1">
            <span className="text-foreground">Internet at the</span>
            <br />
            <span className="text-primary glow-text">Speed of Light</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up-delay-2">
            Experience ultra-fast, reliable wireless connectivity that keeps you connected 24/7. 
            No cables, no limits, just pure speed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up-delay-3">
            <Button variant="hero" size="xl" asChild>
              <a href="#contact" className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Get Connected
              </a>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <a href="#services">View Plans</a>
            </Button>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-16 animate-fade-up-delay-3">
            {[
              { icon: Wifi, label: "High Speed" },
              { icon: Shield, label: "99.9% Uptime" },
           
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-secondary/30 border border-border/30"
              >
                <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
