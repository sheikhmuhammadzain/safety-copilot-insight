import { useEffect } from 'react';

export const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // This would require adding web-vitals library
      // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
    }

    // Monitor bundle size impact
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    // Mark critical rendering milestones
    performance.mark('landing-page-start');
    
    // Measure time to interactive
    const checkInteractive = () => {
      if (document.readyState === 'complete') {
        performance.mark('landing-page-interactive');
        performance.measure('landing-page-load-time', 'landing-page-start', 'landing-page-interactive');
      } else {
        setTimeout(checkInteractive, 100);
      }
    };
    
    checkInteractive();

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

export default PerformanceMonitor;
