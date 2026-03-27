'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { getQuizFragrances } from '@/lib/mockData';
import { useSubmitRating } from '@/lib/hooks';
import '@/app/onboarding/quiz/quiz.css';

const NOTE_THEMES = [
  {
    keys: ['bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin', 'citrus', 'neroli'],
    palette: {
      soft: 'rgba(236, 171, 82, 0.24)',
      softSecondary: 'rgba(214, 135, 58, 0.2)',
      border: 'rgba(243, 190, 116, 0.38)',
      glow: 'rgba(239, 179, 99, 0.22)',
      accent: '#f3c178',
    },
  },
  {
    keys: ['rose', 'jasmine', 'violet', 'peony', 'iris', 'lavender', 'floral'],
    palette: {
      soft: 'rgba(214, 126, 162, 0.2)',
      softSecondary: 'rgba(176, 98, 146, 0.22)',
      border: 'rgba(227, 150, 184, 0.36)',
      glow: 'rgba(206, 120, 170, 0.2)',
      accent: '#e4a0c2',
    },
  },
  {
    keys: ['vetiver', 'cedar', 'sandalwood', 'patchouli', 'oud', 'amber', 'woody'],
    palette: {
      soft: 'rgba(158, 104, 64, 0.23)',
      softSecondary: 'rgba(111, 77, 48, 0.26)',
      border: 'rgba(190, 142, 99, 0.36)',
      glow: 'rgba(161, 111, 73, 0.23)',
      accent: '#e0b68b',
    },
  },
  {
    keys: ['marine', 'aquatic', 'sea', 'ozonic', 'mint', 'green', 'fresh'],
    palette: {
      soft: 'rgba(98, 167, 177, 0.2)',
      softSecondary: 'rgba(73, 132, 142, 0.22)',
      border: 'rgba(123, 192, 202, 0.36)',
      glow: 'rgba(108, 184, 194, 0.2)',
      accent: '#8ed2dc',
    },
  },
];

function getFragrancePalette(fragrance: any) {
  const noteText = [
    ...(fragrance.top_notes || []),
    ...(fragrance.middle_notes || []),
    ...(fragrance.base_notes || []),
  ]
    .join(' ')
    .toLowerCase();

  const themed = NOTE_THEMES.find(({ keys }) => keys.some((key) => noteText.includes(key)));
  return themed?.palette || {
    soft: 'rgba(178, 132, 102, 0.22)',
    softSecondary: 'rgba(122, 88, 67, 0.25)',
    border: 'rgba(214, 176, 144, 0.34)',
    glow: 'rgba(188, 141, 108, 0.2)',
    accent: '#f4bb92',
  };
}

export default function StandardQuiz() {
  const router = useRouter();
  const [currentFragranceIndex, setCurrentFragranceIndex] = useState(0);        
  const [rating, setRating] = useState<number | null>(null);

  const { addQuizResponse, isAuthenticated } = useAppStore();
  const submitRatingMutation = useSubmitRating();

  // Load fragrances from mock data (no API calls needed)
  const fragrances = getQuizFragrances();
  const isLoading = false;

  const handleRating = (value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      setRating(null);
      return;
    }
    const safe = Math.min(10, Math.max(0, value));
    setRating(Number(safe.toFixed(1)));
  };

  const handleNext = () => {
    if (rating === null || !fragrances) return;

    const currentFragrance = fragrances[currentFragranceIndex];
    addQuizResponse({
      fragrance_id: currentFragrance.id,
      rating,
    });

    // If authenticated, persist the rating instantly
    if (isAuthenticated) {
      submitRatingMutation.mutate({ fragranceId: currentFragrance.id, rating }, {
        onError: (err) => console.error("Failed to sync rating", err)
      });
    }

    if (currentFragranceIndex < fragrances.length - 1) {
      setCurrentFragranceIndex(currentFragranceIndex + 1);
      setRating(null);
    } else {
      // Quiz complete - go to recommendations
      router.push('/recommendations');
    }
  };

  const handleSkip = () => {
    if (currentFragranceIndex < fragrances.length - 1) {
      setCurrentFragranceIndex(currentFragranceIndex + 1);
      setRating(null);
    } else {
      // Quiz complete - go to recommendations
      router.push('/recommendations');
    }
  };

  if (isLoading || !fragrances || fragrances.length === 0) {
    return <div className="quiz-loading">Loading fragrances...</div>;
  }

  const currentFragrance = fragrances[currentFragranceIndex];
  const progress = ((currentFragranceIndex + 1) / fragrances.length) * 100;
  const palette = getFragrancePalette(currentFragrance);
  const totalQuestions = fragrances.length;
  const progressLabel = `${progress.toFixed(0)}%`;

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        <div className="quiz-header" string="reveal">
          <h1>Discover Your Signature Scent</h1>
          <p>Rate your favorite fragrances to get personalized recommendations</p>
        </div>

        <div className="quiz-progress-meta" string="reveal">
          <span className="quiz-progress-text">Progress</span>
          <strong className="quiz-progress-value">{progressLabel}</strong>
        </div>

        <div
          className="quiz-card"
          style={{
            '--quiz-soft': palette.soft,
            '--quiz-soft-secondary': palette.softSecondary,
            '--quiz-border': palette.border,
            '--quiz-glow': palette.glow,
            '--quiz-accent': palette.accent,
          } as any}
          string="impulse"
          string-continuous-push="false"
          string-position-strength="0.12"
          string-position-tension="0.1"
          string-position-friction="0.14"
          string-rotation-strength="0.08"
          string-rotation-tension="0.1"
          string-rotation-friction="0.14"
        >
          <div className="fragrance-preview">
            <div className="fragrance-emoji">🧴</div>
            <h2 className="fragrance-title">{currentFragrance.name}</h2>
            <p className="fragrance-brand">{currentFragrance.brand}</p>
          </div>

          <div className="rating-section" string="reveal" style={{ animationDelay: `0.2s` }}>
            <p className="rating-label">Give this fragrance a precise score</p>
            <div className="rating-field-wrap" string="impulse" string-continuous-push="false" string-position-strength="0.08">
              <label htmlFor="quiz-rating" className="rating-input-label">Your rating</label>
              <div className="rating-input-shell">
                <input
                  id="quiz-rating"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="10"
                  step="0.1"
                  value={rating ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!raw) {
                      handleRating(null);
                      return;
                    }
                    handleRating(Number(raw));
                  }}
                  className="rating-input"
                  placeholder="7.8"
                  aria-label="Rate this fragrance from 0 to 10"
                />
                <span className="rating-suffix">/10</span>
              </div>
              <p className="rating-help">Use decimal scores for sharper recommendations.</p>
            </div>

            <div className="rating-quick-picks">
              {[2.5, 5, 7.5, 9.5].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`rating-chip ${rating === preset ? 'active' : ''}`}
                  onClick={() => handleRating(preset)}
                >
                  {preset.toFixed(1)}
                </button>
              ))}
            </div>

            <div className="rating-display">
              {rating !== null ? rating.toFixed(1) : '--'} / 10
            </div>

            <div className="quiz-progress-footnote">
              Question {currentFragranceIndex + 1} of {totalQuestions}
            </div>
          </div>

          <div className="quiz-notes-preview" string="reveal" style={{ animationDelay: `0.4s` }}>
            <p className="notes-title">Top Notes:</p>
            <div className="notes-pills">
              {currentFragrance.top_notes?.map((note: string) => (
                <span key={note} className="note-pill">
                  {note}
                </span>
              ))}
            </div>
          </div>

          <div className="quiz-controls">
            <button
              className="quiz-btn quiz-btn-skip"
              onClick={handleSkip}
            >
              Skip
            </button>
            <button
              className="quiz-btn quiz-btn-next-primary"
              onClick={handleNext}
              disabled={rating === null}
              string="impulse"
              string-continuous-push="false"
              string-position-strength="0.07"
              string-position-tension="0.1"
              string-position-friction="0.12"
            >
              {currentFragranceIndex === fragrances.length - 1 ? 'Get Recommendations' : 'Next Fragrance'}
            </button>
          </div>

          <div className="quiz-counter">
            {currentFragranceIndex + 1} of {fragrances.length}
          </div>
        </div>
      </div>
    </div>
  );
}



