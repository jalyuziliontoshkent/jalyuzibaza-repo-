'use client';

import React, { useState } from 'react';
import { useStore, UIProduct, UIBlock } from '@/lib/StoreProvider';
import {
  LayoutDashboard, Boxes, Map, Plus, ChartNoAxesCombined,
  RefreshCw, Settings2, X, Search, Package, TrendingUp,
  Trash2, Edit2, Check, AlertTriangle, ChevronDown
} from 'lucide-react';

// ─── Small helpers ────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  yuqori: '#ef4444',
  o_rta: '#f59e0b',
  past: '#22c55e',
};

const BLOCK_COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#ef4444', '#22c55e', '#3b82f6',
];

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999,
      background: color + '22', color, fontSize: 12, fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

// ─── SELL MODAL ───────────────────────────────────────────────────────────────

function SellModal({ product, onClose }: { product: UIProduct; onClose: () => void }) {
  const { recordSale, state } = useStore();
  const [qty, setQty] = useState(1);
  const [seller, setSeller] = useState(state.user.name);
  const [loading, setLoading] = useState(false);

  const handleSell = async () => {
    if (!seller.trim()) return;
    setLoading(true);
    try {
      await recordSale(product._id, qty, seller.trim());
      onClose();
    } catch { setLoading(false); }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="modal-header">
          <div>
            <p className="muted">Sotish</p>
            <h2>{product.name}</h2>
            <p className="muted" style={{ fontSize: 12 }}>Omborda: <strong>{product.quantity} {product.unit}</strong></p>
          </div>
          <button className="icon-button" onClick={onClose}><X /></button>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Sotuvchi ismi</label>
            <input value={seller} onChange={e => setSeller(e.target.value)} placeholder="Ism familiya" />
          </div>
          <div className="field">
            <label>Miqdor ({product.unit})</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="ghost-button" style={{ padding: '6px 14px' }} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <input type="number" min="1" max={product.quantity} value={qty} onChange={e => setQty(Number(e.target.value))} style={{ textAlign: 'center', flex: 1 }} />
              <button className="ghost-button" style={{ padding: '6px 14px' }} onClick={() => setQty(q => Math.min(product.quantity, q + 1))}>+</button>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 8 }}>
            <button className="ghost-button" onClick={onClose}>Bekor</button>
            <button className="primary-button" onClick={handleSell} disabled={loading || qty < 1 || qty > product.quantity}>
              {loading ? 'Saqlanmoqda...' : 'Tasdiqlash'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── ADD / EDIT PRODUCT MODAL ────────────────────────────────────────────────

function ProductModal({ product, onClose }: { product?: UIProduct; onClose: () => void }) {
  const { addProduct, editProduct, state } = useStore();
  const [form, setForm] = useState({
    name: product?.name ?? '',
    code: product?.code ?? '',
    quantity: product?.quantity ?? 0,
    unit: product?.unit ?? 'dona',
    block: product?.block ?? (state.blocks[0]?.name ?? ''),
    price: product?.price ?? 0,
    location_note: product?.location_note ?? '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.block) return;
    setLoading(true);
    try {
      if (product) {
        await editProduct(product._id, { ...form, quantity: Number(form.quantity), price: Number(form.price) });
      } else {
        await addProduct({ ...form, quantity: Number(form.quantity), price: Number(form.price) });
      }
      onClose();
    } catch { setLoading(false); }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <p className="muted">{product ? 'Tahrirlash' : 'Yangi mahsulot'}</p>
            <h2>{product ? product.name : 'Mahsulot qo\'shish'}</h2>
          </div>
          <button className="icon-button" onClick={onClose}><X /></button>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Nomi *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Masalan: JLZ-200 Gorizontal" />
          </div>
          <div className="amount-grid">
            <div className="field">
              <label>Kodi *</label>
              <input value={form.code} onChange={e => set('code', e.target.value)} placeholder="K-123" />
            </div>
            <div className="field">
              <label>Blok *</label>
              <select value={form.block} onChange={e => set('block', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}>
                {state.blocks.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="amount-grid">
            <div className="field">
              <label>Miqdori *</label>
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
            </div>
            <div className="field">
              <label>O'lchov *</label>
              <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="dona, kg, m" />
            </div>
          </div>
          <div className="amount-grid">
            <div className="field">
              <label>Narxi (so'm)</label>
              <input type="number" min="0" value={form.price} onChange={e => set('price', Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Joylashuv eslatmasi</label>
              <input value={form.location_note} onChange={e => set('location_note', e.target.value)} placeholder="Masalan: 3-qator, 2-javon" />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 8 }}>
            <button className="ghost-button" onClick={onClose}>Bekor</button>
            <button className="primary-button" onClick={handleSubmit} disabled={loading || !form.name || !form.code || !form.block}>
              {loading ? 'Saqlanmoqda...' : product ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── ADD / EDIT BLOCK MODAL ───────────────────────────────────────────────────

function BlockModal({ block, onClose }: { block?: UIBlock; onClose: () => void }) {
  const { addBlock, editBlock } = useStore();
  const [form, setForm] = useState({
    name: block?.name ?? '',
    description: block?.description ?? '',
    priority: block?.priority ?? 'o_rta',
    color: block?.color ?? '#6366f1',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      if (block) {
        await editBlock(block._id, form);
      } else {
        await addBlock(form);
      }
      onClose();
    } catch { setLoading(false); }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="modal-header">
          <div>
            <p className="muted">{block ? 'Blokni tahrirlash' : 'Yangi blok'}</p>
            <h2>{block ? block.name : 'Blok qo\'shish'}</h2>
          </div>
          <button className="icon-button" onClick={onClose}><X /></button>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Blok nomi *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Masalan: A-Blok" />
          </div>
          <div className="field">
            <label>Tavsif</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Qisqacha tavsif" />
          </div>
          <div className="field">
            <label>Muhimlik darajasi</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' }}>
              <option value="yuqori">🔴 Yuqori</option>
              <option value="o_rta">🟡 O'rta</option>
              <option value="past">🟢 Past</option>
            </select>
          </div>
          <div className="field">
            <label>Rang</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {BLOCK_COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', cursor: 'pointer' }}>
                  {form.color === c && <Check size={14} color="white" style={{ margin: 'auto', display: 'block', marginTop: 5 }} />}
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 8 }}>
            <button className="ghost-button" onClick={onClose}>Bekor</button>
            <button className="primary-button" onClick={handleSubmit} disabled={loading || !form.name.trim()}>
              {loading ? 'Saqlanmoqda...' : block ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── CONFIRM DELETE MODAL ─────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card" style={{ textAlign: 'center' }}>
        <AlertTriangle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ marginBottom: 8 }}>Tasdiqlash</h3>
        <p className="muted" style={{ marginBottom: 24 }}>{message}</p>
        <div className="form-actions">
          <button className="ghost-button" onClick={onCancel}>Bekor</button>
          <button className="primary-button" style={{ background: '#ef4444' }} onClick={onConfirm}>O'chirish</button>
        </div>
      </section>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Home() {
  const { state, setQuery, setSelectedBlock, setRole, refresh, removeBlock, removeProduct, clearSales } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sellTarget, setSellTarget] = useState<UIProduct | null>(null);
  const [editProduct, setEditProduct] = useState<UIProduct | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editBlockTarget, setEditBlockTarget] = useState<UIBlock | null>(null);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const { blocks, products, sales, role, user, toast, loading, selectedBlock, query } = state;

  const filteredProducts = products.filter(p => {
    const q = query.trim().toLowerCase();
    const matchBlock = selectedBlock === 'ALL' || p.block === selectedBlock;
    const hay = `${p.name} ${p.code} ${p.block} ${p.location_note}`.toLowerCase();
    return matchBlock && (!q || hay.includes(q));
  });

  const totalQty = products.reduce((s, p) => s + p.quantity, 0);
  const totalInventoryValue = products.reduce((s, p) => s + p.quantity * (p.price ?? 0), 0);
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());

  const tabLabel: Record<string, string> = {
    dashboard: 'Bosh sahifa', products: 'Mahsulotlar',
    blocks: 'Bloklar', add: 'Qo\'shish', reports: 'Hisobot',
  };

  return (
    <>
      <main className="app-shell">
        {/* HEADER */}
        <header className="app-header">
          <button className="icon-button" onClick={refresh} aria-label="Yangilash">
            <RefreshCw size={20} className={loading ? 'spin' : ''} />
          </button>
          <div className="brand-block">
            <span className="brand-mark">J</span>
            <div>
              <p>Jalyuzi ERP</p>
              <h1>{tabLabel[activeTab]}</h1>
            </div>
          </div>
          <button className="icon-button" onClick={() => setRole(role === 'admin' ? 'seller' : 'admin')} aria-label="Rol almashtirish">
            <Settings2 size={20} />
          </button>
        </header>

        {/* USER PANEL */}
        <section className="user-panel">
          <div>
            <p className="muted">Xush kelibsiz</p>
            <strong>{user.name}</strong>
          </div>
          <button className="role-pill" onClick={() => setRole(role === 'admin' ? 'seller' : 'admin')}>
            {role === 'admin' ? '👑 Admin' : '🛒 Sotuvchi'}
          </button>
        </section>

        {/* STATUS STRIP */}
        <section className={`sync-strip ${loading ? 'loading' : 'online'}`}>
          <span />
          <p>{loading ? 'Yuklanmoqda...' : '● Online — MongoDB'}</p>
        </section>

        {/* ── DASHBOARD ─────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <section className="view active animate-fade-in">
            <div className="hero-card">
              <div className="hero-content">
                <h2>Ombor holati</h2>
                <p>Real vaqtda ma'lumotlar</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => setActiveTab('products')}>Omborga kirish</button>
                  <button className="secondary-button" onClick={() => setActiveTab('reports')}>Hisobotlar</button>
                </div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <p className="muted">Jami mahsulot turi</p>
                <strong>{products.length}</strong>
                <span className="trend"><TrendingUp size={13} /> Faol</span>
              </div>
              <div className="stat-card">
                <p className="muted">Umumiy miqdor</p>
                <strong>{totalQty.toLocaleString()}</strong>
              </div>
              <div className="stat-card">
                <p className="muted">Umumiy inventar qiymati</p>
                <strong>{totalInventoryValue.toLocaleString()} so'm</strong>
              </div>
              <div className="stat-card">
                <p className="muted">Bloklar</p>
                <strong>{blocks.length} ta</strong>
              </div>
              <div className="stat-card">
                <p className="muted">Bugungi sotuvlar</p>
                <strong>{todaySales.length} ta</strong>
              </div>
            </div>

            {(lowStockCount > 0 || outOfStockCount > 0) && (
              <div className="panel" style={{ borderLeft: '4px solid #ef4444', background: '#ef444411' }}>
                <p style={{ fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>⚠️ Diqqat!</p>
                {outOfStockCount > 0 && <p className="muted">{outOfStockCount} ta mahsulot tugagan</p>}
                {lowStockCount > 0 && <p className="muted">{lowStockCount} ta mahsulot kam qolgan (&lt;10)</p>}
              </div>
            )}
          </section>
        )}

        {/* ── PRODUCTS ──────────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <section className="view active animate-fade-in">
            <div className="panel">
              <div className="input-inner" style={{ marginBottom: 12 }}>
                <Search size={18} />
                <input placeholder="Nomi, kodi yoki blok..." value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              <div className="chip-row">
                <button className={`chip ${selectedBlock === 'ALL' ? 'active' : ''}`} onClick={() => setSelectedBlock('ALL')}>Barchasi</button>
                {blocks.map(b => (
                  <button key={b._id} className={`chip ${selectedBlock === b.name ? 'active' : ''}`} onClick={() => setSelectedBlock(b.name)}>
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {role === 'admin' && (
              <button className="primary-button" style={{ margin: '0 0 12px', width: '100%' }} onClick={() => setAddProductOpen(true)}>
                <Plus size={16} /> Yangi mahsulot qo'shish
              </button>
            )}

            <div className="product-list">
              {filteredProducts.length === 0 ? (
                <div className="empty-state">Mahsulot topilmadi</div>
              ) : filteredProducts.map(p => (
                <div key={p._id} className={`product-card ${p.quantity === 0 ? 'out' : p.quantity < 10 ? 'low' : ''}`}>
                  <div style={{ flex: 1 }}>
                    <div className="product-title-row">
                      <h3>{p.name}</h3>
                    </div>
                    <p className="product-subtitle">Kod: {p.code} • Narxi: {(p.price ?? 0).toLocaleString()} so'm</p>
                    <div className="badge-row">
                      <span className="badge neutral"><Package size={12} /> {p.block}</span>
                      {p.location_note && <span className="badge neutral" style={{ fontSize: 11 }}>{p.location_note}</span>}
                    </div>
                  </div>
                  <div className="product-side">
                    <div className="qty">
                      <strong style={{ color: p.quantity === 0 ? '#ef4444' : p.quantity < 10 ? '#f59e0b' : 'var(--primary)' }}>
                        {p.quantity}
                      </strong>
                      <span>{p.unit}</span>
                    </div>
                    <button className="product-action" onClick={() => setSellTarget(p)}>Sotish</button>
                    {role === 'admin' && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button className="icon-button" style={{ padding: 6 }} onClick={() => setEditProduct(p)}><Edit2 size={14} /></button>
                        <button className="icon-button" style={{ padding: 6, color: '#ef4444' }} onClick={() => setConfirmDelete({ message: `"${p.name}" mahsulotini o'chirasizmi?`, onConfirm: () => { removeProduct(p._id); setConfirmDelete(null); } })}><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── BLOCKS ────────────────────────────────────────────────── */}
        {activeTab === 'blocks' && (
          <section className="view active animate-fade-in">
            {role === 'admin' && (
              <button className="primary-button" style={{ width: '100%', marginBottom: 12 }} onClick={() => setAddBlockOpen(true)}>
                <Plus size={16} /> Yangi blok qo'shish
              </button>
            )}
            {blocks.length === 0 ? (
              <div className="empty-state">Hali blok qo'shilmagan</div>
            ) : blocks.map(b => {
              const count = products.filter(p => p.block === b.name).length;
              const totalStock = products.filter(p => p.block === b.name).reduce((s, p) => s + p.quantity, 0);
              return (
                <div key={b._id} className="panel" style={{ borderLeft: `4px solid ${b.color}`, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: b.color, display: 'inline-block' }} />
                        <strong>{b.name}</strong>
                        <Badge color={PRIORITY_COLORS[b.priority] ?? '#6366f1'}>
                          {b.priority === 'yuqori' ? 'Yuqori' : b.priority === 'o_rta' ? "O'rta" : 'Past'}
                        </Badge>
                      </div>
                      {b.description && <p className="muted" style={{ fontSize: 13 }}>{b.description}</p>}
                      <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{count} tur mahsulot • {totalStock} dona jami</p>
                    </div>
                    {role === 'admin' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-button" onClick={() => setEditBlockTarget(b)}><Edit2 size={15} /></button>
                        <button className="icon-button" style={{ color: '#ef4444' }} onClick={() => setConfirmDelete({ message: `"${b.name}" blokini va uning ${count} ta mahsulotini o'chirasizmi?`, onConfirm: () => { removeBlock(b._id); setConfirmDelete(null); } })}><Trash2 size={15} /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── ADD (quick add tab) ────────────────────────────────────── */}
        {activeTab === 'add' && (
          <section className="view active animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="primary-button" style={{ width: '100%', padding: '16px' }} onClick={() => { setAddProductOpen(true); }}>
                <Package size={18} /> Mahsulot qo'shish
              </button>
              {role === 'admin' && (
                <button className="secondary-button" style={{ width: '100%', padding: '16px' }} onClick={() => { setAddBlockOpen(true); }}>
                  <Map size={18} /> Blok qo'shish
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── REPORTS ───────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <section className="view active animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2>Sotuvlar tarixi</h2>
              {role === 'admin' && sales.length > 0 && (
                <button className="ghost-button" style={{ color: '#ef4444', fontSize: 13 }} onClick={() => setConfirmDelete({ message: 'Barcha sotuvlarni o\'chirasizmi?', onConfirm: () => { clearSales(); setConfirmDelete(null); } })}>
                  <Trash2 size={14} /> Tozalash
                </button>
              )}
            </div>

            {sales.length === 0 ? (
              <div className="empty-state">Hali sotuvlar yo'q</div>
            ) : (
              <>
                <div className="panel" style={{ marginBottom: 12, display: 'flex', gap: 16 }}>
                  <div>
                    <p className="muted" style={{ fontSize: 12 }}>Jami sotuvlar</p>
                    <strong>{sales.length} ta</strong>
                  </div>
                  <div>
                    <p className="muted" style={{ fontSize: 12 }}>Bugun</p>
                    <strong>{todaySales.length} ta</strong>
                  </div>
                </div>
                {sales.map(s => (
                  <div key={s._id} className="panel" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{s.productName}</strong>
                      <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {s.sellerName} • {new Date(s.date).toLocaleDateString('uz-UZ')} {new Date(s.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#22c55e' }}>−{s.quantity}</strong>
                      <p className="muted" style={{ fontSize: 11 }}>{s.unit}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>
        )}

        {/* BOTTOM NAV */}
        <nav className="bottom-nav" aria-label="Asosiy navigatsiya">
          {[
            { key: 'dashboard', icon: <LayoutDashboard />, label: 'Home' },
            { key: 'products', icon: <Boxes />, label: 'Ombor' },
            { key: 'blocks', icon: <Map />, label: 'Bloklar' },
            { key: 'add', icon: <Plus />, label: "Qo'shish", fab: true },
            { key: 'reports', icon: <ChartNoAxesCombined />, label: 'Hisobot' },
          ].map(item => (
            <button key={item.key} className={`nav-item${item.fab ? ' nav-add' : ''} ${activeTab === item.key ? 'active' : ''}`} onClick={() => setActiveTab(item.key)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* MODALS */}
      {sellTarget && <SellModal product={sellTarget} onClose={() => setSellTarget(null)} />}
      {addProductOpen && <ProductModal onClose={() => setAddProductOpen(false)} />}
      {editProduct && <ProductModal product={editProduct} onClose={() => setEditProduct(null)} />}
      {addBlockOpen && <BlockModal onClose={() => setAddBlockOpen(false)} />}
      {editBlockTarget && <BlockModal block={editBlockTarget} onClose={() => setEditBlockTarget(null)} />}
      {confirmDelete && <ConfirmModal message={confirmDelete.message} onConfirm={confirmDelete.onConfirm} onCancel={() => setConfirmDelete(null)} />}

      {/* TOAST */}
      {toast.title && (
        <div className="toast-stack">
          <div className={`toast ${toast.type}`}>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .modal-backdrop { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:200; }
        .modal-card { background:var(--card);border-radius:24px;padding:24px;width:92%;max-width:420px;box-shadow:var(--shadow-md); }
        .modal-header { display:flex;justify-content:space-between;align-items:flex-start; }
        .toast-stack { position:fixed;bottom:88px;left:50%;transform:translateX(-50%);z-index:300;width:92%;max-width:420px; }
        .toast { background:var(--card);border-radius:16px;padding:14px 16px;box-shadow:var(--shadow-md);border-left:4px solid var(--primary); }
        .toast.success { border-color:#22c55e; }
        .toast.error { border-color:#ef4444; }
        .toast strong { display:block;font-size:14px;margin-bottom:2px; }
        .toast p { margin:0;font-size:13px;color:var(--text-secondary); }
        .animate-fade-in { animation:viewIn 0.22s ease; }
        .form-actions { display:flex;gap:10px;justify-content:flex-end; }
        .empty-state { text-align:center;padding:40px 20px;color:var(--text-secondary); }
      ` }} />
    </>
  );
}
