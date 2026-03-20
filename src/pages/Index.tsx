import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SmoothScroll from "@/components/SmoothScroll";
import CursorGlow from "@/components/CursorGlow";

const ScrollStorytelling = lazy(() => import("@/components/ScrollStorytelling"));
const ProductShowcase = lazy(() => import("@/components/ProductShowcase"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const WhyChooseSection = lazy(() => import("@/components/WhyChooseSection"));
const NetworkVisualization = lazy(() => import("@/components/NetworkVisualization"));
const AnimatedMetrics = lazy(() => import("@/components/AnimatedMetrics"));
const CoverageSection = lazy(() => import("@/components/CoverageSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <CursorGlow />
        <Navbar />
        <main>
          <HeroSection />
          <Suspense fallback={null}>
            <ScrollStorytelling />
            <ProductShowcase />
            <AboutSection />
            <ServicesSection />
            <WhyChooseSection />
            <NetworkVisualization />
            <AnimatedMetrics />
            <CoverageSection />
            <ContactSection />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </SmoothScroll>
  );
};

export default Index;
