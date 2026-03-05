import { Button } from "@/components/ui/button";
import { Check, Zap, Star, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const ServicesSection = () => {
  const features = [
    "Unlimited data, no throttling",
    "High-speed wireless connection",
    "Low latency for gaming & streaming",
    "24/7 network monitoring",
    "Free equipment loan (company-owned)",
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
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            One Plan. <span className="text-primary">Unlimited Internet.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No complicated tiers, no hidden fees. Just fast, reliable internet at an unbeatable price.
          </p>
        </ScrollReveal>

        {/* Pricing Cards Container */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Main Pricing Card */}
          <ScrollReveal delay={0.1}>
            <div className="relative h-full">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-3xl blur-xl opacity-30 animate-pulse" />
              
              <motion.div 
                className="glass-card relative pt-12 p-8 rounded-3xl gradient-border h-full"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {/* Popular badge */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Most Popular
                  </div>
                </div>

                {/* Plan Header */}
                <div className="text-center mb-8 pt-4">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Unlimited Plan</h3>
                  <p className="text-muted-foreground mb-6">Everything you need, nothing you don't</p>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl md:text-6xl font-bold text-foreground">$29.99</span>
                    <span className="text-xl text-muted-foreground">/month</span>
                  </div>
                </div>

                {/* Features */}
                <StaggerContainer className="grid gap-3 mb-8">
                  {features.slice(0, 6).map((feature, index) => (
                    <StaggerItem key={index}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="hero" size="xl" className="w-full" asChild>
                    <a href="#contact" className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      Get Started Today
                    </a>
                  </Button>
                </motion.div>

                {/* Note */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                  No contracts. Cancel anytime. Service available in covered areas.
                </p>
              </motion.div>
            </div>
          </ScrollReveal>

          {/* Equipment Insurance Card */}
          <ScrollReveal delay={0.2}>
            <motion.div 
              className="glass-card relative pt-12 p-8 rounded-3xl border border-border/50 h-full flex flex-col"
              whileHover={{ y: -5, borderColor: "hsl(var(--primary) / 0.3)" }}
              transition={{ duration: 0.3 }}
            >
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold shadow-lg">
                  <Shield className="w-3.5 h-3.5" />
                  Required
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8 pt-4">
                <h3 className="text-2xl font-bold text-foreground mb-2">Equipment Insurance</h3>
                <p className="text-muted-foreground mb-6">Mandatory cover for your loaned equipment</p>
                
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl md:text-6xl font-bold text-foreground">$24.99</span>
                  <span className="text-xl text-muted-foreground">one-time</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4 mb-8 flex-grow">
                {[
                  "Covers damage to company-owned equipment",
                  "Protection against accidental damage",
                  "Lightning & surge protection",
                  "24-hour replacement guarantee",
                  "No deductibles or hidden fees",
                  "Transferable if you move",
                ].map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="heroOutline" size="xl" className="w-full" asChild>
                  <a href="#contact" className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Get Started
                  </a>
                </Button>
              </motion.div>

              {/* Note */}
              <p className="text-center text-xs text-muted-foreground mt-6">
                One-time payment required at signup. Covers all loaned equipment.
              </p>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
