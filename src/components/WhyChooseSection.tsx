import { Zap, Shield, HeadphonesIcon, DollarSign, Wifi, TrendingUp } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const WhyChooseSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const benefits = [
    { icon: DollarSign, title: "No Setup Fees", description: "Get started without any upfront costs. We believe in making connectivity accessible to everyone." },
    { icon: Shield, title: "Free Equipment Loan", description: "We provide all equipment at no cost — it remains our property, so you never worry about buying or replacing hardware." },
    { icon: TrendingUp, title: "Reliable Uptime", description: "Our network maintains 99.9% uptime with redundant systems ensuring you stay connected." },
    { icon: HeadphonesIcon, title: "Fast Support", description: "Our dedicated support team is available to help you with any issues, anytime." },
    { icon: Wifi, title: "Scalable Network", description: "As your needs grow, our network grows with you. Upgrade seamlessly without interruption." },
    { icon: Zap, title: "Low Latency", description: "Optimized for real-time applications. Perfect for gaming, video calls, and streaming." },
  ];

  return (
    <section id="why-us" className="relative py-24 lg:py-32 section-gradient" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4 font-display">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">
            Built for <span className="text-primary">Performance</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We've designed every aspect of our service to deliver the best possible internet experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <motion.div
                className="glass-card h-full p-8 rounded-2xl transition-all duration-500 group"
                whileHover={{
                  boxShadow: "0 0 40px hsl(183 100% 50% / 0.08)",
                  borderColor: "hsl(183 100% 50% / 0.25)",
                }}
              >
                <motion.div
                  className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <benefit.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-3 font-display">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
