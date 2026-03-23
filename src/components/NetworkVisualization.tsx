import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CityNetworkCanvas from "./CityNetworkCanvas";

const NetworkVisualization = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section className="relative py-24 lg:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4 font-display">
            Network Architecture
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground font-display mb-4">
            A City, <span className="text-primary">Connected</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our distributed wireless network blankets the city with reliable, high-speed connectivity.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-border/30"
          style={{
            background: "linear-gradient(180deg, hsl(220 30% 4%) 0%, hsl(220 20% 7%) 60%, hsl(220 15% 10%) 100%)",
            height: "400px",
          }}
        >
          <Antigravity
            count={300}
            magnetRadius={36}
            ringRadius={10}
            waveSpeed={2.2}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color="#01c7fc"
            autoAnimate
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="capsule"
            fieldStrength={10}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default NetworkVisualization;
