'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRecommendations } from '@/lib/hooks';
import { useAppStore } from '@/stores/app-store';
import './recommendations.css';

export default function RecommendationsPage() {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { data: recommendations, isLoading, error } = useRecommendations();
  const { quizId, addToWishlist } = useAppStore();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
      const cards = sectionRef.current.querySelectorAll('.recommendation-card');
      cards.forEach((card, index) => {
        (card as HTMLElement).style.animationDelay = `${index * 0.05}s`;
        observer.observe(card);
      });
    }

    return () => observer.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="recommendations-loading">
        <div className="loading-spinner">
          <p>Generating your personalized recommendations</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-error">
        <h2>Something went wrong</h2>
        <p>Unable to load recommendations. Please try again.</p>
        <button
          className="error-button"
          onClick={() => router.push('/onboarding/quiz')}
        >
          Start Quiz Again
        </button>
      </div>
    );
  }

  const allFragrances = recommendations || [];
  const topMatches = allFragrances.slice(0, 10);

  // No data at all → prompt quiz
  if (!isLoading && topMatches.length === 0) {
    return (
      <div className="recommendations-error">
        <div className="error-inner">
          <span className="error-icon">✦</span>
          <h2>Ready for your matches?</h2>
          <p>Complete the taste quiz so we can curate your perfect fragrance profile.</p>
          <button className="error-button" onClick={() => router.push('/onboarding/quiz')}>
            Start the Quiz →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <div className="recommendations-container">
        <div className="recommendations-header">
          <h1>Your Personalized Recommendations</h1>
          <p>Based on your fragrance preferences and taste profile</p>
        </div>


        <div className="recommendations-stats">
          <div className="stat">
            <span className="stat-value">{topMatches.length}</span>
            <span className="stat-label">Top Matches</span>
          </div>
          <div className="stat">
            <span className="stat-value">98%</span>
            <span className="stat-label">Avg. Match Score</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {topMatches.filter((f: any) => f.availability === 'in-stock').length}
            </span>
            <span className="stat-label">In Stock</span>
          </div>
        </div>

        <div className="recommendations-grid" ref={sectionRef} string="parallax" string-speed="0.5">
          {topMatches.map((fragrance: any, index: number) => (
            <div key={index} className="recommendation-card" string="impulse">
              <div className="card-header">
                <span className="rank">#{index + 1}</span>
                <button
                  className="wishlist-btn"
                  onClick={() =>
                    addToWishlist(fragrance.id || `frag-${index}`)
                  }
                  title="Add to wishlist"
                >
                  ♡
                </button>
              </div>

              <div className="fragrance-preview">
                <span className="fragrance-emoji">🧴</span>
                <h3 className="fragrance-name">{fragrance.name}</h3>
                <p className="fragrance-brand">{fragrance.brand}</p>
              </div>

              <div className="match-indicator">
                <div className="match-bar">
                  <div
                    className="match-fill"
                    style={{
                      width: `${fragrance.match_score || 85}%`,
                    }}
                  ></div>
                </div>
                <span className="match-text">
                  {fragrance.match_score || 85}% Match
                </span>
              </div>

              {fragrance.top_notes && (
                <div className="fragrance-notes">
                  <p className="notes-label">Top Notes</p>
                  <div className="notes-pills">
                    {fragrance.top_notes.slice(0, 3).map((note: string, i: number) => (
                      <span key={i} className="note-pill">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="fragrance-rating">
                <span className="stars">
                  {'⭐'.repeat(Math.floor(fragrance.rating || 4))}
                </span>
                <span className="rating-count">
                  ({fragrance.review_count || 142})
                </span>
              </div>

              <div className="card-actions">
                <button
                  className="btn-details"
                  onClick={() =>
                    router.push(`/fragrances/${fragrance.id || `frag-${index}`}`)
                  }
                >
                  View Details
                </button>
                <button
                  className="btn-similar"
                  onClick={() =>
                    router.push(
                      `/fragrances/${fragrance.id || `frag-${index}`}?view=similar`
                    )
                  }
                >
                  Similar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="recommendations-footer">
          <button
            className="footer-btn-primary"
            onClick={() => router.push('/fragrances')}
          >
            Explore All Fragrances
          </button>
          <button
            className="footer-btn-secondary"
            onClick={() => router.push('/onboarding/quiz')}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

