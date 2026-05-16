import { motion } from "framer-motion";
import heroImage from "@/assets/hextech-equipment.png";
import acStationImage from "@/assets/hextech-ac-station.png";
import gen2Front from "@/assets/hextech-gen2-ac-front.png";
import gen2Back from "@/assets/hextech-gen2-ac-back.png";

type Product = {
  label: string;
  images: { src: string; alt: string }[];
  name: string;
  tagline: string;
};

const products: Product[] = [
  {
    label: "Meet our flagship product",
    images: [
      { src: heroImage, alt: "Hextech wireless equipment — outdoor CPE unit front and back view" },
    ],
    name: "Hextech CPE",
    tagline: "Long-range wireless. Zero compromise.",
  },
  {
    label: "New in the WiFi Kits lineup",
    images: [
      { src: acStationImage, alt: "Hextech new generation AC client station — outdoor wireless unit" },
    ],
    name: "AC Client Station",
    tagline: "New gen AC. Built for every home.",
  },
  {
    label: "Also in the WiFi Kits lineup",
    images: [
      { src: gen2Front, alt: "Hextech Gen 2 AC client station — front view" },
      { src: gen2Back, alt: "Hextech Gen 2 AC client station — rear view" },
    ],
    name: "Gen 2 AC Client Station",
    tagline: "Refined. Reinforced. Ready.",
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
          className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-40 md:py-0"
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
            className={`${p.images.length > 1 ? "w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 mb-8 md:mb-0" : "flex items-center justify-center"} px-6`}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
          >
            {p.images.map((img, i) => {
              if (p.images.length > 1) {
                return (
                  <div key={img.src} className="relative w-full overflow-hidden h-[280px] md:h-[400px]">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-contain object-center"
                      loading="lazy"
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
                      style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))" }}
                    />
                  </div>
                );
              }
              return (
                <img
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  className="max-h-[70vh] w-auto object-contain"
                  loading="lazy"
                />
              );
            })}
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
