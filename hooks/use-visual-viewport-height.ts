import { useEffect, useState } from "react";

/**
 * iOS Safari keeps `100dvh` tied to the layout viewport in a few keyboard
 * transitions. The Visual Viewport API is the source of truth for the part of
 * the page that is actually visible above the keyboard.
 */
export function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;

    const update = () => {
      setHeight(Math.round(viewport?.height ?? window.innerHeight));
    };

    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return height;
}
