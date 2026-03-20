import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroImage from "@/assets/hextech-equipment.png";

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
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Hero product area */}
      <div
        className="relative min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: "#000" }}
      >
        {/* "Meet our flagship product" label */}
        <motion.p
          className="absolute top-12 left-1/2 -translate-x-1/2 text-xs tracking-[0.25em] uppercase z-20"
          style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Meet our flagship product
        </motion.p>

        {/* Product image — centered, full presence */}
        <motion.div
          className="flex items-center justify-center px-6"
          style={{ scale: imageScale, opacity: imageOpacity }}
        >
          <img
            src={heroImage}
            alt="Hextech wireless equipment — outdoor CPE unit front and back view"
            className="max-h-[70vh] w-auto object-contain"
            loading="lazy"
          />
        </motion.div>

        {/* Product name + tagline — bottom left */}
        <motion.div
          className="absolute bottom-12 left-8 md:left-16 z-20"
          style={{ y: textY, opacity: textOpacity }}
        >
          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]"
            style={{ color: "#f2f0eb", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Hextech CPE
          </h2>
          <p
            className="mt-2 text-sm md:text-base tracking-wide"
            style={{ color: "#f2f0eb", opacity: 0.45, fontFamily: "'DM Mono', monospace", fontWeight: 400 }}
          >
            Long-range wireless. Zero compromise.
          </p>

          {/* LED accent dot */}
          <motion.div
            className="mt-3 w-2 h-2 rounded-full"
            style={{ backgroundColor: "#00e5ff" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default ProductShowcase;
