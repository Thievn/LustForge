import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { LandingAtmosphere } from "@/components/landing/LandingAtmosphere";
import { LandingPhoneProvider } from "@/components/landing/phoneBackdrop";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingStory } from "@/components/landing/LandingStory";
import { LandingExampleTexts } from "@/components/landing/LandingExampleTexts";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";
import WaitlistSection from "@/components/WaitlistSection";
import { scrollToLandingId } from "@/lib/landingScroll";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== "#waitlist") return;
    const frame = window.requestAnimationFrame(() => scrollToLandingId("waitlist"));
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  return (
    <LandingPhoneProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-[#1B1620] text-[#F4EEF2]">
        <LandingAtmosphere />
        <div className="relative z-10">
          <Navbar variant="landing" />
          <main>
            <LandingHero />
            <LandingStory />
            <LandingFeatures />
            <LandingExampleTexts />
            <LandingTestimonials />
            <LandingFaq />
            <WaitlistSection />
          </main>
          <LandingFooter />
        </div>
      </div>
    </LandingPhoneProvider>
  );
};

export default Index;
