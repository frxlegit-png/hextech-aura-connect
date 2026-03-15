import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Users, Wifi, Gauge } from "lucide-react";

const metrics = [
  { icon: MapPin, value: 20, suffix: "+", label: "Connected Locations" },
  { icon: Users, value: 300, suffix: "+", label: "Active Users" },
  { icon: Wifi, value: 99.9, suffix: "%", label: "Network Uptime", decimals: 1 },
  { icon: Gauge, value: 25, suffix: "Mbps", label: "Average Speed" },
];

const CountUp = ({ target, suffix = "", decimals = 0 }: { target: number; suffix: string; decimals?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
};

const AnimatedMetrics = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 lg:py-32 section-purple overflow-hidden">
      <div className="container mx-auto px-6" ref={containerRef}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-accent text-sm font-semibold uppercase tracking-widest mb-4 font-display">
            Network Stats
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground font-display">
            Powering <span className="text-primary">Digital Lives</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="glass-card p-8 rounded-2xl text-center group hover:border-primary/30 transition-colors duration-500"
            >
              <motion.div
                className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
                whileHover={{ scale: 1.1, backgroundColor: "hsl(183 100% 50% / 0.2)" }}
                transition={{ duration: 0.2 }}
              >
                <metric.icon className="w-7 h-7 text-primary" />
              </motion.div>
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 font-display">
                <CountUp target={metric.value} suffix={metric.suffix} decimals={metric.decimals} />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnimatedMetrics;
