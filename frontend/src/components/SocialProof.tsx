'use client';

import { useEffect, useRef } from 'react';

export function SocialProof() {
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
      const testimonials = sectionRef.current.querySelectorAll('.testimonial');
      testimonials.forEach((testimonial) => observer.observe(testimonial));
    }

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: 'Sarah M.',
      rating: 5,
      text: 'Finally found a fragrance that matches my personality perfectly. The AI recommendations are incredibly accurate!',
      match: '92% Match',
    },
    {
      name: 'James L.',
      rating: 5,
      text: 'Best discovery platform for fragrances. I\'ve found three new signatures in just a month.',
      match: '88% Match',
    },
    {
      name: 'Emma R.',
      rating: 5,
      text: 'Love the community ratings and detailed notes breakdowns. Makes choosing so much easier.',
      match: '95% Match',
    },
  ];

  return (
    <section className="social-proof scroll-reveal" ref={sectionRef}>
      <div className="social-proof-container">
        <div className="section-header">
          <h2 className="section-title">Loved by Fragrance Enthusiasts</h2>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Match Satisfaction</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1000+</div>
            <div className="stat-label">Fragrances Available</div>
          </div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial scroll-reveal">
              <div className="testimonial-rating">
                {'⭐'.repeat(testimonial.rating)}
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="testimonial-footer">
                <div className="testimonial-name">{testimonial.name}</div>
                <div className="testimonial-match">{testimonial.match}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
