const CACHE_KEY = 'jalyuzi-cache-v1';

const seed = {
  blocks: [
    { id: crypto.randomUUID(), name: 'A', description: 'Fast-selling products', priority: 'high', color: '#22c55e' },
    { id: crypto.randomUUID(), name: 'B', description: 'Medium demand products', priority: 'medium', color: '#38bdf8' },
    { id: crypto.randomUUID(), name: 'C', description: 'Low demand / storage', priority: 'low', color: '#a78bfa' }
  ],
  products: [
    { id: crypto.randomUUID(), name: 'Cooking Oil', code: 'FO-103', quantity: 5, unit: 'pcs', block: 'A', location_note: 'Shelf A3' },
    { id: crypto.randomUUID(), name: 'Sugar 1kg', code: 'FO-211', quantity: 40, unit: 'bags', block: 'B', location_note: 'Shelf B1' },
    { id: crypto.randomUUID(), name: 'Detergent', code: 'CL-010', quantity: 9, unit: 'pcs', block: 'C', location_note: 'Rack C2' }
  ]
};

const read = () => JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') || seed;
const write = (data) => localStorage.setItem(CACHE_KEY, JSON.stringify(data));

export const getProducts = async () => read().products;
export const getBlocks = async () => read().blocks;
export const postBlock = async (payload) => {
  const db = read();
  db.blocks.push({ id: crypto.randomUUID(), ...payload });
  write(db);
};
export const putBlock = async (id, payload) => {
  const db = read();
  db.blocks = db.blocks.map((b) => (b.id === id ? { ...b, ...payload } : b));
  write(db);
};
export const deleteBlock = async (id) => {
  const db = read();
  const name = db.blocks.find((b) => b.id === id)?.name;
  db.blocks = db.blocks.filter((b) => b.id !== id);
  db.products = db.products.filter((p) => p.block !== name);
  write(db);
};
export const postProduct = async (payload) => {
  const db = read();
  db.products.unshift({ id: crypto.randomUUID(), ...payload, quantity: Number(payload.quantity) });
  write(db);
};
export const bulkMoveProducts = async (from, to) => {
  const db = read();
  db.products = db.products.map((p) => (p.block === from ? { ...p, block: to } : p));
  write(db);
};
