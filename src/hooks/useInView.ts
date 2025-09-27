import { useCallback, useEffect, useRef, useState } from "react";

export type UseInViewOptions = {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean; // if true, freeze after first intersect
};

export function useInView(options: UseInViewOptions = {}) {
  const { root = null, rootMargin = "0px", threshold = 0.2, once = true } = options;

  const nodeRef = useRef<Element | null>(null);
  const [inView, setInView] = useState(false);

  const setRef = useCallback((node: Element | null) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || (once && inView)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { root: root as any, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once, inView]);

  return { ref: setRef, inView } as const;
}
