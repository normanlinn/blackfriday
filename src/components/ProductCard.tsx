import {
  Check,
  ExternalLink,
  LineChart,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import type { ProductItem, SelectionEntry, ShopperProfile } from '../types/shopping';
import {
  formatCurrency,
  getDiscountPercent,
  getSavingsAmount,
  getVerdictMeta,
} from '../utils/deals';
import { PriceHistoryChart } from './PriceHistoryChart';

interface ProductCardProps {
  product: ProductItem;
  selection?: SelectionEntry;
  shoppers: ShopperProfile[];
  onToggleSelect: (product: ProductItem) => void;
  onAssignShopper: (productId: string, shopperId: string) => void;
  onOpenDetail: (product: ProductItem) => void;
}

export function ProductCard({
  product,
  selection,
  shoppers,
  onToggleSelect,
  onAssignShopper,
  onOpenDetail,
}: ProductCardProps) {
  const discount = getDiscountPercent(product.msrp, product.currentPrice);
  const savings = getSavingsAmount(product.msrp, product.currentPrice);
  const verdictMeta = getVerdictMeta(product.verdict);
  const isSelected = Boolean(selection);
  const assignedShopper = selection
    ? shoppers.find((s) => s.id === selection.shopperId)
    : undefined;

  return (
    <article className={`product-card ${isSelected ? 'is-selected' : ''}`}>
      <div className="pc-top-row">
        <div className="pc-meta-left">
          <span className="store-pill">{product.storeName}</span>
          <span className="category-pill">{product.category}</span>
        </div>
        <span className={`verdict-badge ${verdictMeta.toneClass}`} title={verdictMeta.description}>
          {verdictMeta.label}
        </span>
      </div>

      <div className="pc-body">
        <div className="pc-brand-row">
          <span className="pc-brand">{product.brand}</span>
          <span className="pc-rating">
            <Star size={13} fill="currentColor" />
            {product.rating.toFixed(1)}
            <span className="pc-reviews">({product.reviewCount})</span>
          </span>
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
          {product.recommendedFor.includes('girlfriends') && (
            <span className="audience-tag audience-gf">
              <Sparkles size={11} /> For Girlfriends
            </span>
          )}
          {product.recommendedFor.includes('me') && (
            <span className="audience-tag audience-me">For Me</span>
          )}
          {product.recommendedFor.includes('shared') && (
            <span className="audience-tag audience-shared">Shared</span>
          )}
          {product.vibeTags.slice(0, 2).map((tag) => (
            <span key={tag} className="vibe-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pc-sparkline-box" onClick={() => onOpenDetail(product)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenDetail(product); }}>
        <div className="pc-spark-labels">
          <span>12-mo Trend</span>
          <span>ATL {formatCurrency(product.allTimeLow)}</span>
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
        {discount > 0 && <span className="discount-chip">-{discount}%</span>}
      </div>

      {isSelected && selection && (
        <div className="pc-shopper-assign">
          <span>Assigned to:</span>
          <select
            aria-label={`Assign ${product.name} to shopper`}
            value={selection.shopperId}
            onChange={(e) => onAssignShopper(product.id, e.target.value)}
            style={
              assignedShopper
                ? { borderColor: assignedShopper.color }
                : undefined
            }
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
              <Check size={15} /> Selected
            </>
          ) : (
            <>
              <Plus size={15} /> Select
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-ghost-icon"
          onClick={() => onOpenDetail(product)}
          title="View 12-month price history & buy advice"
        >
          <LineChart size={15} /> History
        </button>

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost-icon"
          title={`Shop at ${product.storeName}`}
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </article>
  );
}
