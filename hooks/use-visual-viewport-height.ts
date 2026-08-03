import { useEffect, useState } from "react";

type VisualViewportMetrics = {
  height: number | null;
  offsetTop: number;
};

/**
 * iOS Safari keeps `100dvh` tied to the layout viewport in a few keyboard
 * transitions. The Visual Viewport API is the source of truth for the part of
 * the page that is actually visible above the keyboard.
 */
export function useVisualViewportMetrics(): VisualViewportMetrics {
  const [metrics, setMetrics] = useState<VisualViewportMetrics>({
    height: null,
    offsetTop: 0,
  });

  useEffect(() => {
    const viewport = window.visualViewport;
    let animationFrame = 0;

    const update = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const next = {
          height: Math.round(viewport?.height ?? window.innerHeight),
          offsetTop: Math.round(viewport?.offsetTop ?? 0),
        };
        setMetrics((current) =>
          current.height === next.height && current.offsetTop === next.offsetTop
            ? current
            : next
        );
      });
    };

    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      cancelAnimationFrame(animationFrame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return metrics;
}

export function useVisualViewportHeight() {
  return useVisualViewportMetrics().height;
}
