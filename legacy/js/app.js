import {
  addBlock as addLocalBlock,
  addProduct as addLocalProduct,
  bulkMoveProducts as bulkMoveLocalProducts,
  clearSales,
  deleteBlock as deleteLocalBlock,
  getState,
  moveProductToBlock,
  recordSale,
  reorderBlock,
  resetDemoData,
  selectProduct,
  setBackendUrl,
  setBlocks,
  setFilters,
  setProducts,
  setRole,
  setRoute,
  setSales,
  setSalesRange,
  setState,
  setUser,
  subscribe,
  updateBlock as updateLocalBlock,
} from "./state.js";
import {
  createBlock as apiCreateBlock,
  createProduct,
  deleteBlock as apiDeleteBlock,
  fetchBlocks,
  fetchProducts,
  fetchSales,
  sellProduct as apiSellProduct,
  updateBlock as apiUpdateBlock,
} from "./api.js";
import {
  configureMainButton,
  getInitData,
  haptic,
  initTelegram,
  setMainButtonLoading,
} from "./telegram.js";
import { hideModal, mountUI, render, setBusy, showToast } from "./ui.js";

const telegram = initTelegram();

if (telegram.user) {
  setUser(telegram.user);
}

mountUI({
  navigate,
  refresh: refreshData,
  toggleRole,
  setFilters,
  setSalesRange,
  selectProduct: (productId) => {
    haptic("light");
    selectProduct(productId);
    hideModal();
  },
  addProduct,
  sellProduct,
  saveBackendUrl,
  addBlock,
  updateBlock,
  deleteBlock,
  reorderBlock: (blockId, direction) => {
    reorderBlock(blockId, direction);
    haptic("light");
  },
  moveProductBlock: (productId, blockId, locationNote) => {
    moveProductToBlock(productId, blockId, locationNote);
    showToast("Joylashuv yangilandi", "Mahsulot yangi blokka o'tkazildi.", "success");
    haptic("success");
  },
  bulkMoveProducts: (fromBlockId, toBlockId) => {
    try {
      const moved = bulkMoveLocalProducts(fromBlockId, toBlockId);
      showToast("Bulk move tayyor", `${moved} ta mahsulot ko'chirildi.`, "success");
      haptic("success");
    } catch (error) {
      showToast("Bulk move xatosi", error.message, "error");
      haptic("error");
    }
  },
  resetDemoData: () => {
    resetDemoData();
    showToast("Demo tiklandi", "Bloklar, mahsulotlar va sotuvlar qayta yuklandi.", "success");
    haptic("success");
  },
  clearSales: () => {
    clearSales();
    showToast("Hisobot tozalandi", "Local sotuvlar o'chirildi.", "success");
    haptic("success");
  },
  copyText,
});

subscribe((state) => {
  render(state);
  configureTelegramMainButton(state);
});

render(getState());
configureTelegramMainButton(getState());
refreshData({ silent: true });

async function refreshData(options = {}) {
  const state = getState();
  const initData = getInitData();

  if (!state.backendUrl) {
    setState({ apiStatus: "demo", lastSync: new Date().toISOString() });
    if (!options.silent) {
      showToast("Demo rejim", "Backend URL sozlamadan kiritilmagan.", "info");
    }
    return;
  }

  try {
    setBusy(!options.silent);
    setMainButtonLoading(true);
    const [blocks, products, sales] = await Promise.all([
      fetchBlocks(state.backendUrl, initData),
      fetchProducts(state.backendUrl, initData),
      fetchSales(state.backendUrl, initData),
    ]);

    if (blocks) {
      setBlocks(blocks);
    }
    if (products) {
      setProducts(products);
    }
    if (sales) {
      setSales(sales);
    }
    setState({ apiStatus: "online", lastSync: new Date().toISOString() });
    if (!options.silent) {
      showToast("Yangilandi", "Bloklar, mahsulotlar va hisobot backenddan olindi.", "success");
      haptic("success");
    }
  } catch (error) {
    setState({ apiStatus: "error", lastSync: new Date().toISOString() });
    showToast("API xatosi", error.message || "Backend bilan aloqa bo'lmadi.", "error");
    haptic("error");
  } finally {
    setBusy(false);
    setMainButtonLoading(false);
  }
}

function navigate(route) {
  const state = getState();
  if ((route === "add" || route === "blocks") && state.role !== "admin") {
    showToast("Ruxsat yo'q", "Bu bo'lim faqat admin uchun.", "error");
    haptic("warning");
    return;
  }
  setRoute(route);
  haptic("light");
}

function toggleRole() {
  const nextRole = getState().role === "admin" ? "seller" : "admin";
  setRole(nextRole);
  showToast(
    nextRole === "admin" ? "Admin rejim" : "Sotuvchi rejim",
    "Bu faqat UI ko'rinishi. Haqiqiy ruxsat backendda tekshiriladi.",
    "info"
  );
  haptic("light");
}

async function addProduct(product) {
  const state = getState();

  if (state.role !== "admin") {
    showToast("Ruxsat yo'q", "Faqat admin mahsulot qo'sha oladi.", "error");
    haptic("error");
    return;
  }

  try {
    setBusy(true);
    setMainButtonLoading(true);
    const created = await createProduct(state.backendUrl, product, getInitData());
    addLocalProduct(created);
    showToast("Mahsulot qo'shildi", `${created.name} ${created.block} blokka kiritildi.`, "success");
    haptic("success");
    setFilters({ block: created.block });
    setRoute("products");
    refreshData({ silent: true });
  } catch (error) {
    showToast("Saqlanmadi", error.message || "Mahsulot qo'shishda xatolik.", "error");
    haptic("error");
  } finally {
    setBusy(false);
    setMainButtonLoading(false);
  }
}

async function sellProduct(productId, quantity) {
  const state = getState();

  try {
    setBusy(true);
    setMainButtonLoading(true);

    if (state.backendUrl) {
      await apiSellProduct(state.backendUrl, productId, quantity, getInitData());
    }

    const sale = recordSale(productId, quantity, state.user.name);
    showToast("Sotuv yakunlandi", `${sale.productName}: ${sale.quantity} ${sale.unit}`, "success");
    haptic("success");
    setRoute("reports");
    refreshData({ silent: true });
  } catch (error) {
    showToast("Sotuv xatosi", error.message || "Sotuvni yakunlab bo'lmadi.", "error");
    haptic("error");
  } finally {
    setBusy(false);
    setMainButtonLoading(false);
  }
}

async function addBlock(block) {
  const state = getState();
  if (state.role !== "admin") {
    showToast("Ruxsat yo'q", "Blok yaratish faqat admin uchun.", "error");
    return;
  }

  try {
    setBusy(true);
    const created = await apiCreateBlock(state.backendUrl, block, getInitData());
    addLocalBlock(created);
    showToast("Blok yaratildi", `${created.name} blok omborga qo'shildi.`, "success");
    haptic("success");
    refreshData({ silent: true });
  } catch (error) {
    showToast("Blok saqlanmadi", error.message || "Blok yaratishda xatolik.", "error");
    haptic("error");
  } finally {
    setBusy(false);
  }
}

async function updateBlock(blockId, patch) {
  const state = getState();
  if (state.role !== "admin") {
    showToast("Ruxsat yo'q", "Blokni tahrirlash faqat admin uchun.", "error");
    return;
  }

  try {
    setBusy(true);
    const updated = await apiUpdateBlock(state.backendUrl, blockId, patch, getInitData());
    updateLocalBlock(blockId, updated);
    showToast("Blok yangilandi", `${updated.name} blok ma'lumotlari saqlandi.`, "success");
    haptic("success");
    refreshData({ silent: true });
  } catch (error) {
    showToast("Blok yangilanmadi", error.message || "Tahrirlashda xatolik.", "error");
    haptic("error");
  } finally {
    setBusy(false);
  }
}

async function deleteBlock(blockId) {
  const state = getState();
  if (state.role !== "admin") {
    showToast("Ruxsat yo'q", "Blokni o'chirish faqat admin uchun.", "error");
    return;
  }

  try {
    setBusy(true);
    await apiDeleteBlock(state.backendUrl, blockId, getInitData());
    deleteLocalBlock(blockId);
    showToast("Blok o'chirildi", "Mahsulotlar birinchi mavjud blokka ko'chirildi.", "success");
    haptic("success");
    refreshData({ silent: true });
  } catch (error) {
    showToast("Blok o'chmadi", error.message || "O'chirishda xatolik.", "error");
    haptic("error");
  } finally {
    setBusy(false);
  }
}

function saveBackendUrl(url) {
  setBackendUrl(url);
  showToast(url ? "Backend saqlandi" : "Demo rejim", url || "Backend URL tozalandi.", "success");
  haptic("success");
  refreshData({ silent: false });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Nusxa olindi", text, "success");
    haptic("success");
  } catch {
    showToast("Nusxa olinmadi", "Brauzer clipboard ruxsatini bermadi.", "error");
    haptic("error");
  }
}

function configureTelegramMainButton(state) {
  if (state.route === "add" && state.role === "admin") {
    configureMainButton("Mahsulotni saqlash", () => {
      document.querySelector("#addProductForm")?.requestSubmit();
    });
    return;
  }

  if (state.route === "blocks" && state.role === "admin") {
    configureMainButton("Yangi blok", () => {
      document.querySelector('[data-action="open-block-create"]')?.click();
    });
    return;
  }

  if (state.route === "sell" && state.selectedProductId) {
    configureMainButton("Sotishni tasdiqlash", () => {
      document.querySelector('[data-action="confirm-sell"]')?.click();
    });
    return;
  }

  if (state.route === "products" && state.role === "admin") {
    configureMainButton("Yangi mahsulot", () => navigate("add"));
    return;
  }

  configureMainButton("", () => {}, false);
}
