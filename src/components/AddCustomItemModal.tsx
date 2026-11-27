import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Category, ProductItem, ShopperProfile } from '../types/shopping';
import { computeVerdict, generateDefaultHistory } from '../utils/deals';

interface AddCustomItemModalProps {
  open: boolean;
  shoppers: ShopperProfile[];
  onClose: () => void;
  onAddCustomItem: (product: ProductItem, shopperId: string, note: string) => void;
}

const CATEGORIES: Category[] = [
  'Beauty & Skincare',
  'Fashion & Bags',
  'Tech & Audio',
  'Home & Kitchen',
  'Fitness & Wellness',
  'Travel & Luggage',
  'Gaming & Entertainment',
];

export function AddCustomItemModal({
  open,
  shoppers,
  onClose,
  onAddCustomItem,
}: AddCustomItemModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [storeName, setStoreName] = useState('Sephora');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<Category>('Beauty & Skincare');
  const [msrp, setMsrp] = useState('120');
  const [currentPrice, setCurrentPrice] = useState('84');
  const [allTimeLow, setAllTimeLow] = useState('84');
  const [shopperId, setShopperId] = useState(shoppers[1]?.id ?? shoppers[0]?.id ?? 'me');
  const [note, setNote] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const numMsrp = Math.max(1, Number(msrp) || 100);
    const numPrice = Math.max(1, Number(currentPrice) || numMsrp);
    const numAtl = Math.max(1, Number(allTimeLow) || numPrice);
    const avg90 = Math.round((numMsrp + numPrice) / 2);
    const verdict = computeVerdict(numMsrp, numPrice, numAtl, avg90);

    const safeUrl =
      url.trim().startsWith('http://') || url.trim().startsWith('https://')
        ? url.trim()
        : `https://www.google.com/search?q=${encodeURIComponent(
            `${storeName} ${cleanName}`,
          )}`;

    const newItem: ProductItem = {
      id: `custom-${Date.now()}`,
      name: cleanName,
      brand: brand.trim() || storeName.trim() || 'Custom Pick',
      category,
      storeId: storeName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'custom',
      storeName: storeName.trim() || 'Online Store',
      url: safeUrl,
      msrp: numMsrp,
      currentPrice: numPrice,
      allTimeLow: numAtl,
      avg90Day: avg90,
      verdict,
      priceHistory: generateDefaultHistory(numMsrp, numPrice),
      recommendedFor:
        shopperId === 'me'
          ? ['me']
          : shopperId === 'shared'
            ? ['shared']
            : ['girlfriends'],
      vibeTags: ['Custom Pick'],
      whyRecommended: note.trim() || 'Added directly to your shared Black Friday list.',
      buyAdvice:
        verdict === 'all-time-low'
          ? 'Matches your tracked all-time low price!'
          : 'Custom item — compare against your target price before checkout.',
      rating: 4.8,
      reviewCount: 'Custom',
      isCustom: true,
    };

    onAddCustomItem(newItem, shopperId, note.trim());
    setName('');
    setBrand('');
    setUrl('');
    setNote('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel modal-panel-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-custom-title"
      >
        <div className="modal-header">
          <h2 id="add-custom-title" className="modal-title-sm">
            Add Custom Deal or Wishlist Item
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form className="custom-form" onSubmit={handleSubmit}>
          <label className="field-group field-full">
            <span>Product Name *</span>
            <input
              type="text"
              required
              placeholder="e.g. Rhode Peptide Lip Treatment Set"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Brand</span>
            <input
              type="text"
              placeholder="e.g. Rhode"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Store Name</span>
            <input
              type="text"
              placeholder="e.g. Sephora, Amazon, Aritzia"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Assign To</span>
            <select
              value={shopperId}
              onChange={(e) => setShopperId(e.target.value)}
            >
              {shoppers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Original MSRP ($)</span>
            <input
              type="number"
              min={1}
              step="any"
              value={msrp}
              onChange={(e) => setMsrp(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Black Friday Price ($)</span>
            <input
              type="number"
              min={1}
              step="any"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Lowest Seen Price ($)</span>
            <input
              type="number"
              min={1}
              step="any"
              value={allTimeLow}
              onChange={(e) => setAllTimeLow(e.target.value)}
            />
          </label>

          <label className="field-group field-full">
            <span>Product Link (optional)</span>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          <label className="field-group field-full">
            <span>Note (shade, size, promo code...)</span>
            <input
              type="text"
              placeholder="e.g. Use code FRIDAY20 at checkout"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <div className="custom-form-footer field-full">
            <button type="button" className="btn-ghost-icon" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-gold">
              <Plus size={15} /> Add & Select Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
