'use client';

import { useCallback, useState } from 'react';
import {
  Check,
  ExternalLink,
  LineChart,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import type { ProductItem, SelectionEntry, ShopperProfile } from '@/types/shopping';
import {
  formatCurrency,
  getDiscountPercent,
  getProductImageSrc,
  getSavingsAmount,
  getVerdictMeta,
} from '@/utils/deals';
import { useInView } from '@/lib/hooks';
import { PriceHistoryChart } from './PriceHistoryChart';

interface ProductCardProps {
  product: ProductItem;
  index: number;
  matchScore: number;
  selection?: SelectionEntry;
  shoppers: ShopperProfile[];
  onToggleSelect: (product: ProductItem) => void;
  onAssignShopper: (productId: string, shopperId: string) => void;
  onOpenDetail: (product: ProductItem) => void;
}

export function ProductCard({
  product,
  index,
  matchScore,
  selection,
  shoppers,
  onToggleSelect,
  onAssignShopper,
  onOpenDetail,
}: ProductCardProps) {
  const [imgFallback, setImgFallback] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { ref, inView } = useInView<HTMLElement>();

  // Cursor-following spotlight, written straight to CSS vars (no re-render).
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);

  const discount = getDiscountPercent(product.msrp, product.currentPrice);
  const savings = getSavingsAmount(product.msrp, product.currentPrice);
  const verdictMeta = getVerdictMeta(product.verdict);
  const isSelected = Boolean(selection);
  const assignedShopper = selection
    ? shoppers.find((s) => s.id === selection.shopperId)
    : undefined;

  const genderLabel =
    product.genderFocus === 'women'
      ? "Women's"
      : product.genderFocus === 'men'
        ? "Men's"
        : 'Unisex / All';

  const genderClass =
    product.genderFocus === 'women'
      ? 'audience-gf'
      : product.genderFocus === 'men'
        ? 'audience-me'
        : 'audience-shared';

  const imgSrc = imgFallback
    ? './products/tech-audio.jpg'
    : getProductImageSrc(product);

  return (
    <article
      ref={ref}
      className={`product-card reveal ${inView ? 'is-visible' : ''} ${isSelected ? 'is-selected' : ''}`}
      style={{ '--stagger': index % 4 } as React.CSSProperties}
      onPointerMove={handlePointerMove}
    >
      {/* Editorial Product Photo */}
      <div
        className="pc-media-frame"
        onClick={() => onOpenDetail(product)}
        role="button"
        tabIndex={0}
        aria-label={`Open details for ${product.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail(product);
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={product.name}
          className={`pc-media-img ${imgLoaded ? 'is-loaded' : ''}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgFallback(true);
            setImgLoaded(true);
          }}
        />
        <div className="pc-media-overlay" />
        <div className="pc-media-badges">
          <span className={`verdict-badge ${verdictMeta.toneClass}`} title={verdictMeta.description}>
            {verdictMeta.label}
          </span>
          {discount > 0 && <span className="discount-chip">-{discount}%</span>}
        </div>
        <div className="pc-media-bottom">
          <span className="store-pill">{product.storeName}</span>
          <span className="category-pill">{product.category}</span>
        </div>
      </div>

      <div className="pc-body">
        <div className="pc-brand-row">
          <span className="pc-brand">{product.brand}</span>
          <div className="pc-right-meta">
            {matchScore >= 78 && (
              <span className="match-pill">
                <Sparkles size={10} /> {matchScore}% Match
              </span>
            )}
            <span className="pc-rating">
              <Star size={13} fill="currentColor" />
              {product.rating.toFixed(1)}
              <span className="pc-reviews">({product.reviewCount})</span>
            </span>
          </div>
        </div>

        <h3 className="pc-title">
          <button
            type="button"
            className="pc-title-btn"
            onClick={() => onOpenDetail(product)}
          >
            {product.name}
          </button>
        </h3>

        <p className="pc-why">{product.whyRecommended}</p>

        <div className="pc-tags">
          <span className={`audience-tag ${genderClass}`}>{genderLabel}</span>
          {product.vibeTags.slice(0, 2).map((tag) => (
            <span key={tag} className="vibe-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className="pc-sparkline-box"
        onClick={() => onOpenDetail(product)}
        role="button"
        tabIndex={0}
        aria-label={`Open details for ${product.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail(product);
          }
        }}
      >
        <div className="pc-spark-labels">
          <span>12-month price history</span>
          <span>
            Low {formatCurrency(product.allTimeLow)} · High{' '}
            {formatCurrency(Math.max(...product.priceHistory.map((p) => p.price), product.msrp))}
          </span>
        </div>
        <PriceHistoryChart
          points={product.priceHistory}
          msrp={product.msrp}
          allTimeLow={product.allTimeLow}
          avg90Day={product.avg90Day}
          currentPrice={product.currentPrice}
          compact
        />
      </div>

      <div className="pc-pricing-row">
        <div>
          <div className="pc-price-main">
            <span className="pc-current-price">{formatCurrency(product.currentPrice)}</span>
            {product.msrp > product.currentPrice && (
              <span className="pc-msrp">{formatCurrency(product.msrp)}</span>
            )}
          </div>
          {savings > 0 && (
            <span className="pc-savings-line">
              Save {formatCurrency(savings)} ({discount}% off)
            </span>
          )}
        </div>
      </div>

      {isSelected && selection && (
        <div className="pc-shopper-assign">
          <span>List:</span>
          <select
            aria-label={`Assign ${product.name} to list`}
            value={selection.shopperId}
            onChange={(e) => onAssignShopper(product.id, e.target.value)}
            style={assignedShopper ? { borderColor: assignedShopper.color } : undefined}
          >
            {shoppers.map((shopper) => (
              <option key={shopper.id} value={shopper.id}>
                {shopper.emoji} {shopper.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="pc-actions">
        <button
          type="button"
          className={`btn-select ${isSelected ? 'selected' : ''}`}
          onClick={() => onToggleSelect(product)}
        >
          {isSelected ? (
            <>
              <Check size={15} /> Saved
            </>
          ) : (
            <>
              <Plus size={15} /> Save to List
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-ghost-icon"
          onClick={() => onOpenDetail(product)}
          title="View 12-month price history & buy advice"
        >
          <LineChart size={15} /> Price history
        </button>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost-icon btn-icon"
          title={`Shop at ${product.storeName}`}
          aria-label={`Shop ${product.name} at ${product.storeName}`}
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </article>
  );
}
