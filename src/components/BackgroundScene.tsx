import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useBackgroundTheme } from "@/lib/background-theme";

export function BackgroundScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useBackgroundTheme();

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Kill any existing animations
    gsap.killTweensOf("*");

    const ctx = gsap.context(() => {
      // Tema: Grade Cyberpunk
      if (theme === "grid") {
        gsap.to(".bg-scene__grid-floor", {
          backgroundPosition: "0 50px",
          duration: 1.5,
          ease: "none",
          repeat: -1
        });
        gsap.to(".bg-scene__horizon-glow", {
          opacity: 0.8,
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });
      }

      // Tema: Nebulosa 3D
      if (theme === "nebula") {
        const orbs = gsap.utils.toArray(".bg-scene__nebula-orb");
        orbs.forEach((orb: any, i) => {
          gsap.to(orb, {
            x: `random(-100, 100)`,
            y: `random(-100, 100)`,
            rotation: `random(-45, 45)`,
            scale: `random(0.8, 1.2)`,
            duration: `random(8, 15)`,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * -2
          });
        });
        
        gsap.to(".bg-scene__stars", {
          backgroundPosition: "100px 100px",
          duration: 60,
          ease: "none",
          repeat: -1
        });
      }

      // Tema: Holográfico
      if (theme === "holo") {
        gsap.to(".bg-scene__holo-scanlines", {
          yPercent: 100,
          duration: 8,
          ease: "none",
          repeat: -1
        });
        gsap.to(".bg-scene__holo-sheen", {
          opacity: 0.7,
          rotation: 5,
          scale: 1.1,
          duration: 4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [theme]);

  return (
    <div ref={containerRef} className="bg-scene fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true" style={{ background: "var(--color-background)", perspective: "700px" }}>
      {/* Tema: Grade Cyberpunk */}
      <div className={`bg-scene__sky absolute inset-0 transition-opacity duration-1000 ${theme === 'grid' ? 'opacity-100' : 'opacity-0'}`} style={{ background: "linear-gradient(180deg, #0a0118 0%, #1a0733 45%, #2a0845 62%, #0a0118 100%)" }} />
      <div className={`bg-scene__horizon-glow absolute bottom-1/2 left-1/2 w-[140vw] h-[40vh] -translate-x-1/2 transition-opacity duration-1000 ${theme === 'grid' ? 'opacity-100' : 'opacity-0'}`} style={{ background: "radial-gradient(ellipse 60% 100% at 50% 100%, #ff2ea6 0%, #7c3aed 35%, transparent 75%)", filter: "blur(20px)" }} />
      <div className={`bg-scene__grid-floor absolute -bottom-[10%] left-1/2 w-[220vw] h-[120vh] -translate-x-1/2 transition-opacity duration-1000 ${theme === 'grid' ? 'opacity-100' : 'opacity-0'}`} style={{ transform: "translateX(-50%) rotateX(75deg)", transformOrigin: "50% 0%", backgroundImage: "linear-gradient(90deg, rgba(255, 46, 166, 0.55) 1px, transparent 1px), linear-gradient(0deg, rgba(255, 46, 166, 0.55) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "linear-gradient(to top, black 0%, transparent 60%)", WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 60%)" }} />

      {/* Tema: Nebulosa 3D */}
      <div className={`bg-scene__sky absolute inset-0 transition-opacity duration-1000 ${theme === 'nebula' ? 'opacity-100' : 'opacity-0'}`} style={{ background: "#05040d" }} />
      <div className={`bg-scene__nebula-orb bg-scene__nebula-orb--1 absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full blur-[60px] transition-opacity duration-1000 ${theme === 'nebula' ? 'opacity-50' : 'opacity-0'}`} style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
      <div className={`bg-scene__nebula-orb bg-scene__nebula-orb--2 absolute top-[20%] right-[-15%] w-[55vw] h-[55vw] rounded-full blur-[60px] transition-opacity duration-1000 ${theme === 'nebula' ? 'opacity-50' : 'opacity-0'}`} style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }} />
      <div className={`bg-scene__nebula-orb bg-scene__nebula-orb--3 absolute bottom-[-20%] left-[20%] w-[55vw] h-[55vw] rounded-full blur-[60px] transition-opacity duration-1000 ${theme === 'nebula' ? 'opacity-50' : 'opacity-0'}`} style={{ background: "radial-gradient(circle, #ff2ea6, transparent 70%)" }} />
      <div className={`bg-scene__stars absolute inset-0 transition-opacity duration-1000 ${theme === 'nebula' ? 'opacity-80' : 'opacity-0'}`} style={{ backgroundImage: "radial-gradient(1.5px 1.5px at 20% 30%, white, transparent), radial-gradient(1.5px 1.5px at 70% 15%, white, transparent), radial-gradient(1px 1px at 40% 70%, white, transparent), radial-gradient(1.5px 1.5px at 85% 55%, white, transparent), radial-gradient(1px 1px at 10% 85%, white, transparent), radial-gradient(1.5px 1.5px at 55% 90%, white, transparent), radial-gradient(1px 1px at 90% 80%, white, transparent)", backgroundSize: "100% 100%" }} />

      {/* Tema: Holográfico */}
      <div className={`bg-scene__sky absolute inset-0 transition-opacity duration-1000 ${theme === 'holo' ? 'opacity-100' : 'opacity-0'}`} style={{ background: "#08060f" }} />
      <div className={`bg-scene__holo-sheen absolute top-[-20%] left-[-60%] w-[220%] h-[140%] transition-opacity duration-1000 ${theme === 'holo' ? 'opacity-50' : 'opacity-0'}`} style={{ background: "linear-gradient(115deg, #ff2ea6 0%, #7c3aed 22%, #06b6d4 44%, #22d3ee 60%, #7c3aed 78%, #ff2ea6 100%)", filter: "blur(80px) saturate(1.4)" }} />
      <div className={`bg-scene__holo-scanlines absolute inset-0 transition-opacity duration-1000 ${theme === 'holo' ? 'opacity-10' : 'opacity-0'}`} style={{ background: "repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.5) 0px, transparent 1px, transparent 3px)" }} />
    </div>
  );
}
