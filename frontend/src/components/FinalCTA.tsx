'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function FinalCTA() {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="final-cta scroll-reveal" ref={sectionRef}>
      <div className="final-cta-container">
        <h2 className="cta-title">Ready to Find Your Perfect Scent?</h2>
        <p className="cta-subtitle">Join thousands discovering fragrances they love</p>

        <button 
          className="cta-button"
          onClick={() => router.push('/onboarding/quiz')}
        >
          Start the Quiz Now
        </button>

        <div className="trust-badges">
          <div className="trust-badge">
            <span className="badge-icon">✓</span>
            <span className="badge-text">100% Authentic Fragrances</span>
          </div>
          <div className="trust-badge">
            <span className="badge-icon">✓</span>
            <span className="badge-text">GDPR Compliant</span>
          </div>
          <div className="trust-badge">
            <span className="badge-icon">✓</span>
            <span className="badge-text">Free US Shipping</span>
          </div>
          <div className="trust-badge">
            <span className="badge-icon">✓</span>
            <span className="badge-text">Cancel Anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
