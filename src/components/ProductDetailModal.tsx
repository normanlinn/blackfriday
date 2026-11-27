'use client';

import {
  Check,
  ExternalLink,
  Lightbulb,
  Plus,
  ShieldAlert,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { useModalBehavior } from '@/lib/hooks';
import type {
  PriorityLevel,
  ProductItem,
  SelectionEntry,
  ShopperProfile,
  StoreInfo,
} from '@/types/shopping';
import {
  formatCurrency,
  getDiscountPercent,
  getProductImageSrc,
  getSavingsAmount,
  getVerdictMeta,
} from '@/utils/deals';
import { PriceHistoryChart } from './PriceHistoryChart';

interface ProductDetailModalProps {
  product: ProductItem | null;
  store?: StoreInfo;
  selection?: SelectionEntry;
  shoppers: ShopperProfile[];
  onClose: () => void;
  onToggleSelect: (product: ProductItem) => void;
  onUpdateSelection: (
    productId: string,
    patch: Partial<Pick<SelectionEntry, 'shopperId' | 'priority' | 'purchased' | 'quantity' | 'note'>>,
  ) => void;
}

export function ProductDetailModal({
  product,
  store,
  selection,
  shoppers,
  onClose,
  onToggleSelect,
  onUpdateSelection,
}: ProductDetailModalProps) {
  useModalBehavior(Boolean(product), onClose);

  if (!product) return null;

  const discount = getDiscountPercent(product.msrp, product.currentPrice);
  const savings = getSavingsAmount(product.msrp, product.currentPrice);
  const verdictMeta = getVerdictMeta(product.verdict);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel modal-animate"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-product-title"
      >
        <div className="modal-header">
          <div className="modal-header-meta">
            <span className="store-pill">{product.storeName}</span>
            <span className="category-pill">{product.category}</span>
            <span className={`verdict-badge ${verdictMeta.toneClass}`}>
              {verdictMeta.label}
            </span>
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

        <div className="modal-content-grid">
          <div className="modal-left">
            <div className="modal-product-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductImageSrc(product)}
                alt={product.name}
                className="modal-photo-img"
              />
            </div>
            <p className="modal-brand">{product.brand}</p>
            <h2 id="modal-product-title" className="modal-title">
              {product.name}
            </h2>

            <div className="modal-price-hero">
              <div>
                <div className="pc-price-main">
                  <span className="modal-price">{formatCurrency(product.currentPrice)}</span>
                  {product.msrp > product.currentPrice && (
                    <span className="pc-msrp">{formatCurrency(product.msrp)}</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="pc-savings-line">
                    You save {formatCurrency(savings)} ({discount}% off MSRP)
                  </p>
                )}
              </div>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-gold"
              >
                Shop at {product.storeName} <ExternalLink size={15} />
              </a>
            </div>

            <div className="modal-advice-stack">
              <div className="advice-box">
                <Sparkles size={16} className="text-gold" />
                <div>
                  <strong>Why We Recommend It</strong>
                  <p>{product.whyRecommended}</p>
                </div>
              </div>

              <div className={`advice-box ${product.verdict === 'watch-out' ? 'advice-warn' : ''}`}>
                {product.verdict === 'watch-out' ? (
                  <ShieldAlert size={16} className="text-rose" />
                ) : (
                  <Lightbulb size={16} className="text-emerald" />
                )}
                <div>
                  <strong>Price Analyst Verdict</strong>
                  <p>{product.buyAdvice}</p>
                </div>
              </div>

              {store && (
                <div className="advice-box">
                  <Store size={16} className="text-sky" />
                  <div>
                    <strong>{store.name} Stacking Tip</strong>
                    <p>
                      {store.stackingTip} ({store.freeShipping})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-right">
            <h3 className="section-mini-title">12-Month Price History &amp; Truth Check</h3>
            <PriceHistoryChart
              points={product.priceHistory}
              msrp={product.msrp}
              allTimeLow={product.allTimeLow}
              avg90Day={product.avg90Day}
              currentPrice={product.currentPrice}
            />

            <div className="modal-selection-box">
              <div className="modal-selection-top">
                <h3 className="section-mini-title">Saved Shopping Lists</h3>
                <button
                  type="button"
                  className={`btn-select ${selection ? 'selected' : ''}`}
                  onClick={() => onToggleSelect(product)}
                >
                  {selection ? (
                    <>
                      <Check size={15} /> In Your List
                    </>
                  ) : (
                    <>
                      <Plus size={15} /> Save to List
                    </>
                  )}
                </button>
              </div>

              {selection ? (
                <div className="modal-selection-fields">
                  <label className="field-group">
                    <span>List / Recipient</span>
                    <select
                      value={selection.shopperId}
                      onChange={(e) =>
                        onUpdateSelection(product.id, { shopperId: e.target.value })
                      }
                    >
                      {shoppers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.emoji} {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field-group">
                    <span>Priority</span>
                    <select
                      value={selection.priority}
                      onChange={(e) =>
                        onUpdateSelection(product.id, {
                          priority: e.target.value as PriorityLevel,
                        })
                      }
                    >
                      <option value="must-have">Must Have</option>
                      <option value="nice-to-have">Nice to Have</option>
                      <option value="watching">Watching Price</option>
                    </select>
                  </label>

                  <label className="field-group">
                    <span>Qty</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selection.quantity}
                      onChange={(e) =>
                        onUpdateSelection(product.id, {
                          quantity: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </label>

                  <label className="field-group field-full">
                    <span>Note (size, shade, gift idea...)</span>
                    <input
                      type="text"
                      placeholder="e.g. Shade Rose Quartz, Size M, wrap for holiday..."
                      value={selection.note}
                      onChange={(e) =>
                        onUpdateSelection(product.id, { note: e.target.value })
                      }
                    />
                  </label>
                </div>
              ) : (
                <p className="muted-hint">
                  Save this item to keep it in your account lists, track budgets, and compare prices.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
