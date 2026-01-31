import { Button } from "@/components/ui/button";
import { Check, Zap, Star } from "lucide-react";

const ServicesSection = () => {
  const features = [
    "Unlimited data, no throttling",
    "High-speed wireless connection",
    "Low latency for gaming & streaming",
    "24/7 network monitoring",
    "No equipment costs",
    "No setup fees",
    "Free professional installation",
    "Dedicated customer support",
  ];

  return (
    <section id="services" className="relative py-24 lg:py-32 bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            One Plan. <span className="text-primary">Unlimited Internet.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No complicated tiers, no hidden fees. Just fast, reliable internet at an unbeatable price.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-xl mx-auto">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-3xl blur-xl opacity-30 animate-pulse" />
            
            <div className="glass-card relative p-8 md:p-12 rounded-3xl gradient-border">
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  Most Popular
                </div>
              </div>

              {/* Plan Header */}
              <div className="text-center mb-10 pt-4">
                <h3 className="text-2xl font-bold text-foreground mb-2">Unlimited Plan</h3>
                <p className="text-muted-foreground mb-6">Everything you need, nothing you don't</p>
                
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl md:text-7xl font-bold text-foreground">$30</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button variant="hero" size="xl" className="w-full" asChild>
                <a href="#contact" className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Get Started Today
                </a>
              </Button>

              {/* Note */}
              <p className="text-center text-xs text-muted-foreground mt-6">
                No contracts. Cancel anytime. Service available in covered areas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
