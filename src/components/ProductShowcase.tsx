import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroImage from "@/assets/hextech-equipment.jpeg";

const specs = [
  { label: "RANGE", value: "15 km" },
  { label: "THROUGHPUT", value: "300 Mbps" },
  { label: "FREQUENCY", value: "5 GHz" },
  { label: "LATENCY", value: "<5 ms" },
];

const ProductShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.4], [0.85, 1]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.1, 0.4], [60, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 1]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Dot overlay — signature Nothing.tech effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(17,17,17,0.4) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Hero product area */}
      <div
        className="relative min-h-screen flex flex-col justify-end"
        style={{ backgroundColor: "#f2f0eb" }}
      >
        {/* Product image */}
        <motion.div
          className="flex-1 flex items-center justify-center px-6 pt-24 pb-8"
          style={{ scale: imageScale, opacity: imageOpacity }}
        >
          <img
            src={heroImage}
            alt="Hextech wireless equipment — outdoor CPE unit front and back view"
            className="max-h-[65vh] w-auto object-contain"
            loading="lazy"
          />
        </motion.div>

        {/* Product name + tagline — bottom left */}
        <motion.div
          className="relative z-20 px-8 md:px-16 pb-16"
          style={{ y: textY, opacity: textOpacity }}
        >
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05]"
            style={{ color: "#111", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Hextech CPE
          </h2>
          <p
            className="mt-3 text-lg md:text-xl tracking-wide"
            style={{ color: "#111", opacity: 0.55, fontFamily: "'DM Mono', monospace", fontWeight: 400 }}
          >
            Long-range wireless. Zero compromise.
          </p>

          {/* LED accent dot */}
          <motion.div
            className="mt-4 w-2 h-2 rounded-full"
            style={{ backgroundColor: "#00e5ff" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* Spec strip */}
      <div
        className="relative z-20 border-t"
        style={{ backgroundColor: "#f2f0eb", borderColor: "rgba(17,17,17,0.12)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center divide-x" style={{ borderColor: "rgba(17,17,17,0.12)" }}>
          {specs.map((spec, i) => (
            <motion.div
              key={spec.label}
              className="flex-1 min-w-[140px] py-8 md:py-12 px-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ borderColor: "rgba(17,17,17,0.12)" }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase mb-2"
                style={{ color: "rgba(17,17,17,0.45)", fontFamily: "'DM Mono', monospace" }}
              >
                {spec.label}
              </p>
              <p
                className="text-2xl md:text-3xl font-light"
                style={{ color: "#111", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
              >
                {spec.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dark footer strip */}
      <div
        className="relative z-20 py-16 md:py-24 px-8 md:px-16"
        style={{ backgroundColor: "#111" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <h3
            className="text-3xl md:text-4xl font-light"
            style={{ color: "#f2f0eb", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Ready to connect?
          </h3>
          <div className="flex gap-4">
            <a
              href="#contact"
              className="px-6 py-3 text-sm tracking-wide border rounded-full transition-colors duration-300 hover:bg-white/10"
              style={{
                color: "#f2f0eb",
                borderColor: "rgba(242,240,235,0.3)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Get Started
            </a>
            <a
              href="#services"
              className="px-6 py-3 text-sm tracking-wide border rounded-full transition-colors duration-300 hover:bg-white/10"
              style={{
                color: "#f2f0eb",
                borderColor: "rgba(242,240,235,0.3)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              View Plans
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
