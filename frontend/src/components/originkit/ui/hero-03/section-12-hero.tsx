"use client";

import { useState } from "react";
import { GalleryOverlay } from "@/components/originkit/ui/hero-03/gallery-overlay";
import { HeroContent } from "@/components/originkit/ui/hero-03/hero-content";
import { PerspectiveBackground } from "@/components/originkit/ui/hero-03/perspective-background";

type Section12HeroProps = {
  onCreate?: () => void;
};

/*
 * The kit ships its own <Navbar>, but this app renders <Navbar /> once in
 * App.jsx above <main>, so the kit's navbar is intentionally not rendered
 * here. The inner height is also reduced by the sticky navbar (64px + 1px
 * border) so the hero still fills exactly one viewport.
 */
export const Section12Hero = ({ onCreate }: Section12HeroProps) => {
  const [galleryOpen, setGalleryOpen] = useState(false);

  const handleExplore = () => {
    setGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setGalleryOpen(false);
  };

  return (
    <section
      id="hero"
      aria-label="GlowUp AI hero"
      className="relative isolate w-full overflow-hidden bg-[#fffbe1]"
      style={{ marginTop: 'calc(var(--nav-h, 65px) * -1)' }}
    >
      <div className="relative mx-auto flex h-[100dvh] min-h-[540px] w-full max-w-[1600px] flex-col wide-lg:max-w-none">
        <PerspectiveBackground />

        <div className="pointer-events-none relative z-20 flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-6 ipad:px-12 desktop-sm:px-6 desktop-sm:pb-20 desktop-sm:pt-6">
          <HeroContent onExplore={handleExplore} onCreate={onCreate} />
        </div>
      </div>

      <GalleryOverlay open={galleryOpen} onClose={handleCloseGallery} />
    </section>
  );
};
