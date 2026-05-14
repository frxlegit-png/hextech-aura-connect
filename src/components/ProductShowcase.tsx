import { motion } from "framer-motion";
import heroImage from "@/assets/hextech-equipment.png";
import acStationImage from "@/assets/hextech-ac-station.png";

type Product = {
  label: string;
  image: string;
  alt: string;
  name: string;
  tagline: string;
};

const products: Product[] = [
  {
    label: "Meet our flagship product",
    image: heroImage,
    alt: "Hextech wireless equipment — outdoor CPE unit front and back view",
    name: "Hextech CPE",
    tagline: "Long-range wireless. Zero compromise.",
  },
  {
    label: "New in the WiFi Kits lineup",
    image: acStationImage,
    alt: "Hextech new generation AC client station — outdoor wireless unit",
    name: "AC Client Station",
    tagline: "New gen AC. Built for every home.",
  },
];

const ProductShowcase = () => {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#000" }}>
      {/* Dot overlay — signature Nothing.tech effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {products.map((p) => (
        <div
          key={p.name}
          className="relative min-h-screen flex flex-col items-center justify-center"
        >
          <motion.p
            className="absolute top-12 left-1/2 -translate-x-1/2 text-xs tracking-[0.25em] uppercase z-20 text-center px-6"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {p.label}
          </motion.p>

          <motion.div
            className="flex items-center justify-center px-6"
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <img
              src={p.image}
              alt={p.alt}
              className="max-h-[70vh] w-auto object-contain"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            className="absolute bottom-12 left-8 md:left-16 z-20"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2
              className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]"
              style={{ color: "#f2f0eb", fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
            >
              {p.name}
            </h2>
            <p
              className="mt-2 text-sm md:text-base tracking-wide"
              style={{ color: "#f2f0eb", opacity: 0.45, fontFamily: "'DM Mono', monospace", fontWeight: 400 }}
            >
              {p.tagline}
            </p>

            <motion.div
              className="mt-3 w-2 h-2 rounded-full"
              style={{ backgroundColor: "#00e5ff" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      ))}
    </section>
  );
};

export default ProductShowcase;
