'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import './fragrance-detail.css';

type FragranceNotePayload = { name?: string } | string;

type FragranceDetailPayload = {
  id: string;
  brand: string;
  name: string;
  family?: string;
  price?: number;
  rating?: number;
  review_count?: number;
  match_score?: number;
  longevity?: string;
  fragrance_type?: string;
  sillage?: string;
  recommendation?: string;
  top_notes?: FragranceNotePayload[];
  middle_notes?: FragranceNotePayload[];
  base_notes?: FragranceNotePayload[];
  accords?: Array<{ name?: string } | string>;
  concentration?: string;
  description?: string;
  year?: number | string;
  similarity_score?: number;
};


function normalizeNotes(notes: FragranceNotePayload[] | undefined, fallback: string[]): string[] {
  const values = (notes || [])
    .map((note) => (typeof note === 'string' ? note : note?.name || ''))
    .filter((note): note is string => !!note);
  return values.length > 0 ? values : fallback;
}

export default function FragranceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || '';
  const sectionRef = useRef<HTMLDivElement>(null);
  const [fragrance, setFragrance] = useState<FragranceDetailPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const { addToWishlist } = useAppStore();

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const loadFragrance = async () => {
      if (!id) {
        setFragrance(null);
        setIsLoading(false);
        setLoadError('Invalid fragrance id');
        return;
      }

      setIsLoading(true);
      setLoadError('');
      try {
        const response = await fetch(`${apiBase}/fragrances/${id}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Fragrance fetch failed (${response.status})`);
        }
        const payload = (await response.json()) as FragranceDetailPayload;
        setFragrance(payload);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('Failed to load fragrance detail:', error);
        setFragrance(null);
        setLoadError('We could not load this fragrance profile right now.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadFragrance();

    return () => {
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('animate-fade-in')),
      { threshold: 0.08 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
      sectionRef.current.querySelectorAll('.detail-card,.review-card,.pyramid-level')
        .forEach((el: Element) => observer.observe(el));
    }
    return () => observer.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="detail-error">
        <div className="error-inner">
          <span className="error-icon">⌛</span>
          <h2>Loading fragrance profile...</h2>
        </div>
      </div>
    );
  }

  if (!fragrance) {
    return (
      <div className="detail-error">
        <div className="error-inner">
          <span className="error-icon">🔍</span>
          <h2>Fragrance not found</h2>
          <p>{loadError || 'We could not find the requested fragrance.'}</p>
          <button className="error-button" onClick={() => router.push('/fragrances')}>
            ← Back to All Fragrances
          </button>
        </div>
      </div>
    );
  }

  const notePyramid = {
    top: normalizeNotes(fragrance.top_notes, ['Bergamot', 'Lemon']),
    middle: normalizeNotes(fragrance.middle_notes, ['Jasmine', 'Rose']),
    base: normalizeNotes(fragrance.base_notes, ['Sandalwood', 'Musk']),
  };

  const bottleColors: Record<string, string> = {
    '1': 'linear-gradient(135deg,#6b3a1f,#c87941)',
    '2': 'linear-gradient(135deg,#b8860b,#ffe08a)',
    '3': 'linear-gradient(135deg,#1a4a1a,#4caf50)',
    '4': 'linear-gradient(135deg,#4a3728,#8b6347)',
    '5': 'linear-gradient(135deg,#8b1a4a,#e91e8c)',
    '6': 'linear-gradient(135deg,#1a3a5c,#4a90d9)',
    '7': 'linear-gradient(135deg,#8b4513,#ff8c00)',
    '8': 'linear-gradient(135deg,#1a2a3a,#4a6fa5)',
  };

  return (
    <div className="fragrance-detail-page">
      <div className="detail-container" ref={sectionRef}>

        {/* Back */}
        <button className="back-button" onClick={() => router.back()}>
          ← Back
        </button>

        {/* Hero Header */}
        <div className="detail-header">
          {/* Bottle Visual */}
          <div className="fragrance-image-section">
            <div className="bottle-showcase">
              <div className="bottle-glow" style={{ background: bottleColors[id] || bottleColors['1'] }} />
              <div className="bottle-3d" style={{ background: bottleColors[id] || bottleColors['1'] }}>
                <div className="bottle-body">
                  <div className="bottle-neck" />
                  <div className="bottle-cap" />
                  <div className="bottle-liquid" />
                  <div className="bottle-shine" />
                </div>
              </div>
              <div className="bottle-shadow" />
            </div>
            <button
              className="wishlist-btn-large"
              onClick={() => addToWishlist(fragrance.id || id)}
            >
              ♡ Save to Collection
            </button>
          </div>

          {/* Info */}
          <div className="fragrance-info-section">
            <div className="fragrance-header-info">
              <span className="detail-family-badge">{fragrance.concentration || fragrance.family || 'Eau de Parfum'}</span>
              <h1 className="fragrance-detail-title">{fragrance.name}</h1>
              <p className="fragrance-detail-brand">{fragrance.brand}</p>
              {fragrance.year && <p className="fragrance-year">Est. {fragrance.year}</p>}
              {fragrance.price && (
                <p className="fragrance-price">${fragrance.price}</p>
              )}
            </div>

            <div className="fragrance-metrics">
              <div className="metric-block">
                <span className="metric-label">Rating</span>
                <div className="metric-value">
                  <span className="stars">{'⭐'.repeat(Math.floor(fragrance.rating || 4))}</span>
                  <span className="rating-count">({fragrance.review_count || 342})</span>
                </div>
              </div>
              <div className="metric-block">
                <span className="metric-label">Match</span>
                <div className="metric-value match-pct">
                  {typeof fragrance.similarity_score === 'number'
                    ? Math.round(fragrance.similarity_score * 100)
                    : ((fragrance.match_score as number) || 87)}%
                </div>
              </div>
              <div className="metric-block">
                <span className="metric-label">Longevity</span>
                <div className="metric-value">{fragrance.longevity || '8–10 hrs'}</div>
              </div>
            </div>

            <p className="fragrance-description">
              {fragrance.description || 'A sophisticated fragrance with a complex blend of notes that unfolds beautifully on the skin over time.'}
            </p>

            <div className="action-buttons-detail">
              <button
                className="btn-primary-detail"
                string="magnetic"
                string-radius="400"
                string-strength="0.08"
                onClick={() => { addToWishlist(fragrance.id || id); }}
              >
                Add to Collection
              </button>
              <button
                className="btn-secondary-detail"
                onClick={() => router.push('/recommendations')}
              >
                See Similar →
              </button>
            </div>
          </div>
        </div>

        {/* Note Pyramid */}
        <div className="note-pyramid-section">
          <h2 className="section-title">Fragrance Pyramid</h2>
          <div className="pyramid-container">
            {[
              { key: 'top', label: 'Top Notes', notes: notePyramid.top, cls: 'top-level', desc: 'First impression · 0–30 min' },
              { key: 'middle', label: 'Heart Notes', notes: notePyramid.middle, cls: 'middle-level', desc: 'Character · 30 min–4 hrs' },
              { key: 'base', label: 'Base Notes', notes: notePyramid.base, cls: 'base-level', desc: 'Memory · 4–12 hrs' },
            ].map(({ key, label, notes, cls, desc }) => (
              <div key={key} className={`pyramid-level ${cls}`}>
                <div className="level-info">
                  <div className="level-label">{label}</div>
                  <div className="level-desc">{desc}</div>
                </div>
                <div className="notes-list">
                  {notes.map((note: string, idx: number) => (
                    <div key={idx} className={`note-item ${key}`}>{note}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Details */}
        <div className="details-section">
          <div className="detail-card">
            <h3>Fragrance Profile</h3>
            <ul className="detail-list">
              <li><span className="label">Type:</span><span className="value">{fragrance.fragrance_type || 'Eau de Parfum'}</span></li>
              <li><span className="label">Concentration:</span><span className="value">{fragrance.concentration || '15–20%'}</span></li>
              <li><span className="label">Sillage:</span><span className="value">{fragrance.sillage || 'Moderate'}</span></li>
              <li><span className="label">Release Year:</span><span className="value">{fragrance.year || 'Classic'}</span></li>
            </ul>
          </div>
          <div className="detail-card">
            <h3>Recommended For</h3>
            <p className="card-content">{fragrance.recommendation || 'A versatile, timeless signature. Perfect for everyday wear and special occasions alike.'}</p>
          </div>
          <div className="detail-card">
            <h3>Occasions</h3>
            <div className="occasion-tags">
              {['Daily Wear', 'Evening', 'Special Events', 'Date Night'].map(o => (
                <span key={o} className="tag">{o}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <h2 className="section-title">Community Reviews</h2>
          <div className="reviews-grid">
            {[
              { name: 'Elena R.', role: 'Collector', stars: 5, text: 'Absolutely stunning. The opening is fresh and bright, and it develops beautifully over the course of the day.', time: '2 days ago' },
              { name: 'Marcus C.', role: 'Enthusiast', stars: 5, text: 'Saved me from so many blind purchases. The AI nailed my preference for woody, sophisticated blends.', time: '1 week ago' },
              { name: 'Sophie N.', role: 'Perfume Lover', stars: 4, text: 'Long lasting and incredibly versatile. Gets compliments constantly. A true signature scent.', time: '2 weeks ago' },
            ].map((r, idx) => (
              <div key={idx} className="review-card">
                <div className="review-header">
                  <span className="reviewer-avatar">👤</span>
                  <div className="reviewer-info">
                    <p className="reviewer-name">{r.name} <span className="reviewer-role">{r.role}</span></p>
                    <span className="review-rating">{'⭐'.repeat(r.stars)}</span>
                  </div>
                  <span className="review-date">{r.time}</span>
                </div>
                <p className="review-text">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="detail-footer">
          <button className="footer-btn-primary" onClick={() => router.push('/recommendations')}>
            Get Recommendations
          </button>
          <button className="footer-btn-secondary" onClick={() => router.push('/fragrances')}>
            Explore All
          </button>
        </div>
      </div>
    </div>
  );
}
