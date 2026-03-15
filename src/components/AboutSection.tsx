import { Globe, Users, BarChart3 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

const CountStat = ({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericPart = value.replace(/[^0-9.]/g, "");
  const suffix = value.replace(/[0-9.]/g, "");
  const [count, setCount] = useState(0);
  const target = parseFloat(numericPart) || 0;

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target]);

  return (
    <motion.div
      ref={ref}
      className="text-center"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
      <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 font-display">
        {target % 1 !== 0 ? count.toFixed(1) : Math.floor(count)}{suffix}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </motion.div>
  );
};

const AboutSection = () => {
  const { getSection } = useSiteContent();
  const aboutContent = getSection('about');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { icon: Globe, value: "10+", label: "Coverage Areas" },
    { icon: Users, value: "300+", label: "Happy Customers" },
    { icon: BarChart3, value: "99.9%", label: "Network Uptime" },
  ];

  return (
    <section id="about" className="relative py-24 lg:py-32 section-gradient" ref={ref}>
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4 font-display">
              {aboutContent?.subtitle || "About Hextech"}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight font-display">
              {aboutContent?.title || (
                <>The Future of <span className="text-primary">Wireless Connectivity</span></>
              )}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {aboutContent?.description || "Hextech is a next-generation wireless internet service provider committed to delivering blazing-fast, reliable connectivity to homes and businesses."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our network is built for performance, reliability, and scalability. Whether
              you're streaming, gaming, working from home, or running a business, Hextech
              delivers the speed and stability you need to stay connected.
            </p>

            <div className="grid grid-cols-3 gap-6 mt-10">
              {stats.map((stat, i) => (
                <CountStat key={i} {...stat} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card p-8 rounded-3xl">
              <div className="aspect-square relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Animated rings */}
                  {[1, 0.75, 0.5].map((scale, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-primary/20"
                      style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
                      animate={{ scale: [1, 1.05 + i * 0.02, 1], opacity: [0.2 + i * 0.1, 0.4 + i * 0.1, 0.2 + i * 0.1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    />
                  ))}

                  {/* Connection lines */}
                  {[0, 60, 120, 180, 240, 300].map((rotation, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-px h-1/2 bg-gradient-to-b from-primary/40 to-transparent origin-bottom"
                      style={{ transform: `rotate(${rotation}deg)` }}
                      animate={{ opacity: [0.2, 0.6, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}

                  {/* Center hex */}
                  <motion.div
                    className="relative w-24 h-24 rounded-xl flex items-center justify-center bg-primary/15"
                    animate={{
                      boxShadow: [
                        "0 0 20px hsl(183 100% 50% / 0.15)",
                        "0 0 40px hsl(183 100% 50% / 0.3)",
                        "0 0 20px hsl(183 100% 50% / 0.15)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-primary">
                      <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="currentColor" opacity="0.7" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Decorative glows */}
            <motion.div
              className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl"
              style={{ background: "hsl(183 100% 50% / 0.08)" }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full blur-2xl"
              style={{ background: "hsl(256 100% 62% / 0.06)" }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
