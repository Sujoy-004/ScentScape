'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function FragranceFamilies() {
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
      const cards = sectionRef.current.querySelectorAll('.family-card');
      cards.forEach((card, index) => {
        (card as HTMLElement).style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
      });
    }

    return () => observer.disconnect();
  }, []);

  const families = [
    { emoji: '🌸', name: 'Floral', slug: 'floral', notes: 'Roses, jasmine, lily', description: 'Delicate and feminine' },
    { emoji: '🌲', name: 'Woody', slug: 'woody', notes: 'Sandalwood, cedar, vetiver', description: 'Rich and warm' },
    { emoji: '🍊', name: 'Citrus', slug: 'citrus', notes: 'Bergamot, lemon, orange', description: 'Bright and energizing' },
    { emoji: '🍯', name: 'Amber', slug: 'amber', notes: 'Vanilla, tonka bean, musk', description: 'Sweet and sensual' },
    { emoji: '🌿', name: 'Aromatic', slug: 'aromatic', notes: 'Lavender, rosemary, mint', description: 'Fresh and herbal' },
    { emoji: '🍓', name: 'Fruity', slug: 'fruity', notes: 'Apple, peach, berries', description: 'Juicy and playful' },
    { emoji: '✨', name: 'Chypré', slug: 'chypre', notes: 'Oakmoss, patchouli, citrus', description: 'Classic and elegant' },
    { emoji: '💧', name: 'Aquatic', slug: 'aquatic', notes: 'Marine, ozonic, fresh', description: 'Light and airy' },
  ];

  return (
    <section className="fragrance-families scroll-reveal" ref={sectionRef}>
      <div className="fragrance-families-container">
        <div className="section-header families-header">
          <h2 className="section-title" string="split" string-repeat="true" string-split="word">Explore Fragrance Families</h2>
          <p className="section-subtitle" string="split" string-repeat="true" string-split="word">Find your scent profile across these carefully curated families</p>
        </div>

        <div className="families-grid">
          {families.map((family, index) => (
              <div key={index} className="family-card tilt-card scroll-reveal" string="magnetic|glide" string-radius="320" string-strength="0.06" string-glide="0.22">
              <div className="family-emoji super-magnetic-element" string="magnetic" string-radius="140" string-strength="0.2" style={{display: 'inline-block'}}>{family.emoji}</div>
              <h3 className="family-name">{family.name}</h3>
              <p className="family-description">{family.description}</p>
              <div className="family-notes">{family.notes}</div>
              <button 
                className="family-btn magnetic-element"
                string="magnetic" string-radius="260" string-strength="0.08"
                onClick={() => router.push(`/families/${family.slug}`)}
              >
                Explore Family
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
