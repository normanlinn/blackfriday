'use client';

import { Check, Sliders, Sparkles, X } from 'lucide-react';
import type { Category, GenderFocus, UserPreferences } from '@/types/shopping';

interface PersonalizeModalProps {
  open: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onSavePreferences: (prefs: UserPreferences) => void;
}

const ALL_CATEGORIES: Category[] = [
  'Skincare & Beauty',
  'Shoes & Sneakers',
  'Accessories & Jewelry',
  'Apparel & Loungewear',
  'Cookware & Kitchen',
  'Tech & Audio',
  'Fitness & Travel',
  'Gaming & Home Theater',
];

export function PersonalizeModal({
  open,
  preferences,
  onClose,
  onSavePreferences,
}: PersonalizeModalProps) {
  if (!open) return null;

  const toggleCategory = (cat: Category) => {
    const exists = preferences.favoriteCategories.includes(cat);
    const next = exists
      ? preferences.favoriteCategories.filter((c) => c !== cat)
      : [...preferences.favoriteCategories, cat];
    onSavePreferences({ ...preferences, favoriteCategories: next });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel modal-panel-sm modal-animate"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalize-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              <Sparkles size={12} /> Tailored Deal Ranking
            </span>
            <h2 id="personalize-title" className="modal-title-sm">
              Personalize Your Shopping Feed
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="personalize-sections">
          <div className="personalize-block">
            <label className="personalize-label">
              <Sliders size={14} /> Preferred Style / Gender Focus
            </label>
            <div className="chip-group">
              {(
                [
                  { id: 'all', label: 'All Styles' },
                  { id: 'women', label: "Women's" },
                  { id: 'men', label: "Men's" },
                  { id: 'unisex', label: 'Unisex & Home' },
                ] as Array<{ id: 'all' | GenderFocus; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`filter-chip ${preferences.genderFocus === opt.id ? 'active' : ''}`}
                  onClick={() =>
                    onSavePreferences({ ...preferences, genderFocus: opt.id })
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="personalize-block">
            <label className="personalize-label">
              Favorite Categories (boosts match score)
            </label>
            <div className="chip-group">
              {ALL_CATEGORIES.map((cat) => {
                const active = preferences.favoriteCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-chip ${active ? 'active' : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {active && <Check size={12} />} {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="personalize-block">
            <label className="personalize-label">Target Budget Tier</label>
            <div className="chip-group">
              {(
                [
                  { id: 'all', label: 'Any Price' },
                  { id: 'under-75', label: 'Smart Finds (<$75)' },
                  { id: 'mid', label: 'Sweet Spot ($75–$300)' },
                  { id: 'luxury', label: 'Splurge Upgrades ($250+)' },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  className={`filter-chip ${preferences.budgetTier === tier.id ? 'active' : ''}`}
                  onClick={() =>
                    onSavePreferences({ ...preferences, budgetTier: tier.id })
                  }
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="custom-form-footer" style={{ marginTop: 18 }}>
          <button type="button" className="btn-primary-gold" onClick={onClose}>
            Done &amp; Apply Matches
          </button>
        </div>
      </div>
    </div>
  );
}
