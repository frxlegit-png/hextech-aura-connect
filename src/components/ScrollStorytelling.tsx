import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ScrollStorytelling = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity1 = useTransform(scrollYProgress, [0, 0.2, 0.35], [0, 1, 0]);
  const y1 = useTransform(scrollYProgress, [0, 0.2, 0.35], [80, 0, -40]);

  const opacity2 = useTransform(scrollYProgress, [0.25, 0.45, 0.6], [0, 1, 0]);
  const y2 = useTransform(scrollYProgress, [0.25, 0.45, 0.6], [80, 0, -40]);

  const opacity3 = useTransform(scrollYProgress, [0.5, 0.7, 0.85], [0, 1, 0]);
  const y3 = useTransform(scrollYProgress, [0.5, 0.7, 0.85], [80, 0, -40]);

  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="relative" style={{ height: "300vh" }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 hero-gradient" />
        
        {/* Progress line */}
        <motion.div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 h-px bg-primary/30"
          style={{ width: lineWidth, maxWidth: "60%" }}
        />
        {/* Progress dots */}
        <div className="absolute bottom-[76px] left-1/2 -translate-x-1/2 flex gap-[29vw] md:gap-[19vw]">
          {[0.2, 0.45, 0.7].map((threshold, i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full border border-primary/40"
              style={{
                backgroundColor: useTransform(scrollYProgress, [threshold - 0.05, threshold], ["transparent", "#00F5FF"]),
              }}
            />
          ))}
        </div>

        {/* Frame 1 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{ opacity: opacity1, y: y1 }}
        >
          <div className="text-center max-w-3xl">
            <motion.div className="w-16 h-px bg-primary mx-auto mb-8" />
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground font-display tracking-tight mb-6">
              The Future of
              <br />
              <span className="text-primary glow-text">Connectivity</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Where speed meets reliability. Where technology serves humanity.
            </p>
          </div>
        </motion.div>

        {/* Frame 2 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{ opacity: opacity2, y: y2 }}
        >
          <div className="text-center max-w-3xl">
            <motion.div className="w-16 h-px bg-accent mx-auto mb-8" />
            <h2 className="text-4xl md:text-6xl font-bold text-foreground font-display tracking-tight mb-6">
              Hextech builds
              <br />
              <span className="text-accent">digital infrastructure</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Advanced wireless networks connecting communities across Zimbabwe.
            </p>
          </div>
        </motion.div>

        {/* Frame 3 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{ opacity: opacity3, y: y3 }}
        >
          <div className="text-center max-w-3xl">
            <motion.div className="w-16 h-px bg-primary mx-auto mb-8" />
            <h2 className="text-4xl md:text-6xl font-bold text-foreground font-display tracking-tight mb-6">
              Expanding coverage.
              <br />
              <span className="text-primary">Connecting lives.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From urban centers to rural communities — fast, stable internet for everyone.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScrollStorytelling;
