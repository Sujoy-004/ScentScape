'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/* ── HeroSection ── */
export function HeroSection() {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Cascade stagger animation on mount
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('.cascade-word').forEach((word, i) => {
      word.style.animationDelay = `${0.15 + i * 0.12}s`;
      word.classList.add('cascade-animate');
    });
  }, []);

  return (
    <section className="hero-section constellation-bg">
      <div className="hero-gradient" aria-hidden="true" />

      <div className="hero-container">
        <div className="hero-content">

          {/* Eyebrow */}
          <p className="hero-eyebrow animate-fade-in">
            <span aria-hidden="true"
              className="eyebrow-emoji super-magnetic-element"
              string="magnetic"
              string-radius="120"
              string-strength="0.16"
            >✦</span>
            AI-Powered Fragrance Discovery
            <span aria-hidden="true"
              className="eyebrow-emoji super-magnetic-element"
              string="magnetic"
              string-radius="120"
              string-strength="0.16"
            >✦</span>
          </p>

          {/* Cascading headline */}
          <h1 className="hero-title" ref={titleRef}>
            {['Discover', 'Your'].map((w, i) => (
              <span key={i} className="cascade-word cascade-plain">{w}{' '}</span>
            ))}
            <br />
            {['Perfect', 'Scent'].map((w, i) => (
              <span
                key={i}
                className="cascade-word cascade-gradient"
              >
                {w}{i === 0 ? ' ' : ''}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.7s' }}>
            Personalized fragrance recommendations.
          </p>

          {/* CTA Buttons — low magnetic sensitivity */}
          <div className="hero-buttons">
            <button
              id="hero-cta-primary"
              className="btn btn-primary magnetic-element"
              onClick={() => router.push('/onboarding/quiz')}
              string="magnetic"
              string-radius="500"
              string-strength="0.06"
              aria-label="Start fragrance discovery quiz"
            >
              <span
                className="btn-emoji super-magnetic-element"
                string="magnetic"
                string-radius="80"
                string-strength="0.18"
              >🌿</span>
              Start Discovery →
            </button>
            <button
              id="hero-cta-secondary"
              className="btn btn-outline magnetic-element"
              onClick={() => router.push('/fragrances')}
              string="magnetic"
              string-radius="500"
              string-strength="0.06"
              aria-label="Browse fragrance collection"
            >
              <span
                className="btn-emoji super-magnetic-element"
                string="magnetic"
                string-radius="80"
                string-strength="0.18"
              >✨</span>
              Browse Fragrances
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="trust-indicators">
            {[
              { value: '1,000+', label: 'Fragrances', emoji: '🧴' },
              { value: '98%', label: 'Match Rate', emoji: '🎯' },
              { value: '50K+', label: 'Collectors', emoji: '👑' },
            ].map((item) => (
              <div key={item.label} className="indicator">
                <span
                  className="indicator-emoji super-magnetic-element"
                  string="magnetic"
                  string-radius="100"
                  string-strength="0.14"
                  aria-hidden="true"
                >
                  {item.emoji}
                </span>
                <span className="indicator-value">{item.value}</span>
                <span className="indicator-label">{item.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Scroll hint */}
      <div aria-hidden="true" className="scroll-hint">
        <span className="scroll-text">Scroll</span>
        <div className="scroll-line" />
      </div>
    </section>
  );
}


/* ── SocialProofSection (Testimonials) ── */
export function SocialProofSection() {
  const testimonials = [
    {
      id: 1,
      name: 'Elena Rodriguez',
      role: 'Fragrance Collector',
      avatar: '👩‍🦱',
      text: 'Finally found a tool that understands nuance. The recommendations are eerily accurate — it found my signature scent in minutes.',
      rating: 5,
    },
    {
      id: 2,
      name: 'Marcus Chen',
      role: 'Casual Buyer',
      avatar: '👨‍💼',
      text: 'Saved me so much money by helping me understand what I actually like in scents. No more blind purchases.',
      rating: 5,
    },
    {
      id: 3,
      name: 'Sophie Nolan',
      role: 'Perfume Enthusiast',
      avatar: '👩‍🎨',
      text: 'The AI recommendations introduced me to indie brands I never would have discovered. The constellation graph is stunning.',
      rating: 5,
    },
  ];

  return (
    <section className="social-proof-section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h2
            className="section-title"
            string="split"
            string-split="word"
          >
            Trusted by Fragrance Lovers
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            See what collectors are saying about their scent discoveries
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.id} className="testimonial-card glass-card">
              <div className="testimonial-header">
                <div className="avatar">{t.avatar}</div>
                <div className="author-info">
                  <h3 className="author-name">{t.name}</h3>
                  <p className="author-role">{t.role}</p>
                </div>
              </div>
              <div className="stars" aria-label={`${t.rating} stars`}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ── FeatureSection ── */
export function FeatureSection() {
  const features = [
    {
      icon: '🌿',
      title: 'Personalized Matching',
      description: 'Graph neural networks analyze your taste profile to surface fragrances tuned exactly to you.',
    },
    {
      icon: '📊',
      title: 'Deep Note Analysis',
      description: 'Detailed breakdowns of top, heart, and base notes with accord mapping and longevity data.',
    },
    {
      icon: '🔍',
      title: 'Text-Based Search',
      description: 'Type "smoky vanilla with leather" and our AI finds matching fragrances instantly.',
    },
    {
      icon: '✦',
      title: 'Taste Constellation',
      description: 'Visualize your scent preferences as a beautiful network graph of notes and accords.',
    },
  ];

  return (
    <section className="feature-section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          <h2
            className="section-title"
            string="split"
            string-split="word"
          >
            Why ScentScape
          </h2>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card"
              string="reveal"
              string-reveal-delay={String(i * 100)}
            >
              <span
                className="feature-icon super-magnetic-element"
                string="magnetic"
                string-radius="100"
                string-strength="0.3"
              >
                {f.icon}
              </span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-description">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
