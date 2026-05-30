export const state = {
  loading: true,
  blocks: [],
  products: [],
  selectedBlock: 'ALL',
  query: '',
};

export const listeners = new Set();
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const setState = (patch) => {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
};

export const filteredProducts = () => {
  const q = state.query.trim().toLowerCase();
  return state.products.filter((p) => {
    const matchBlock = state.selectedBlock === 'ALL' || p.block === state.selectedBlock;
    const haystack = `${p.name} ${p.code} ${p.block}`.toLowerCase();
    return matchBlock && (!q || haystack.includes(q));
  });
};
