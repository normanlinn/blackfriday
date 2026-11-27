'use client';

import { useState } from 'react';
import { Globe, Loader2, Plus, X } from 'lucide-react';
import { useModalBehavior } from '@/lib/hooks';
import { fetchDealInfoFromUrl } from '@/lib/apiClient';
import type {
  Category,
  GenderFocus,
  ProductItem,
  ShopperProfile,
} from '@/types/shopping';
import { computeVerdict, generateDefaultHistory } from '@/utils/deals';

interface AddCustomItemModalProps {
  open: boolean;
  shoppers: ShopperProfile[];
  onClose: () => void;
  onAddCustomItem: (product: ProductItem, shopperId: string, note: string) => void;
}

const CATEGORIES: Category[] = [
  'Skincare & Beauty',
  'Shoes & Sneakers',
  'Accessories & Jewelry',
  'Apparel & Loungewear',
  'Cookware & Kitchen',
  'Tech & Audio',
  'Fitness & Travel',
  'Gaming & Home Theater',
];

export function AddCustomItemModal({
  open,
  shoppers,
  onClose,
  onAddCustomItem,
}: AddCustomItemModalProps) {
  useModalBehavior(open, onClose);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [storeName, setStoreName] = useState('Sephora');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<Category>('Skincare & Beauty');
  const [genderFocus, setGenderFocus] = useState<GenderFocus>('unisex');
  const [msrp, setMsrp] = useState('120');
  const [currentPrice, setCurrentPrice] = useState('84');
  const [allTimeLow, setAllTimeLow] = useState('84');
  const [shopperId, setShopperId] = useState(shoppers[0]?.id ?? 'personal');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [fetchHint, setFetchHint] = useState<string | null>(null);

  if (!open) return null;

  const handleFetchFromBackend = async () => {
    if (!url.trim()) return;
    setFetchingUrl(true);
    setFetchHint(null);
    const res = await fetchDealInfoFromUrl(url.trim());
    setFetchingUrl(false);

    if (!res.ok) {
      setFetchHint(res.error || 'Could not inspect URL.');
      return;
    }

    if (res.title && !name.trim()) setName(res.title);
    if (res.storeName) {
      setStoreName(res.storeName);
      if (!brand.trim()) setBrand(res.storeName);
    }
    if (res.imageUrl && !imageUrl.trim()) {
      setImageUrl(res.imageUrl);
    }
    if (res.detectedPrice) {
      setCurrentPrice(String(res.detectedPrice));
      setAllTimeLow(String(res.detectedPrice));
      if (Number(msrp) < res.detectedPrice) {
        setMsrp(String(Math.round(res.detectedPrice * 1.25)));
      }
    }
    setFetchHint(res.note || 'Product info fetched from backend!');
  };

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
      genderFocus,
      storeId: storeName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'custom',
      storeName: storeName.trim() || 'Online Store',
      url: safeUrl,
      msrp: numMsrp,
      currentPrice: numPrice,
      allTimeLow: numAtl,
      avg90Day: avg90,
      verdict,
      priceHistory: generateDefaultHistory(numMsrp, numPrice),
      recommendedFor: ['shared'],
      vibeTags: ['Custom Pick'],
      whyRecommended: note.trim() || 'Added directly to your saved Black Friday list.',
      buyAdvice:
        verdict === 'all-time-low'
          ? 'Matches your tracked all-time low price!'
          : 'Custom item — compare against your target price before checkout.',
      rating: 4.8,
      reviewCount: 'Custom',
      imageUrl: imageUrl.trim() || undefined,
      isCustom: true,
    };

    onAddCustomItem(newItem, shopperId, note.trim());
    setName('');
    setBrand('');
    setUrl('');
    setNote('');
    setImageUrl('');
    setFetchHint(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-panel modal-panel-sm modal-animate"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-custom-title"
      >
        <div className="modal-header">
          <h2 id="add-custom-title" className="modal-title-sm">
            Add Custom Deal or Fetch from URL
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
          <div className="field-group field-full">
            <span>Product Link (paste URL &amp; fetch info via backend)</span>
            <div className="url-fetch-row">
              <input
                type="url"
                placeholder="https://www.sephora.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn-select"
                onClick={handleFetchFromBackend}
                disabled={fetchingUrl || !url.trim()}
              >
                {fetchingUrl ? (
                  <>
                    <Loader2 size={14} className="spin" /> Fetching...
                  </>
                ) : (
                  <>
                    <Globe size={14} /> Fetch Info
                  </>
                )}
              </button>
            </div>
            {fetchHint && <small className="text-gold">{fetchHint}</small>}
          </div>

          <label className="field-group field-full">
            <span>Product Name *</span>
            <input
              type="text"
              required
              placeholder="e.g. Nike Air Max 90 or Caraway Skillet"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Brand</span>
            <input
              type="text"
              placeholder="e.g. Nike"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Store Name</span>
            <input
              type="text"
              placeholder="e.g. Sephora, Amazon, Nike"
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
            <span>Style / Gender</span>
            <select
              value={genderFocus}
              onChange={(e) => setGenderFocus(e.target.value as GenderFocus)}
            >
              <option value="unisex">Unisex / Home</option>
              <option value="women">Women&apos;s</option>
              <option value="men">Men&apos;s</option>
            </select>
          </label>

          <label className="field-group">
            <span>Save to List</span>
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
              <Plus size={15} /> Save &amp; Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
