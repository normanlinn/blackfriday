'use client';

import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  Download,
  ExternalLink,
  LineChart,
  LogIn,
  Plus,
  Share2,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import type {
  AuthUser,
  PriorityLevel,
  ProductItem,
  SelectionEntry,
  ShopperProfile,
} from '@/types/shopping';
import {
  formatCurrency,
  getDiscountPercent,
  getSavingsAmount,
} from '@/utils/deals';

interface WatchlistViewProps {
  user: AuthUser | null;
  products: ProductItem[];
  selections: SelectionEntry[];
  shoppers: ShopperProfile[];
  onOpenAuth: () => void;
  onUpdateSelection: (
    productId: string,
    patch: Partial<Pick<SelectionEntry, 'shopperId' | 'priority' | 'purchased' | 'quantity' | 'note'>>,
  ) => void;
  onRemoveSelection: (productId: string) => void;
  onClearPurchased: () => void;
  onOpenDetail: (product: ProductItem) => void;
  onAddShopper: (name: string, emoji: string, budget: number) => void;
  onUpdateShopper: (id: string, patch: Partial<ShopperProfile>) => void;
  onDeleteShopper: (id: string) => void;
  onCopyShareLink: () => Promise<boolean>;
  onExportJson: () => void;
  onImportJson: (raw: string) => boolean;
  onGoToCatalog: () => void;
}

export function WatchlistView({
  user,
  products,
  selections,
  shoppers,
  onOpenAuth,
  onUpdateSelection,
  onRemoveSelection,
  onClearPurchased,
  onOpenDetail,
  onAddShopper,
  onUpdateShopper,
  onDeleteShopper,
  onCopyShareLink,
  onExportJson,
  onImportJson,
  onGoToCatalog,
}: WatchlistViewProps) {
  const [filterShopper, setFilterShopper] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'purchased'>('all');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('💖');
  const [newBudget, setNewBudget] = useState(400);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const rows = selections
    .map((sel) => ({ sel, product: productMap.get(sel.productId) }))
    .filter((entry): entry is { sel: SelectionEntry; product: ProductItem } =>
      Boolean(entry.product),
    );

  const filteredRows = rows.filter(({ sel }) => {
    if (filterShopper !== 'all' && sel.shopperId !== filterShopper) return false;
    if (filterStatus === 'pending' && sel.purchased) return false;
    if (filterStatus === 'purchased' && !sel.purchased) return false;
    return true;
  });

  const totals = rows.reduce(
    (acc, { sel, product }) => {
      const qty = sel.quantity;
      const sale = product.currentPrice * qty;
      const retail = product.msrp * qty;
      acc.totalSale += sale;
      acc.totalRetail += retail;
      acc.totalSaved += getSavingsAmount(retail, sale);
      if (sel.purchased) {
        acc.purchasedCount += 1;
        acc.spent += sale;
      }
      return acc;
    },
    { totalSale: 0, totalRetail: 0, totalSaved: 0, purchasedCount: 0, spent: 0 },
  );

  const handleShareClick = async () => {
    const ok = await onCopyShareLink();
    setShareFeedback(ok ? 'Share link copied to clipboard!' : 'URL updated — copy from address bar.');
    setTimeout(() => setShareFeedback(null), 3200);
  };

  const handleCreateShopper = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddShopper(trimmed, newEmoji || '✨', Math.max(50, Number(newBudget) || 300));
    setNewName('');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const ok = onImportJson(reader.result);
        setShareFeedback(ok ? 'Imported shared list!' : 'Could not read list JSON.');
        setTimeout(() => setShareFeedback(null), 3200);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="section-stack panel-reveal">
      <div className="hero-strip">
        <div>
          <span className="eyebrow">Saved Lists &amp; Budget Tracker</span>
          <h2 className="section-heading">Your Black Friday Bag &amp; Savings</h2>
          <p className="section-sub">
            Organize wishlists for yourself, friends, or family, track budgets, check off purchases, and sync across sessions.
          </p>
        </div>

        <div className="share-toolbar">
          {!user && (
            <button type="button" className="btn-select" onClick={onOpenAuth}>
              <LogIn size={15} /> Sign In to Save Forever
            </button>
          )}
          <button type="button" className="btn-primary-gold" onClick={handleShareClick}>
            <Share2 size={15} /> Copy Share Link
          </button>
          <button type="button" className="btn-ghost-icon" onClick={onExportJson} title="Export JSON backup">
            <Download size={15} /> Export
          </button>
          <button
            type="button"
            className="btn-ghost-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON backup"
          >
            <Upload size={15} /> Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={handleFileImport}
          />
        </div>
      </div>

      {shareFeedback && (
        <div className="toast-banner">
          <Copy size={15} />
          <span>{shareFeedback}</span>
        </div>
      )}

      {/* Overall Summary KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span>Saved Items</span>
          <strong>{rows.length}</strong>
          <small>{totals.purchasedCount} checked off</small>
        </div>
        <div className="kpi-card">
          <span>Total Black Friday Cost</span>
          <strong className="text-gold">{formatCurrency(totals.totalSale)}</strong>
          <small>Retail {formatCurrency(totals.totalRetail)}</small>
        </div>
        <div className="kpi-card">
          <span>Total Combined Savings</span>
          <strong className="text-emerald">{formatCurrency(totals.totalSaved)}</strong>
          <small>
            {totals.totalRetail > 0
              ? `${Math.round((totals.totalSaved / totals.totalRetail) * 100)}% avg off`
              : 'Add deals to calculate'}
          </small>
        </div>
        <div className="kpi-card">
          <span>Already Purchased</span>
          <strong>{formatCurrency(totals.spent)}</strong>
          <small>{rows.length - totals.purchasedCount} remaining</small>
        </div>
      </div>

      {/* Lists & Budgets */}
      <div className="shoppers-panel">
        <div className="shoppers-panel-head">
          <div className="matchmaker-title">
            <Users size={17} className="text-gold" />
            <h3>Lists &amp; Per-List Budgets</h3>
          </div>
          <form className="add-shopper-form" onSubmit={handleCreateShopper}>
            <select
              aria-label="List emoji"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
            >
              <option value="💖">💖</option>
              <option value="✨">✨</option>
              <option value="🛍️">🛍️</option>
              <option value="⚡">⚡</option>
              <option value="🖤">🖤</option>
              <option value="🏡">🏡</option>
            </select>
            <input
              type="text"
              placeholder="New list name (e.g. Mom, Shoes)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="number"
              min={50}
              step={50}
              value={newBudget}
              onChange={(e) => setNewBudget(Number(e.target.value))}
              aria-label="Budget"
              className="budget-num-input"
            />
            <button type="submit" className="btn-select">
              <UserPlus size={14} /> Add List
            </button>
          </form>
        </div>

        <div className="shoppers-grid">
          {shoppers.map((shopper) => {
            const personRows = rows.filter((r) => r.sel.shopperId === shopper.id);
            const personTotal = personRows.reduce(
              (sum, r) => sum + r.product.currentPrice * r.sel.quantity,
              0,
            );
            const pct =
              shopper.budget > 0
                ? Math.min(100, Math.round((personTotal / shopper.budget) * 100))
                : 0;
            const overBudget = personTotal > shopper.budget;

            return (
              <div key={shopper.id} className="shopper-card">
                <div className="shopper-card-top">
                  <div className="shopper-name-edit">
                    <span>{shopper.emoji}</span>
                    <input
                      type="text"
                      value={shopper.name}
                      aria-label={`Rename ${shopper.name}`}
                      onChange={(e) =>
                        onUpdateShopper(shopper.id, { name: e.target.value })
                      }
                    />
                  </div>
                  {shoppers.length > 1 && (
                    <button
                      type="button"
                      className="icon-trash-btn"
                      onClick={() => onDeleteShopper(shopper.id)}
                      title="Remove list"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="shopper-budget-row">
                  <span>
                    {personRows.length} {personRows.length === 1 ? 'item' : 'items'} ·{' '}
                    <strong className={overBudget ? 'text-rose' : ''}>
                      {formatCurrency(personTotal)}
                    </strong>
                  </span>
                  <label className="budget-inline">
                    Cap: $
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={shopper.budget}
                      onChange={(e) =>
                        onUpdateShopper(shopper.id, {
                          budget: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${overBudget ? 'over' : ''}`}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: overBudget ? 'var(--accent-rose)' : shopper.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters for list */}
      <div className="list-filter-row">
        <div className="chip-scroll">
          <button
            type="button"
            className={`filter-chip ${filterShopper === 'all' ? 'active' : ''}`}
            onClick={() => setFilterShopper('all')}
          >
            All Lists ({rows.length})
          </button>
          {shoppers.map((s) => {
            const count = rows.filter((r) => r.sel.shopperId === s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                className={`filter-chip ${filterShopper === s.id ? 'active' : ''}`}
                onClick={() => setFilterShopper(s.id)}
              >
                {s.emoji} {s.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="chip-group">
          {(['all', 'pending', 'purchased'] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All' : status === 'pending' ? 'To Buy' : 'Purchased'}
            </button>
          ))}
          {totals.purchasedCount > 0 && (
            <button type="button" className="btn-ghost-icon" onClick={onClearPurchased}>
              Clear Purchased
            </button>
          )}
        </div>
      </div>

      {/* Selected Items */}
      {filteredRows.length === 0 ? (
        <div className="empty-state-box">
          <h3>Your Black Friday bag is ready to fill</h3>
          <p>
            Search all deals, inspect 12-month price histories, and save items into your lists.
          </p>
          <button type="button" className="btn-primary-gold" onClick={onGoToCatalog}>
            <Plus size={15} /> Browse All Deals
          </button>
        </div>
      ) : (
        <div className="watchlist-items">
          {filteredRows.map(({ sel, product }, idx) => {
            const disc = getDiscountPercent(product.msrp, product.currentPrice);
            const lineTotal = product.currentPrice * sel.quantity;
            return (
              <article
                key={product.id}
                className={`watchlist-row card-stagger ${sel.purchased ? 'is-purchased' : ''}`}
                style={{ '--stagger': Math.min(idx, 12) } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="check-toggle"
                  onClick={() =>
                    onUpdateSelection(product.id, { purchased: !sel.purchased })
                  }
                  aria-label={sel.purchased ? 'Mark unpurchased' : 'Mark purchased'}
                >
                  {sel.purchased ? (
                    <CheckCircle2 size={22} className="text-emerald" />
                  ) : (
                    <Circle size={22} />
                  )}
                </button>

                <div className="wl-main">
                  <div className="wl-title-line">
                    <button
                      type="button"
                      className="pc-title-btn"
                      onClick={() => onOpenDetail(product)}
                    >
                      {product.name}
                    </button>
                    <span className="store-pill">{product.storeName}</span>
                    {disc > 0 && <span className="discount-inline">-{disc}%</span>}
                  </div>

                  <div className="wl-controls-line">
                    <select
                      aria-label="List"
                      value={sel.shopperId}
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

                    <select
                      aria-label="Priority"
                      value={sel.priority}
                      onChange={(e) =>
                        onUpdateSelection(product.id, {
                          priority: e.target.value as PriorityLevel,
                        })
                      }
                    >
                      <option value="must-have">Must Have</option>
                      <option value="nice-to-have">Nice to Have</option>
                      <option value="watching">Watching</option>
                    </select>

                    <label className="qty-box">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={sel.quantity}
                        onChange={(e) =>
                          onUpdateSelection(product.id, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </label>

                    <input
                      type="text"
                      className="wl-note-input"
                      placeholder="Add note (shade, size, link...)"
                      value={sel.note}
                      onChange={(e) =>
                        onUpdateSelection(product.id, { note: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="wl-right">
                  <div className="wl-price-col">
                    <strong>{formatCurrency(lineTotal)}</strong>
                    <small>
                      {formatCurrency(product.currentPrice)} ea (MSRP{' '}
                      {formatCurrency(product.msrp)})
                    </small>
                  </div>
                  <div className="wl-row-btns">
                    <button
                      type="button"
                      className="btn-ghost-icon"
                      onClick={() => onOpenDetail(product)}
                      title="View Price History"
                    >
                      <LineChart size={14} />
                    </button>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost-icon"
                      title="Open Store"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      className="icon-trash-btn"
                      onClick={() => onRemoveSelection(product.id)}
                      title="Remove from list"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
