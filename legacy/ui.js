import { filteredProducts, state } from './state.js';

const colorByBlock = (name) => state.blocks.find((b) => b.name === name)?.color || '#64748b';

export const renderSkeleton = (el) => {
  el.innerHTML = Array.from({ length: 6 }).map(() => '<div class="skeleton"></div>').join('');
};

export const renderBlocks = (el, onPick) => {
  const blocks = ['ALL', ...state.blocks.map((b) => b.name)];
  el.innerHTML = blocks.map((name) => `<button class="chip ${state.selectedBlock === name ? 'active' : ''}" data-block="${name}">${name}</button>`).join('');
  el.querySelectorAll('[data-block]').forEach((btn) => btn.onclick = () => onPick(btn.dataset.block));
};

export const renderProducts = (el) => {
  const rows = filteredProducts();
  if (!rows.length) {
    el.innerHTML = '<div class="empty">No products match your filters.</div>';
    return;
  }
  el.innerHTML = rows.map((p) => `
    <article class="card">
      <div class="topline">
        <div>
          <div class="name">${p.name}</div>
          <div class="code">${p.code}</div>
        </div>
        <span class="badge" style="background:${colorByBlock(p.block)};color:#020617">BLOCK ${p.block}</span>
      </div>
      <div class="meta">
        <div class="qty">${p.quantity} ${p.unit}</div>
        ${p.quantity <= 10 ? '<span class="badge low">Low Stock</span>' : ''}
      </div>
      <div class="location">📍 ${p.location_note || 'No location note'}</div>
    </article>`).join('');
};

export const fillSelectOptions = (els) => {
  const options = state.blocks.map((b) => `<option value="${b.name}">${b.name} · ${b.description}</option>`).join('');
  els.forEach((el) => el.innerHTML = options);
};
