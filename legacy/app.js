import { bulkMoveProducts, getBlocks, getProducts, postBlock, postProduct } from './api.js';
import { fillSelectOptions, renderBlocks, renderProducts, renderSkeleton } from './ui.js';
import { setState, state, subscribe } from './state.js';

const dom = {
  list: document.getElementById('productList'),
  nav: document.getElementById('blockNav'),
  search: document.getElementById('searchInput'),
  adminBtn: document.getElementById('adminBtn'),
  admin: document.getElementById('adminPanel'),
  closeAdmin: document.getElementById('closeAdmin'),
  blockForm: document.getElementById('blockForm'),
  productForm: document.getElementById('productForm'),
  bulkForm: document.getElementById('bulkForm'),
  selects: [document.getElementById('productBlock'), document.getElementById('bulkFrom'), document.getElementById('bulkTo')]
};

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const refresh = async () => {
  const [blocks, products] = await Promise.all([getBlocks(), getProducts()]);
  setState({ blocks, products, loading: false });
};

subscribe(() => {
  renderBlocks(dom.nav, (selectedBlock) => setState({ selectedBlock }));
  fillSelectOptions(dom.selects);
  renderProducts(dom.list);
});

renderSkeleton(dom.list);
await refresh();

dom.search.addEventListener('input', debounce((e) => setState({ query: e.target.value }), 300));
dom.adminBtn.onclick = () => dom.admin.classList.add('open');
dom.closeAdmin.onclick = () => dom.admin.classList.remove('open');

dom.blockForm.onsubmit = async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  await postBlock(Object.fromEntries(form.entries()));
  e.target.reset();
  await refresh();
};

dom.productForm.onsubmit = async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  await postProduct(Object.fromEntries(form.entries()));
  e.target.reset();
  await refresh();
};

dom.bulkForm.onsubmit = async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const from = form.get('from');
  const to = form.get('to');
  if (!from || !to || from === to) return;
  await bulkMoveProducts(from, to);
  await refresh();
};
