import { Button } from "@/components/ui/button";
import { Check, Zap, Star, Shield, Package, Cable, Router, Radio } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ServicesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    "Unlimited data, no throttling",
    "High-speed wireless connection",
    "Low latency for gaming & streaming",
    "24/7 network monitoring",
    "Own your equipment — no rental fees, ever",
    "No setup fees",
    "Free professional installation",
    "Dedicated customer support",
  ];

  return (
    <section id="services" className="relative py-24 lg:py-32 bg-background" ref={ref}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(0 0% 2%), hsl(0 0% 4%), hsl(0 0% 2%))" }} />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4 font-display">
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">
            One Plan. <span className="text-primary">Unlimited Internet.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No complicated tiers, no hidden fees. Just fast, reliable internet at an unbeatable price.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Main Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative h-full"
          >
            <div className="absolute -inset-1 rounded-3xl blur-xl opacity-20"
              style={{ background: "linear-gradient(135deg, hsl(183 100% 50% / 0.4), hsl(256 100% 62% / 0.3))" }}
            />
            <motion.div
              className="glass-card relative pt-12 p-8 rounded-3xl gradient-border h-full"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg font-display">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Most Popular
                </div>
              </div>

              <div className="text-center mb-8 pt-4">
                <h3 className="text-2xl font-bold text-foreground mb-2 font-display">Unlimited Plan</h3>
                <p className="text-muted-foreground mb-6">Everything you need, nothing you don't</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl md:text-6xl font-bold text-foreground font-display">$24.99</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </div>

              <div className="grid gap-3 mb-8">
                {features.slice(0, 6).map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + index * 0.08 }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="hero" size="xl" className="w-full" asChild>
                  <a href="#contact" className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    Get Started Today
                  </a>
                </Button>
              </motion.div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                No contracts. Cancel anytime. Service available in covered areas.
              </p>
            </motion.div>
          </motion.div>

          {/* Starter Kit Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <motion.div
              className="glass-card relative pt-12 p-8 rounded-3xl h-full flex flex-col"
              whileHover={{ y: -4, borderColor: "hsl(183 100% 50% / 0.25)" }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg font-display">
                  <Package className="w-3.5 h-3.5" />
                  Starter Kit
                </div>
              </div>

              <div className="text-center mb-8 pt-4">
                <h3 className="text-2xl font-bold text-foreground mb-2 font-display">Complete Starter Kit</h3>
                <p className="text-muted-foreground mb-6">Everything you need to get online — yours to keep</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl md:text-6xl font-bold text-foreground font-display">$79.99</span>
                  <span className="text-xl text-muted-foreground">one-time</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                {[
                  { icon: Radio, text: "AC Client Station — outdoor receiver" },
                  { icon: Router, text: "300 Mbps indoor Wi-Fi router" },
                  { icon: Cable, text: "Outdoor-grade Ethernet cable" },
                  { icon: Check, text: "Yours to keep — no rental, no returns" },
                  { icon: Check, text: "Professional installation included" },
                  { icon: Check, text: "Backed by our hardware warranty" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + index * 0.08 }}
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <item.icon className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="heroOutline" size="xl" className="w-full" asChild>
                  <a href="#contact" className="flex items-center justify-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Your Kit
                  </a>
                </Button>
              </motion.div>

              <p className="text-center text-xs text-muted-foreground mt-6">
                One-time $79.99 at signup. Equipment is yours — no monthly rental fees.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
