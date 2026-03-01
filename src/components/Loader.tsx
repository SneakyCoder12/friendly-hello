import { useState, useEffect, useCallback } from 'react';
import './loader.css';

interface LoaderProps {
    children: React.ReactNode;
}

export default function Loader({ children }: LoaderProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [startTime] = useState(() => Date.now());

    const handleHideLoader = useCallback(() => {
        const minimumDisplayTime = 3000;
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumDisplayTime - elapsedTime);

        setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => {
                setIsVisible(false);
            }, 300);
        }, remainingTime);
    }, [startTime]);

    useEffect(() => {
        if (document.readyState === 'complete') {
            handleHideLoader();
        } else {
            window.addEventListener('load', handleHideLoader);
            return () => window.removeEventListener('load', handleHideLoader);
        }
    }, [handleHideLoader]);

    useEffect(() => {
        if (!isLoading) {
            document.body.style.overflow = '';
        } else {
            document.body.style.overflow = 'hidden';
        }
    }, [isLoading]);

    return (
        <>
            {isVisible && (
                <div
                    className={`loader-overlay ${isLoading ? '' : 'loader-fade-out'}`}
                    role="alert"
                    aria-live="polite"
                >
                    <div className="loader-container">
                        <img
                            className="loader-video"
                            src="/Make_a_quick_202602202156.gif"
                            alt="Loading"
                        />
                    </div>
                </div>
            )}
            {children}
        </>
    );
}
