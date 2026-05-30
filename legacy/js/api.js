import { uid } from "./utils.js";

function activeBackend(baseUrl) {
  return Boolean(baseUrl && !baseUrl.includes("YOUR-RAILWAY-URL"));
}

function endpoint(baseUrl, path) {
  const cleanBase = String(baseUrl || "").replace(/\/+$/, "");
  if (!path || path === "/") {
    return `${cleanBase}/`;
  }
  return `${cleanBase}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(endpoint(baseUrl, path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.initData ? { "X-Telegram-Init-Data": options.initData } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === "object" ? data.error || data.message : data;
    throw new Error(message || `API xatosi: ${response.status}`);
  }

  return data;
}

function pickArray(payload, keys) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

export function normalizeBlock(raw, index = 0) {
  const name = String(raw.name ?? raw.title ?? raw.id ?? "A").trim().toUpperCase();
  return {
    id: String(raw.id ?? raw.block_id ?? name),
    name,
    description: raw.description ?? raw.purpose ?? "",
    priority: raw.priority ?? "medium",
    color: raw.color ?? raw.hex ?? "#2563EB",
    order: Number(raw.order ?? raw.sort_order ?? index + 1),
  };
}

export function normalizeProduct(raw) {
  const block = String(raw.block ?? raw.block_id ?? raw.blockName ?? raw.block_name ?? "A")
    .trim()
    .toUpperCase();

  return {
    id: String(raw.id ?? raw.product_id ?? raw.code ?? uid("product")),
    name: raw.name ?? raw.title ?? raw.product_name ?? "Nomsiz mahsulot",
    code: raw.code ?? raw.sku ?? raw.artikul ?? "NO-CODE",
    category: raw.category ?? raw.type ?? "Jalyuzi",
    quantity: Number(raw.quantity ?? raw.qty ?? raw.count ?? 0),
    unit: raw.unit ?? raw.measure ?? "dona",
    costPrice: Number(raw.costPrice ?? raw.cost_price ?? raw.cost ?? raw.buy_price ?? 0),
    sellPrice: Number(raw.sellPrice ?? raw.sell_price ?? raw.price ?? raw.sale_price ?? 0),
    minStock: Number(raw.minStock ?? raw.min_stock ?? raw.low_stock ?? 5),
    block,
    locationNote: raw.locationNote ?? raw.location_note ?? raw.location ?? "",
    note: raw.note ?? raw.description ?? "",
  };
}

export function normalizeSale(raw) {
  return {
    id: String(raw.id ?? raw.sale_id ?? uid("sale")),
    productId: String(raw.productId ?? raw.product_id ?? raw.id_product ?? ""),
    productName: raw.productName ?? raw.product_name ?? raw.name ?? "Mahsulot",
    code: raw.code ?? raw.sku ?? "",
    quantity: Number(raw.quantity ?? raw.qty ?? 0),
    unit: raw.unit ?? "dona",
    revenue: Number(raw.revenue ?? raw.total ?? raw.amount ?? 0),
    profit: Number(raw.profit ?? raw.foyda ?? 0),
    createdAt: raw.createdAt ?? raw.created_at ?? raw.date ?? new Date().toISOString(),
    seller: raw.seller ?? raw.user ?? "",
  };
}

export async function fetchProducts(baseUrl, initData) {
  if (!activeBackend(baseUrl)) {
    return null;
  }
  const payload = await request(baseUrl, "/", { method: "GET", initData });
  return pickArray(payload, ["products", "data", "items"]).map(normalizeProduct);
}

export async function fetchBlocks(baseUrl, initData) {
  if (!activeBackend(baseUrl)) {
    return null;
  }
  const payload = await request(baseUrl, "/blocks", { method: "GET", initData });
  return pickArray(payload, ["blocks", "data", "items"]).map(normalizeBlock);
}

export async function fetchSales(baseUrl, initData) {
  if (!activeBackend(baseUrl)) {
    return null;
  }
  const payload = await request(baseUrl, "/sales", { method: "GET", initData });
  return pickArray(payload, ["sales", "data", "transactions"]).map(normalizeSale);
}

export async function createProduct(baseUrl, product, initData) {
  if (!activeBackend(baseUrl)) {
    return normalizeProduct(product);
  }
  const payload = await request(baseUrl, "/add", {
    method: "POST",
    initData,
    body: JSON.stringify({
      ...product,
      block: product.block,
      location_note: product.locationNote,
    }),
  });
  return normalizeProduct(payload.product || payload.data || payload);
}

export async function sellProduct(baseUrl, productId, quantity, initData) {
  if (!activeBackend(baseUrl)) {
    return null;
  }
  const payload = await request(baseUrl, `/sell/${encodeURIComponent(productId)}`, {
    method: "POST",
    initData,
    body: JSON.stringify({ quantity }),
  });
  return normalizeSale(payload.sale || payload.data || payload);
}

export async function createBlock(baseUrl, block, initData) {
  if (!activeBackend(baseUrl)) {
    return normalizeBlock(block);
  }
  const payload = await request(baseUrl, "/blocks", {
    method: "POST",
    initData,
    body: JSON.stringify(block),
  });
  return normalizeBlock(payload.block || payload.data || payload);
}

export async function updateBlock(baseUrl, blockId, block, initData) {
  if (!activeBackend(baseUrl)) {
    return normalizeBlock({ ...block, id: blockId });
  }
  const payload = await request(baseUrl, `/blocks/${encodeURIComponent(blockId)}`, {
    method: "PUT",
    initData,
    body: JSON.stringify(block),
  });
  return normalizeBlock(payload.block || payload.data || payload);
}

export async function deleteBlock(baseUrl, blockId, initData) {
  if (!activeBackend(baseUrl)) {
    return true;
  }
  await request(baseUrl, `/blocks/${encodeURIComponent(blockId)}`, {
    method: "DELETE",
    initData,
  });
  return true;
}
