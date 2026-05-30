import { uid } from "./utils.js";

const STORAGE_KEYS = {
  products: "jalyuzi.products.v3",
  sales: "jalyuzi.sales.v3",
  blocks: "jalyuzi.blocks.v3",
  role: "jalyuzi.role.v3",
  backendUrl: "jalyuzi.backendUrl.v2",
};

const demoBlocks = [
  {
    id: "A",
    name: "A",
    description: "Fast-selling products",
    priority: "high",
    color: "#2563EB",
    order: 1,
  },
  {
    id: "B",
    name: "B",
    description: "Medium demand products",
    priority: "medium",
    color: "#16A34A",
    order: 2,
  },
  {
    id: "C",
    name: "C",
    description: "Low demand / storage",
    priority: "low",
    color: "#F59E0B",
    order: 3,
  },
];

const demoProducts = [
  {
    id: "p-vert-204",
    name: "Vertikal jalyuzi",
    code: "VJ-204",
    category: "Jalyuzi",
    quantity: 320,
    unit: "metr",
    costPrice: 45000,
    sellPrice: 72000,
    minStock: 40,
    block: "A",
    locationNote: "Shelf A3, left row",
    note: "Ofis va uy uchun klassik model",
  },
  {
    id: "p-rulon-118",
    name: "Rulon parda Blackout",
    code: "RP-118",
    category: "Parda",
    quantity: 8,
    unit: "dona",
    costPrice: 180000,
    sellPrice: 260000,
    minStock: 12,
    block: "A",
    locationNote: "Shelf A1, top",
    note: "Yorug'likni to'liq to'sadi",
  },
  {
    id: "p-gorizontal-032",
    name: "Gorizontal alyumin",
    code: "GA-032",
    category: "Jalyuzi",
    quantity: 74,
    unit: "metr",
    costPrice: 38000,
    sellPrice: 61000,
    minStock: 20,
    block: "B",
    locationNote: "Shelf B2",
    note: "Yengil va chidamli",
  },
  {
    id: "p-zebra-071",
    name: "Zebra parda",
    code: "ZP-071",
    category: "Parda",
    quantity: 45,
    unit: "dona",
    costPrice: 145000,
    sellPrice: 220000,
    minStock: 10,
    block: "C",
    locationNote: "Back storage C4",
    note: "Premium mexanizm bilan",
  },
];

const now = Date.now();
const demoSales = [
  {
    id: "s-1",
    productId: "p-rulon-118",
    productName: "Rulon parda Blackout",
    code: "RP-118",
    quantity: 2,
    unit: "dona",
    revenue: 520000,
    profit: 160000,
    createdAt: new Date(now - 1000 * 60 * 44).toISOString(),
    seller: "Demo Admin",
  },
  {
    id: "s-2",
    productId: "p-vert-204",
    productName: "Vertikal jalyuzi",
    code: "VJ-204",
    quantity: 6,
    unit: "metr",
    revenue: 432000,
    profit: 162000,
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    seller: "Demo Admin",
  },
  {
    id: "s-3",
    productId: "p-zebra-071",
    productName: "Zebra parda",
    code: "ZP-071",
    quantity: 1,
    unit: "dona",
    revenue: 220000,
    profit: 75000,
    createdAt: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
    seller: "Demo Admin",
  },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sortBlocks(blocks) {
  return [...blocks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

function defaultBlockId(blocks) {
  return sortBlocks(blocks)[0]?.id || "A";
}

function normalizeBlock(block, index = 0) {
  const name = String(block.name || block.id || "A").trim().toUpperCase();
  return {
    id: String(block.id || name || uid("block")),
    name,
    description: block.description || "",
    priority: block.priority || "medium",
    color: block.color || "#2563EB",
    order: Number(block.order || index + 1),
  };
}

function normalizeProduct(product, blocks) {
  const fallbackBlock = defaultBlockId(blocks);
  const block = String(product.block || product.block_id || product.blockName || fallbackBlock)
    .trim()
    .toUpperCase();

  return {
    id: product.id || uid("product"),
    name: product.name,
    code: product.code,
    category: product.category || "Jalyuzi",
    quantity: Number(product.quantity || 0),
    unit: product.unit || "dona",
    costPrice: Number(product.costPrice || 0),
    sellPrice: Number(product.sellPrice || 0),
    minStock: Number(product.minStock || 0),
    block,
    locationNote: product.locationNote || product.location_note || product.location || "",
    note: product.note || "",
  };
}

const initialBlocks = sortBlocks(loadJSON(STORAGE_KEYS.blocks, demoBlocks).map(normalizeBlock));

let state = {
  route: "dashboard",
  user: {
    id: null,
    name: "Telegram foydalanuvchi",
    username: "",
  },
  role: localStorage.getItem(STORAGE_KEYS.role) || "admin",
  backendUrl: localStorage.getItem(STORAGE_KEYS.backendUrl) || "",
  apiStatus: "demo",
  lastSync: null,
  loading: false,
  blocks: initialBlocks,
  products: loadJSON(STORAGE_KEYS.products, demoProducts).map((product) =>
    normalizeProduct(product, initialBlocks)
  ),
  sales: loadJSON(STORAGE_KEYS.sales, demoSales),
  selectedProductId: null,
  filters: {
    search: "",
    stock: "all",
    unit: "all",
    sort: "name",
    block: "all",
  },
  salesRange: "week",
};

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener(getState()));
}

function persistInventory() {
  saveJSON(STORAGE_KEYS.blocks, state.blocks);
  saveJSON(STORAGE_KEYS.products, state.products);
}

export function getState() {
  return structuredClone(state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(patch) {
  state = { ...state, ...patch };
  emit();
}

export function setUser(user) {
  state = {
    ...state,
    user: {
      ...state.user,
      ...user,
      name: user.name || state.user.name,
    },
  };
  emit();
}

export function setRoute(route) {
  state = { ...state, route };
  emit();
}

export function setRole(role) {
  state = { ...state, role };
  localStorage.setItem(STORAGE_KEYS.role, role);
  emit();
}

export function setBackendUrl(url) {
  const cleanUrl = String(url || "").trim().replace(/\/+$/, "");
  state = { ...state, backendUrl: cleanUrl };
  localStorage.setItem(STORAGE_KEYS.backendUrl, cleanUrl);
  emit();
}

export function setFilters(filters) {
  state = { ...state, filters: { ...state.filters, ...filters } };
  emit();
}

export function setSalesRange(salesRange) {
  state = { ...state, salesRange };
  emit();
}

export function setProducts(products) {
  state = {
    ...state,
    products: products.map((product) => normalizeProduct(product, state.blocks)),
  };
  saveJSON(STORAGE_KEYS.products, state.products);
  emit();
}

export function setSales(sales) {
  state = { ...state, sales };
  saveJSON(STORAGE_KEYS.sales, state.sales);
  emit();
}

export function setBlocks(blocks) {
  const nextBlocks = sortBlocks(blocks.map(normalizeBlock));
  const fallbackBlock = defaultBlockId(nextBlocks);
  state = {
    ...state,
    blocks: nextBlocks,
    products: state.products.map((product) =>
      nextBlocks.some((block) => block.id === product.block)
        ? product
        : { ...product, block: fallbackBlock }
    ),
  };
  persistInventory();
  emit();
}

export function addProduct(product) {
  const nextProduct = normalizeProduct(
    {
      id: product.id || uid("product"),
      ...product,
    },
    state.blocks
  );
  state = { ...state, products: [nextProduct, ...state.products] };
  saveJSON(STORAGE_KEYS.products, state.products);
  emit();
  return nextProduct;
}

export function updateProduct(productId, patch) {
  state = {
    ...state,
    products: state.products.map((product) =>
      product.id === productId ? normalizeProduct({ ...product, ...patch }, state.blocks) : product
    ),
  };
  saveJSON(STORAGE_KEYS.products, state.products);
  emit();
}

export function selectProduct(productId) {
  state = { ...state, selectedProductId: productId, route: "sell" };
  emit();
}

export function addBlock(block) {
  const nextBlock = normalizeBlock(
    {
      id: String(block.name || block.id || uid("block")).trim().toUpperCase(),
      ...block,
      order: state.blocks.length + 1,
    },
    state.blocks.length
  );

  if (state.blocks.some((item) => item.id === nextBlock.id || item.name === nextBlock.name)) {
    throw new Error("Bu blok allaqachon mavjud");
  }

  state = { ...state, blocks: sortBlocks([...state.blocks, nextBlock]) };
  persistInventory();
  emit();
  return nextBlock;
}

export function updateBlock(blockId, patch) {
  state = {
    ...state,
    blocks: sortBlocks(
      state.blocks.map((block) =>
        block.id === blockId ? normalizeBlock({ ...block, ...patch, id: block.id }, block.order) : block
      )
    ),
  };
  saveJSON(STORAGE_KEYS.blocks, state.blocks);
  emit();
}

export function deleteBlock(blockId) {
  if (state.blocks.length <= 1) {
    throw new Error("Kamida bitta blok qolishi kerak");
  }

  const remainingBlocks = sortBlocks(state.blocks.filter((block) => block.id !== blockId)).map(
    (block, index) => ({ ...block, order: index + 1 })
  );
  const fallbackBlock = defaultBlockId(remainingBlocks);

  state = {
    ...state,
    blocks: remainingBlocks,
    products: state.products.map((product) =>
      product.block === blockId ? { ...product, block: fallbackBlock } : product
    ),
    filters: {
      ...state.filters,
      block: state.filters.block === blockId ? "all" : state.filters.block,
    },
  };
  persistInventory();
  emit();
}

export function reorderBlock(blockId, direction) {
  const blocks = sortBlocks(state.blocks);
  const index = blocks.findIndex((block) => block.id === blockId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= blocks.length) {
    return;
  }

  const nextBlocks = [...blocks];
  [nextBlocks[index], nextBlocks[targetIndex]] = [nextBlocks[targetIndex], nextBlocks[index]];
  state = {
    ...state,
    blocks: nextBlocks.map((block, nextIndex) => ({ ...block, order: nextIndex + 1 })),
  };
  saveJSON(STORAGE_KEYS.blocks, state.blocks);
  emit();
}

export function moveProductToBlock(productId, blockId, locationNote = "") {
  if (!state.blocks.some((block) => block.id === blockId)) {
    throw new Error("Blok topilmadi");
  }

  state = {
    ...state,
    products: state.products.map((product) =>
      product.id === productId
        ? {
            ...product,
            block: blockId,
            locationNote: locationNote || product.locationNote,
          }
        : product
    ),
  };
  saveJSON(STORAGE_KEYS.products, state.products);
  emit();
}

export function bulkMoveProducts(fromBlockId, toBlockId) {
  if (fromBlockId === toBlockId) {
    throw new Error("Boshqa blok tanlang");
  }
  if (!state.blocks.some((block) => block.id === toBlockId)) {
    throw new Error("Yangi blok topilmadi");
  }

  let moved = 0;
  state = {
    ...state,
    products: state.products.map((product) => {
      if (fromBlockId !== "all" && product.block !== fromBlockId) {
        return product;
      }
      moved += 1;
      return { ...product, block: toBlockId };
    }),
  };
  saveJSON(STORAGE_KEYS.products, state.products);
  emit();
  return moved;
}

export function recordSale(productId, quantity, sellerName) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    throw new Error("Mahsulot topilmadi");
  }

  const amount = Number(quantity);
  if (!amount || amount <= 0) {
    throw new Error("Miqdor noto'g'ri");
  }

  if (amount > Number(product.quantity)) {
    throw new Error("Omborda yetarli mahsulot yo'q");
  }

  const nextProduct = {
    ...product,
    quantity: Number(product.quantity) - amount,
  };
  const sale = {
    id: uid("sale"),
    productId: product.id,
    productName: product.name,
    code: product.code,
    quantity: amount,
    unit: product.unit,
    revenue: amount * Number(product.sellPrice || 0),
    profit: amount * (Number(product.sellPrice || 0) - Number(product.costPrice || 0)),
    createdAt: new Date().toISOString(),
    seller: sellerName || state.user.name,
  };

  state = {
    ...state,
    products: state.products.map((item) => (item.id === productId ? nextProduct : item)),
    sales: [sale, ...state.sales],
  };
  saveJSON(STORAGE_KEYS.products, state.products);
  saveJSON(STORAGE_KEYS.sales, state.sales);
  emit();
  return sale;
}

export function resetDemoData() {
  state = {
    ...state,
    blocks: demoBlocks,
    products: demoProducts,
    sales: demoSales,
    filters: { search: "", stock: "all", unit: "all", sort: "name", block: "all" },
    salesRange: "week",
  };
  persistInventory();
  saveJSON(STORAGE_KEYS.sales, state.sales);
  emit();
}

export function clearSales() {
  state = { ...state, sales: [] };
  saveJSON(STORAGE_KEYS.sales, state.sales);
  emit();
}
