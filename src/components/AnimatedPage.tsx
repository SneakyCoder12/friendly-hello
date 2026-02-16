import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps children in a div that plays a fade-in + slide-up animation
 * whenever the route pathname changes.
 */
export default function AnimatedPage({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // Restart animation by removing & re-adding the class
        el.classList.remove('page-transition');
        // Force reflow so the browser treats it as a fresh animation
        void el.offsetWidth;
        el.classList.add('page-transition');
    }, [location.pathname]);

    return (
        <div ref={ref} className="page-transition flex-1 flex flex-col">
            {children}
        </div>
    );
}
