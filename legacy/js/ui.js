import {
  csvEscape,
  debounce,
  downloadText,
  escapeHTML,
  formatCurrency,
  formatDate,
  formatNumber,
  todayInputValue,
  toNumber,
} from "./utils.js";

let refs = {};
let handlers = {};
let currentState = null;
let salesChart = null;

export function mountUI(callbacks) {
  handlers = callbacks;
  refs = {
    title: document.querySelector("#screenTitle"),
    userName: document.querySelector("#userName"),
    roleToggle: document.querySelector("#roleToggle"),
    refreshButton: document.querySelector("#refreshButton"),
    settingsButton: document.querySelector("#settingsButton"),
    syncStrip: document.querySelector("#syncStrip"),
    syncStatus: document.querySelector("#syncStatus"),
    dashboardView: document.querySelector("#dashboardView"),
    productsView: document.querySelector("#productsView"),
    blocksView: document.querySelector("#blocksView"),
    addView: document.querySelector("#addView"),
    sellView: document.querySelector("#sellView"),
    reportsView: document.querySelector("#reportsView"),
    modalBackdrop: document.querySelector("#modalBackdrop"),
    modalTitle: document.querySelector("#modalTitle"),
    modalKicker: document.querySelector("#modalKicker"),
    modalBody: document.querySelector("#modalBody"),
    modalClose: document.querySelector("#modalClose"),
    toastStack: document.querySelector("#toastStack"),
    loaderOverlay: document.querySelector("#loaderOverlay"),
  };

  refs.refreshButton.addEventListener("click", () => handlers.refresh());
  refs.settingsButton.addEventListener("click", () => showSettingsModal());
  refs.roleToggle.addEventListener("click", () => handlers.toggleRole());
  refs.modalClose.addEventListener("click", hideModal);
  refs.modalBackdrop.addEventListener("click", (event) => {
    if (event.target === refs.modalBackdrop) {
      hideModal();
    }
  });

  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  document.addEventListener("submit", handleSubmit);
}

export function render(state) {
  currentState = state;
  const focused = document.activeElement;
  const focusId = focused?.id;
  const selectionStart = focused?.selectionStart;

  refs.title.textContent = screenTitle(state.route);
  refs.userName.textContent = state.user.name;
  refs.roleToggle.textContent = state.role === "admin" ? "Admin" : "Sotuvchi";

  renderSync(state);
  renderNav(state.route, state.role);
  renderViews(state);
  restoreFocus(focusId, selectionStart);
  renderIcons();

  if (state.route === "reports") {
    requestAnimationFrame(() => renderSalesChart(state));
  }
}

export function setBusy(isBusy) {
  refs.loaderOverlay.hidden = !isBusy;
}

export function showToast(title, message = "", type = "info") {
  const icon = type === "success" ? "check-circle-2" : type === "error" ? "circle-alert" : "info";
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <div>
      <strong>${escapeHTML(title)}</strong>
      ${message ? `<p>${escapeHTML(message)}</p>` : ""}
    </div>
  `;
  refs.toastStack.append(toast);
  renderIcons();
  setTimeout(() => toast.remove(), 3600);
}

export function hideModal() {
  refs.modalBackdrop.hidden = true;
  refs.modalBody.innerHTML = "";
}

function showModal(kicker, title, body) {
  refs.modalKicker.textContent = kicker;
  refs.modalTitle.textContent = title;
  refs.modalBody.innerHTML = body;
  refs.modalBackdrop.hidden = false;
  renderIcons();
}

function renderSync(state) {
  refs.syncStrip.classList.remove("online", "error");
  if (state.apiStatus === "online") {
    refs.syncStrip.classList.add("online");
    refs.syncStatus.textContent = `API ulangan${state.lastSync ? ` - ${formatDate(state.lastSync)}` : ""}`;
    return;
  }

  if (state.apiStatus === "error") {
    refs.syncStrip.classList.add("error");
    refs.syncStatus.textContent = "API xatosi, demo cache ishlayapti";
    return;
  }

  refs.syncStatus.textContent = "Demo rejim - backend URL sozlamadan kiritiladi";
}

function renderNav(route, role) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    const itemRoute = button.dataset.route;
    button.classList.toggle("active", itemRoute === route);
    if (itemRoute === "add" || itemRoute === "blocks") {
      button.hidden = role !== "admin";
    }
  });
}

function renderViews(state) {
  const views = {
    dashboard: refs.dashboardView,
    products: refs.productsView,
    blocks: refs.blocksView,
    add: refs.addView,
    sell: refs.sellView,
    reports: refs.reportsView,
  };

  Object.entries(views).forEach(([route, element]) => {
    element.classList.toggle("active", route === state.route);
  });

  refs.dashboardView.innerHTML = dashboardTemplate(state);
  refs.productsView.innerHTML = productsTemplate(state);
  refs.blocksView.innerHTML = blocksTemplate(state);
  refs.addView.innerHTML = addProductTemplate(state);
  refs.sellView.innerHTML = sellTemplate(state);
  refs.reportsView.innerHTML = reportsTemplate(state);
}

function dashboardTemplate(state) {
  const stats = calculateStats(state);
  const lowStock = state.products.filter((product) => stockStatus(product) !== "ok").slice(0, 3);
  const recentSales = state.sales.slice(0, 4);

  return `
    <article class="hero-card">
      <div class="hero-content">
        <h2>Omborni bloklar bo'yicha boshqaring</h2>
        <p>A blok tez sotiladigan mahsulotlar, B o'rtacha talab, C zaxira. Qidiruv mahsulot nomi, kodi va blok bo'yicha ishlaydi.</p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-route="products">
            <i data-lucide="search"></i> Tez qidirish
          </button>
          <button class="secondary-button" type="button" data-route="${state.role === "admin" ? "blocks" : "reports"}">
            <i data-lucide="${state.role === "admin" ? "map" : "chart-no-axes-combined"}"></i>
            ${state.role === "admin" ? "Bloklarni boshqarish" : "Hisobot"}
          </button>
        </div>
      </div>
    </article>

    <section class="stats-grid">
      ${statCard("Ombor qiymati", formatCurrency(stats.inventoryValue), "warehouse", `${stats.blockCount} blok faol`)}
      ${statCard("Kam qoldiq", formatNumber(stats.lowStockCount), "triangle-alert", `${stats.outStockCount} ta tugagan`)}
      ${statCard("Bugungi sotuv", formatCurrency(stats.todayRevenue), "banknote", `${formatCurrency(stats.todayProfit)} foyda`)}
      ${statCard("Mahsulotlar", formatNumber(state.products.length), "package-check", `${formatNumber(stats.totalQuantity)} jami qoldiq`)}
    </section>

    <section class="quick-grid">
      ${actionButton("products", "boxes", "Ombor")}
      ${actionButton(state.role === "admin" ? "blocks" : "products", "map", "Bloklar")}
      ${actionButton(state.role === "admin" ? "add" : "reports", state.role === "admin" ? "plus" : "chart-no-axes-combined", state.role === "admin" ? "Qo'shish" : "Hisobot")}
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Bloklar holati</h2>
          <p>Har bir zonadagi mahsulot soni va qiymat</p>
        </div>
        <button class="ghost-button" type="button" data-route="products">Ombor</button>
      </div>
      <div class="block-overview-grid">
        ${state.blocks.map((block) => blockOverviewTemplate(block, state)).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Kam qoldiq</h2>
          <p>Tez to'ldirish kerak bo'lgan mahsulotlar</p>
        </div>
        <button class="ghost-button" type="button" data-filter-shortcut="low" data-route="products">Ko'rish</button>
      </div>
      <div class="low-stock-list">
        ${
          lowStock.length
            ? lowStock.map(productCompactTemplate).join("")
            : emptyTemplate("circle-check-big", "Hammasi joyida", "Kam qoldiqdagi mahsulot yo'q.")
        }
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Oxirgi sotuvlar</h2>
          <p>So'nggi tranzaksiyalar va foyda</p>
        </div>
        <button class="ghost-button" type="button" data-route="reports">Barchasi</button>
      </div>
      <div class="activity-list">
        ${
          recentSales.length
            ? recentSales.map(activityTemplate).join("")
            : emptyTemplate("receipt", "Hali sotuv yo'q", "Birinchi sotuvdan keyin shu yerda chiqadi.")
        }
      </div>
    </section>
  `;
}

function productsTemplate(state) {
  const products = filteredProducts(state);

  return `
    <section class="sticky-product-tools">
      <label class="input-inner top-search" for="productSearch">
        <i data-lucide="search"></i>
        <input
          id="productSearch"
          type="search"
          placeholder="Nom, kod yoki blok bo'yicha qidirish"
          value="${escapeHTML(state.filters.search)}"
          autocomplete="off"
        />
      </label>
      <div class="block-nav" aria-label="Blok filtri">
        ${blockFilterButton("all", "ALL", "#64748B", state.filters.block, state.products.length)}
        ${state.blocks
          .map((block) =>
            blockFilterButton(
              block.id,
              block.name,
              block.color,
              state.filters.block,
              state.products.filter((product) => product.block === block.id).length
            )
          )
          .join("")}
      </div>
    </section>

    <section class="panel compact-panel">
      <div class="toolbar">
        <button class="secondary-button" type="button" data-action="clear-search">
          <i data-lucide="x"></i> Tozalash
        </button>
        <button class="primary-button" type="button" data-route="${state.role === "admin" ? "add" : "reports"}">
          <i data-lucide="${state.role === "admin" ? "plus" : "chart-no-axes-combined"}"></i>
          ${state.role === "admin" ? "Yangi" : "Hisobot"}
        </button>
      </div>
      <div class="chip-row" role="list" aria-label="Qoldiq filtri">
        ${chip("all", "Barchasi", state.filters.stock, "stock")}
        ${chip("low", "Kam qoldiq", state.filters.stock, "stock")}
        ${chip("out", "Tugagan", state.filters.stock, "stock")}
        ${chip("dona", "Dona", state.filters.unit, "unit")}
        ${chip("metr", "Metr", state.filters.unit, "unit")}
      </div>
      <div class="filter-grid">
        <label class="select-wrap">
          <span class="mini-label">Saralash</span>
          <select id="sortSelect">
            <option value="name" ${state.filters.sort === "name" ? "selected" : ""}>Nomi bo'yicha</option>
            <option value="block" ${state.filters.sort === "block" ? "selected" : ""}>Blok bo'yicha</option>
            <option value="qty-asc" ${state.filters.sort === "qty-asc" ? "selected" : ""}>Qoldiq: kamdan ko'pga</option>
            <option value="qty-desc" ${state.filters.sort === "qty-desc" ? "selected" : ""}>Qoldiq: ko'pdan kamga</option>
            <option value="value-desc" ${state.filters.sort === "value-desc" ? "selected" : ""}>Qiymat: yuqoridan</option>
          </select>
        </label>
        <label class="select-wrap">
          <span class="mini-label">Birlik</span>
          <select id="unitSelect">
            <option value="all" ${state.filters.unit === "all" ? "selected" : ""}>Barchasi</option>
            <option value="dona" ${state.filters.unit === "dona" ? "selected" : ""}>dona</option>
            <option value="metr" ${state.filters.unit === "metr" ? "selected" : ""}>metr</option>
          </select>
        </label>
      </div>
    </section>

    ${
      state.role === "admin"
        ? `<section class="bulk-panel">
            <div>
              <strong>Bulk move</strong>
              <p class="muted">Tanlangan blokdagi mahsulotlarni boshqa blokka o'tkazing.</p>
            </div>
            <button class="ghost-button" type="button" data-action="open-bulk-move">
              <i data-lucide="move-right"></i> Ko'chirish
            </button>
          </section>`
        : ""
    }

    <section class="product-list">
      ${
        products.length
          ? products.map(productCardTemplate).join("")
          : emptyTemplate("search-x", "Mahsulot topilmadi", "Qidiruv yoki blok filtrini o'zgartiring.")
      }
    </section>
  `;
}

function blocksTemplate(state) {
  if (state.role !== "admin") {
    return `
      <section class="empty-state">
        <i data-lucide="lock-keyhole"></i>
        <strong>Admin ruxsati kerak</strong>
        <p>Bloklarni yaratish va o'chirish faqat admin uchun.</p>
      </section>
    `;
  }

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Admin Block Panel</h2>
          <p>Real ombor zonalarini yarating, rang bering va tartiblang.</p>
        </div>
        <button class="primary-button" type="button" data-action="open-block-create">
          <i data-lucide="plus"></i> Blok
        </button>
      </div>
      <div class="block-admin-list">
        ${state.blocks.map((block, index) => blockAdminTemplate(block, state, index)).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Bulk assignment</h2>
          <p>Butun blokni boshqa blokka o'tkazish.</p>
        </div>
      </div>
      ${bulkMoveFormTemplate(state)}
    </section>
  `;
}

function addProductTemplate(state) {
  if (state.role !== "admin") {
    return `
      <section class="empty-state">
        <i data-lucide="lock-keyhole"></i>
        <strong>Admin ruxsati kerak</strong>
        <p>Mahsulot qo'shish backendda ham admin huquqi bilan tekshirilishi kerak.</p>
      </section>
    `;
  }

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Yangi mahsulot</h2>
          <p>Har bir mahsulot blok va joylashuv bilan saqlanadi.</p>
        </div>
      </div>

      <form class="form-grid" id="addProductForm" novalidate>
        ${field("productName", "Mahsulot nomi", "text", "Masalan: Zebra parda")}
        ${field("productCode", "Kod", "text", "ZP-072")}
        <div class="amount-grid">
          <label class="field">
            <span>Blok</span>
            <select id="productBlock">
              ${state.blocks.map((block) => `<option value="${escapeHTML(block.id)}">${escapeHTML(block.name)} - ${escapeHTML(block.description || "Zona")}</option>`).join("")}
            </select>
            <small class="field-error" data-error-for="productBlock"></small>
          </label>
          ${field("productLocation", "Joylashuv", "text", "Shelf A3")}
        </div>
        <div class="amount-grid">
          ${field("productQuantity", "Miqdor", "number", "0", "0", "0.01")}
          <label class="field">
            <span>Birlik</span>
            <select id="productUnit">
              <option value="dona">dona</option>
              <option value="metr">metr</option>
            </select>
            <small class="field-error" data-error-for="productUnit"></small>
          </label>
        </div>
        <div class="amount-grid">
          ${field("productCost", "Kirim narxi", "number", "0", "0", "100")}
          ${field("productPrice", "Sotuv narxi", "number", "0", "0", "100")}
        </div>
        <div class="amount-grid">
          ${field("productMinStock", "Minimal qoldiq", "number", "5", "0", "1")}
          ${field("productCategory", "Kategoriya", "text", "Jalyuzi")}
        </div>
        <label class="field">
          <span>Izoh</span>
          <textarea id="productNote" placeholder="Qo'shimcha ma'lumot"></textarea>
          <small class="field-error" data-error-for="productNote"></small>
        </label>
        <div class="form-actions">
          <button class="secondary-button" type="button" data-action="clear-product-form">
            <i data-lucide="eraser"></i> Tozalash
          </button>
          <button class="primary-button" type="submit">
            <i data-lucide="save"></i> Saqlash
          </button>
        </div>
      </form>
    </section>
  `;
}

function sellTemplate(state) {
  const selected = state.products.find((product) => product.id === state.selectedProductId);

  if (!selected) {
    return `
      <section class="panel">
        <div class="section-header">
          <div>
            <h2>Sotish</h2>
            <p>Avval mahsulot tanlang.</p>
          </div>
        </div>
        <div class="product-list">
          ${state.products.map(productCompactTemplate).join("")}
        </div>
      </section>
    `;
  }

  const max = Number(selected.quantity || 0);
  const disabled = max <= 0 ? "disabled" : "";

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>${escapeHTML(selected.name)}</h2>
          <p>Kod: ${escapeHTML(selected.code)} - Omborda ${formatNumber(selected.quantity)} ${escapeHTML(selected.unit)}</p>
        </div>
        ${blockBadge(selected.block)}
      </div>

      <div class="sell-preview">
        <div class="sell-summary" id="sellSummary">
          <strong>${formatCurrency(selected.sellPrice)} / ${escapeHTML(selected.unit)}</strong>
          <p class="muted">${escapeHTML(selected.locationNote || "Joylashuv kiritilmagan")} - miqdor kiriting.</p>
        </div>
        <label class="field">
          <span>Sotiladigan miqdor</span>
          <input id="sellQuantity" type="number" min="1" max="${max}" step="1" value="${max > 0 ? 1 : 0}" ${disabled} />
          <small class="field-error" id="sellError"></small>
        </label>
        <div class="chip-row">
          ${[1, 2, 5, 10].map((qty) => `<button class="chip" type="button" data-action="quick-qty" data-qty="${qty}" ${qty > max ? "disabled" : ""}>${qty}</button>`).join("")}
          <button class="chip" type="button" data-action="quick-qty" data-qty="${max}" ${max <= 0 ? "disabled" : ""}>Hammasi</button>
        </div>
        <div class="form-actions">
          <button class="secondary-button" type="button" data-route="products">
            <i data-lucide="arrow-left"></i> Orqaga
          </button>
          <button class="primary-button" type="button" data-action="confirm-sell" data-id="${escapeHTML(selected.id)}" ${disabled}>
            <i data-lucide="shopping-cart"></i> Sotishni tasdiqlash
          </button>
        </div>
      </div>
    </section>
  `;
}

function reportsTemplate(state) {
  const sales = filteredSales(state);
  const stats = calculateStats({ ...state, sales });

  return `
    <section class="panel">
      <div class="section-header">
        <div>
          <h2>Sotuv hisoboti</h2>
          <p>Daromad, foyda va tranzaksiyalar</p>
        </div>
        <button class="icon-button" type="button" data-action="export-csv" aria-label="CSV eksport">
          <i data-lucide="download"></i>
        </button>
      </div>
      <div class="filter-grid">
        <label class="select-wrap">
          <span class="mini-label">Davr</span>
          <select id="reportRange">
            <option value="today" ${state.salesRange === "today" ? "selected" : ""}>Bugun</option>
            <option value="week" ${state.salesRange === "week" ? "selected" : ""}>7 kun</option>
            <option value="month" ${state.salesRange === "month" ? "selected" : ""}>30 kun</option>
            <option value="all" ${state.salesRange === "all" ? "selected" : ""}>Hammasi</option>
          </select>
        </label>
        <button class="secondary-button" type="button" data-action="print-report">
          <i data-lucide="printer"></i> Chop etish
        </button>
      </div>
    </section>

    <section class="report-grid">
      ${reportCard("Tushum", formatCurrency(stats.totalRevenue), "wallet")}
      ${reportCard("Foyda", formatCurrency(stats.totalProfit), "trending-up")}
      ${reportCard("Sotuv soni", formatNumber(sales.length), "receipt")}
      ${reportCard("O'rtacha chek", formatCurrency(sales.length ? stats.totalRevenue / sales.length : 0), "calculator")}
    </section>

    <section class="chart-card">
      <canvas id="salesChart" aria-label="Sotuv grafigi"></canvas>
    </section>

    <section class="transaction-list">
      ${
        sales.length
          ? sales.map(transactionTemplate).join("")
          : emptyTemplate("receipt-text", "Sotuv yo'q", "Tanlangan davrda tranzaksiya topilmadi.")
      }
    </section>

    <section class="panel">
      <div class="form-actions">
        <button class="secondary-button" type="button" data-action="clear-sales">
          <i data-lucide="trash-2"></i> Sotuvlarni tozalash
        </button>
        <button class="ghost-button" type="button" data-action="reset-demo">
          <i data-lucide="rotate-ccw"></i> Demo reset
        </button>
      </div>
    </section>
  `;
}

function productCardTemplate(product) {
  return `
    <article class="product-card ${stockStatus(product)}">
      <div>
        <div class="product-title-row">
          <h3>${escapeHTML(product.name)}</h3>
          ${blockBadge(product.block)}
        </div>
        <p class="product-subtitle">
          Kod: ${escapeHTML(product.code)} - ${escapeHTML(product.category || "Kategoriya yo'q")}
        </p>
        <p class="location-line"><i data-lucide="map-pin"></i>${escapeHTML(product.locationNote || "Joylashuv kiritilmagan")}</p>
        <div class="badge-row">
          ${stockBadge(product)}
          <span class="badge neutral">${formatCurrency(product.sellPrice)} / ${escapeHTML(product.unit)}</span>
        </div>
      </div>
      <div class="product-side">
        <div class="qty">
          <strong>${formatNumber(product.quantity)}</strong>
          <span>${escapeHTML(product.unit)}</span>
        </div>
        <button class="product-action" type="button" data-action="open-sell" data-id="${escapeHTML(product.id)}" ${Number(product.quantity) <= 0 ? "disabled" : ""}>
          <i data-lucide="shopping-cart"></i> Sotish
        </button>
        <button class="ghost-button" type="button" data-action="details" data-id="${escapeHTML(product.id)}">Detail</button>
      </div>
    </article>
  `;
}

function productCompactTemplate(product) {
  return `
    <article class="product-card ${stockStatus(product)}">
      <div>
        <div class="product-title-row">
          <h3>${escapeHTML(product.name)}</h3>
          ${blockBadge(product.block)}
        </div>
        <p class="product-subtitle">${escapeHTML(product.code)} - ${formatNumber(product.quantity)} ${escapeHTML(product.unit)}</p>
        <p class="location-line"><i data-lucide="map-pin"></i>${escapeHTML(product.locationNote || "Joylashuv kiritilmagan")}</p>
      </div>
      <div class="product-side">
        <button class="product-action" type="button" data-action="open-sell" data-id="${escapeHTML(product.id)}" ${Number(product.quantity) <= 0 ? "disabled" : ""}>
          <i data-lucide="shopping-cart"></i> Sotish
        </button>
      </div>
    </article>
  `;
}

function blockOverviewTemplate(block, state) {
  const products = state.products.filter((product) => product.block === block.id);
  const value = products.reduce(
    (sum, product) => sum + Number(product.quantity || 0) * Number(product.sellPrice || 0),
    0
  );

  return `
    <button class="block-overview-card" type="button" data-action="block-filter" data-block="${escapeHTML(block.id)}" data-route="products">
      <span class="block-letter" style="--block-color: ${escapeHTML(block.color)}">${escapeHTML(block.name)}</span>
      <strong>${formatNumber(products.length)} mahsulot</strong>
      <p>${formatCurrency(value)}</p>
    </button>
  `;
}

function blockAdminTemplate(block, state, index) {
  const products = state.products.filter((product) => product.block === block.id);

  return `
    <article class="block-admin-card">
      <div class="block-admin-main">
        <span class="block-letter large" style="--block-color: ${escapeHTML(block.color)}">${escapeHTML(block.name)}</span>
        <div>
          <h3>${escapeHTML(block.name)} Block</h3>
          <p>${escapeHTML(block.description || "Izoh yo'q")}</p>
          <div class="badge-row">
            <span class="badge neutral">${escapeHTML(block.priority)} priority</span>
            <span class="badge neutral">${formatNumber(products.length)} products</span>
          </div>
        </div>
      </div>
      <div class="block-admin-actions">
        <button class="icon-button" type="button" data-action="move-block-up" data-id="${escapeHTML(block.id)}" ${index === 0 ? "disabled" : ""} aria-label="Yuqoriga">
          <i data-lucide="arrow-up"></i>
        </button>
        <button class="icon-button" type="button" data-action="move-block-down" data-id="${escapeHTML(block.id)}" ${index === state.blocks.length - 1 ? "disabled" : ""} aria-label="Pastga">
          <i data-lucide="arrow-down"></i>
        </button>
        <button class="icon-button" type="button" data-action="edit-block" data-id="${escapeHTML(block.id)}" aria-label="Tahrirlash">
          <i data-lucide="pencil"></i>
        </button>
        <button class="icon-button danger-icon" type="button" data-action="delete-block" data-id="${escapeHTML(block.id)}" aria-label="O'chirish">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </article>
  `;
}

function blockFilterButton(id, label, color, selected, count) {
  return `
    <button class="block-chip ${selected === id ? "active" : ""}" type="button" data-action="block-filter" data-block="${escapeHTML(id)}" style="--block-color: ${escapeHTML(color)}">
      <span>${escapeHTML(label)}</span>
      <small>${formatNumber(count)}</small>
    </button>
  `;
}

function blockBadge(blockId) {
  const block = currentState?.blocks.find((item) => item.id === blockId) || {
    id: blockId,
    name: blockId || "A",
    color: "#64748B",
  };

  return `
    <span class="block-badge" style="--block-color: ${escapeHTML(block.color)}">
      BLOCK ${escapeHTML(block.name)}
    </span>
  `;
}

function blockOptions(selected = "") {
  return currentState.blocks
    .map(
      (block) =>
        `<option value="${escapeHTML(block.id)}" ${block.id === selected ? "selected" : ""}>${escapeHTML(block.name)} - ${escapeHTML(block.description || "Zona")}</option>`
    )
    .join("");
}

function bulkMoveFormTemplate(state) {
  return `
    <div class="bulk-form">
      <label class="field">
        <span>Qaysi blokdan</span>
        <select id="bulkFromBlock">
          <option value="all">Barcha bloklar</option>
          ${state.blocks.map((block) => `<option value="${escapeHTML(block.id)}">${escapeHTML(block.name)} block</option>`).join("")}
        </select>
        <small class="field-error"></small>
      </label>
      <label class="field">
        <span>Qaysi blokka</span>
        <select id="bulkToBlock">
          ${state.blocks.map((block) => `<option value="${escapeHTML(block.id)}">${escapeHTML(block.name)} block</option>`).join("")}
        </select>
        <small class="field-error"></small>
      </label>
      <button class="primary-button" type="button" data-action="bulk-move-products">
        <i data-lucide="move-right"></i> Bulk move
      </button>
    </div>
  `;
}

function transactionTemplate(sale) {
  return `
    <article class="transaction-item">
      <div>
        <strong>${escapeHTML(sale.productName)}</strong>
        <p>${escapeHTML(sale.code)} - ${formatNumber(sale.quantity)} ${escapeHTML(sale.unit)} - ${formatDate(sale.createdAt)}</p>
      </div>
      <div>
        <strong>${formatCurrency(sale.revenue)}</strong>
        <p class="amount-positive">+${formatCurrency(sale.profit)}</p>
      </div>
    </article>
  `;
}

function activityTemplate(sale) {
  return `
    <article class="activity-item">
      <div>
        <strong>${escapeHTML(sale.productName)}</strong>
        <p>${formatNumber(sale.quantity)} ${escapeHTML(sale.unit)} - ${formatDate(sale.createdAt)}</p>
      </div>
      <span class="amount-positive">${formatCurrency(sale.profit)}</span>
    </article>
  `;
}

function statCard(label, value, icon, hint) {
  return `
    <article class="stat-card">
      <span class="badge neutral"><i data-lucide="${icon}"></i>${escapeHTML(label)}</span>
      <strong>${value}</strong>
      <span class="trend"><i data-lucide="sparkles"></i>${escapeHTML(hint)}</span>
    </article>
  `;
}

function reportCard(label, value, icon) {
  return `
    <article class="report-card">
      <span class="badge neutral"><i data-lucide="${icon}"></i>${escapeHTML(label)}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function actionButton(route, icon, label) {
  return `
    <button class="action-button" type="button" data-route="${route}">
      <span><i data-lucide="${icon}"></i></span>
      ${escapeHTML(label)}
    </button>
  `;
}

function field(id, label, type, placeholder, min = "", step = "") {
  return `
    <label class="field">
      <span>${escapeHTML(label)}</span>
      <input id="${id}" type="${type}" placeholder="${escapeHTML(placeholder)}" ${min !== "" ? `min="${min}"` : ""} ${step !== "" ? `step="${step}"` : ""} />
      <small class="field-error" data-error-for="${id}"></small>
    </label>
  `;
}

function chip(value, label, selected, group) {
  const isActive = selected === value;
  return `
    <button
      class="chip ${isActive ? "active" : ""}"
      type="button"
      data-action="chip-filter"
      data-group="${group}"
      data-value="${value}"
    >
      ${escapeHTML(label)}
    </button>
  `;
}

function emptyTemplate(icon, title, text) {
  return `
    <div class="empty-state">
      <i data-lucide="${icon}"></i>
      <strong>${escapeHTML(title)}</strong>
      <p>${escapeHTML(text)}</p>
    </div>
  `;
}

function stockStatus(product) {
  const qty = Number(product.quantity || 0);
  const min = Number(product.minStock || 0);
  if (qty <= 0) {
    return "out";
  }
  if (qty <= min) {
    return "low";
  }
  return "ok";
}

function stockBadge(product) {
  const status = stockStatus(product);
  if (status === "out") {
    return `<span class="badge danger"><i data-lucide="circle-alert"></i>Tugagan</span>`;
  }
  if (status === "low") {
    return `<span class="badge warning"><i data-lucide="triangle-alert"></i>Kam qoldiq</span>`;
  }
  return `<span class="badge success"><i data-lucide="circle-check"></i>Yetarli</span>`;
}

function calculateStats(state) {
  const today = new Date().toDateString();
  const todaySales = state.sales.filter((sale) => new Date(sale.createdAt).toDateString() === today);

  return {
    inventoryValue: state.products.reduce(
      (sum, product) => sum + Number(product.quantity || 0) * Number(product.sellPrice || 0),
      0
    ),
    totalQuantity: state.products.reduce((sum, product) => sum + Number(product.quantity || 0), 0),
    lowStockCount: state.products.filter((product) => stockStatus(product) === "low").length,
    outStockCount: state.products.filter((product) => stockStatus(product) === "out").length,
    blockCount: state.blocks.length,
    todayRevenue: todaySales.reduce((sum, sale) => sum + Number(sale.revenue || 0), 0),
    todayProfit: todaySales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0),
    totalRevenue: state.sales.reduce((sum, sale) => sum + Number(sale.revenue || 0), 0),
    totalProfit: state.sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0),
  };
}

function filteredProducts(state) {
  const search = state.filters.search.trim().toLowerCase();
  let products = [...state.products];

  if (state.filters.block !== "all") {
    products = products.filter((product) => product.block === state.filters.block);
  }

  if (search) {
    products = products.filter((product) => {
      const block = state.blocks.find((item) => item.id === product.block);
      return [product.name, product.code, product.category, product.block, block?.name, block?.description].some(
        (field) => String(field || "").toLowerCase().includes(search)
      );
    });
  }

  if (state.filters.stock !== "all") {
    products = products.filter((product) => stockStatus(product) === state.filters.stock);
  }

  if (state.filters.unit !== "all") {
    products = products.filter((product) => product.unit === state.filters.unit);
  }

  products.sort((a, b) => {
    if (state.filters.sort === "block") {
      return String(a.block).localeCompare(String(b.block), "uz") || String(a.name).localeCompare(String(b.name), "uz");
    }
    if (state.filters.sort === "qty-asc") {
      return Number(a.quantity) - Number(b.quantity);
    }
    if (state.filters.sort === "qty-desc") {
      return Number(b.quantity) - Number(a.quantity);
    }
    if (state.filters.sort === "value-desc") {
      return Number(b.quantity) * Number(b.sellPrice) - Number(a.quantity) * Number(a.sellPrice);
    }
    return String(a.name).localeCompare(String(b.name), "uz");
  });

  return products;
}

function filteredSales(state) {
  const now = Date.now();
  const rangeMs = {
    today: 1000 * 60 * 60 * 24,
    week: 1000 * 60 * 60 * 24 * 7,
    month: 1000 * 60 * 60 * 24 * 30,
    all: Infinity,
  }[state.salesRange];

  if (state.salesRange === "all") {
    return [...state.sales];
  }

  if (state.salesRange === "today") {
    const today = new Date().toDateString();
    return state.sales.filter((sale) => new Date(sale.createdAt).toDateString() === today);
  }

  return state.sales.filter((sale) => now - new Date(sale.createdAt).getTime() <= rangeMs);
}

function handleClick(event) {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    const shortcut = routeButton.dataset.filterShortcut;
    if (shortcut) {
      handlers.setFilters({ stock: shortcut });
    }
    if (routeButton.dataset.action === "block-filter") {
      handlers.setFilters({ block: routeButton.dataset.block });
    }
    handlers.navigate(routeButton.dataset.route);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  if (action === "chip-filter") {
    const { group, value } = actionButton.dataset;
    if (group === "stock") {
      handlers.setFilters({ stock: value });
    } else {
      handlers.setFilters({ unit: value });
    }
    return;
  }

  if (action === "block-filter") {
    handlers.setFilters({ block: actionButton.dataset.block });
    return;
  }

  if (action === "clear-search") {
    handlers.setFilters({ search: "", block: "all", stock: "all", unit: "all" });
    return;
  }

  if (action === "open-sell") {
    handlers.selectProduct(actionButton.dataset.id);
    return;
  }

  if (action === "details") {
    showProductDetails(actionButton.dataset.id);
    return;
  }

  if (action === "copy-code") {
    handlers.copyText(actionButton.dataset.code);
    return;
  }

  if (action === "open-move-product") {
    showMoveProductModal(actionButton.dataset.id);
    return;
  }

  if (action === "submit-move-product") {
    const blockId = document.querySelector("#moveProductBlock")?.value;
    const locationNote = document.querySelector("#moveProductLocation")?.value.trim();
    handlers.moveProductBlock(actionButton.dataset.id, blockId, locationNote);
    hideModal();
    return;
  }

  if (action === "quick-qty") {
    const input = document.querySelector("#sellQuantity");
    if (input) {
      input.value = actionButton.dataset.qty;
      updateSellPreview();
    }
    return;
  }

  if (action === "confirm-sell") {
    showSellConfirm(actionButton.dataset.id);
    return;
  }

  if (action === "submit-sell") {
    handlers.sellProduct(actionButton.dataset.id, toNumber(actionButton.dataset.qty));
    hideModal();
    return;
  }

  if (action === "clear-product-form") {
    document.querySelector("#addProductForm")?.reset();
    clearErrors();
    return;
  }

  if (action === "open-block-create") {
    showBlockFormModal();
    return;
  }

  if (action === "edit-block") {
    showBlockFormModal(actionButton.dataset.id);
    return;
  }

  if (action === "delete-block") {
    showDeleteBlockConfirm(actionButton.dataset.id);
    return;
  }

  if (action === "confirm-delete-block") {
    handlers.deleteBlock(actionButton.dataset.id);
    hideModal();
    return;
  }

  if (action === "move-block-up") {
    handlers.reorderBlock(actionButton.dataset.id, "up");
    return;
  }

  if (action === "move-block-down") {
    handlers.reorderBlock(actionButton.dataset.id, "down");
    return;
  }

  if (action === "open-bulk-move") {
    showBulkMoveModal();
    return;
  }

  if (action === "bulk-move-products") {
    const fromBlock = document.querySelector("#bulkFromBlock")?.value;
    const toBlock = document.querySelector("#bulkToBlock")?.value;
    handlers.bulkMoveProducts(fromBlock, toBlock);
    hideModal();
    return;
  }

  if (action === "export-csv") {
    exportCsv();
    return;
  }

  if (action === "print-report") {
    window.print();
    return;
  }

  if (action === "clear-sales") {
    showClearSalesConfirm();
    return;
  }

  if (action === "confirm-clear-sales") {
    handlers.clearSales();
    hideModal();
    return;
  }

  if (action === "reset-demo") {
    handlers.resetDemoData();
    hideModal();
    return;
  }

  if (action === "save-settings") {
    const backendUrl = document.querySelector("#backendUrl")?.value || "";
    handlers.saveBackendUrl(backendUrl);
    hideModal();
    return;
  }

  if (action === "close-modal") {
    hideModal();
  }
}

function handleChange(event) {
  if (event.target.id === "sortSelect") {
    handlers.setFilters({ sort: event.target.value });
  }

  if (event.target.id === "unitSelect") {
    handlers.setFilters({ unit: event.target.value });
  }

  if (event.target.id === "reportRange") {
    handlers.setSalesRange(event.target.value);
  }

  if (event.target.id === "productPicker") {
    handlers.selectProduct(event.target.value);
  }
}

const debouncedSearch = debounce((value) => handlers.setFilters({ search: value }), 300);

function handleInput(event) {
  if (event.target.id === "productSearch") {
    debouncedSearch(event.target.value);
  }

  if (event.target.id === "sellQuantity") {
    updateSellPreview();
  }
}

function handleSubmit(event) {
  if (event.target.id === "addProductForm") {
    event.preventDefault();
    const product = readProductForm();
    if (product) {
      handlers.addProduct(product);
    }
    return;
  }

  if (event.target.id === "blockForm") {
    event.preventDefault();
    const payload = readBlockForm();
    if (!payload) {
      return;
    }
    if (payload.id) {
      handlers.updateBlock(payload.id, payload.block);
    } else {
      handlers.addBlock(payload.block);
    }
    hideModal();
  }
}

function readProductForm() {
  clearErrors();

  const product = {
    name: document.querySelector("#productName")?.value.trim(),
    code: document.querySelector("#productCode")?.value.trim().toUpperCase(),
    block: document.querySelector("#productBlock")?.value,
    locationNote: document.querySelector("#productLocation")?.value.trim(),
    quantity: toNumber(document.querySelector("#productQuantity")?.value),
    unit: document.querySelector("#productUnit")?.value,
    costPrice: toNumber(document.querySelector("#productCost")?.value),
    sellPrice: toNumber(document.querySelector("#productPrice")?.value),
    minStock: toNumber(document.querySelector("#productMinStock")?.value),
    category: document.querySelector("#productCategory")?.value.trim() || "Jalyuzi",
    note: document.querySelector("#productNote")?.value.trim(),
  };

  const errors = {};
  if (!product.name) errors.productName = "Nom majburiy";
  if (!product.code) errors.productCode = "Kod majburiy";
  if (!product.block) errors.productBlock = "Blok tanlang";
  if (product.quantity < 0) errors.productQuantity = "Miqdor manfiy bo'lmaydi";
  if (product.sellPrice <= 0) errors.productPrice = "Sotuv narxini kiriting";
  if (product.costPrice < 0) errors.productCost = "Kirim narxi noto'g'ri";
  if (product.sellPrice < product.costPrice) errors.productPrice = "Sotuv narxi kirimdan past";

  Object.entries(errors).forEach(([id, message]) => setError(id, message));

  if (Object.keys(errors).length) {
    showToast("Forma xatosi", "Qizil belgilangan maydonlarni tekshiring.", "error");
    return null;
  }

  return product;
}

function readBlockForm() {
  const id = document.querySelector("#blockEditId")?.value || "";
  const block = {
    name: document.querySelector("#blockName")?.value.trim().toUpperCase(),
    description: document.querySelector("#blockDescription")?.value.trim(),
    priority: document.querySelector("#blockPriority")?.value,
    color: document.querySelector("#blockColor")?.value,
  };

  if (!block.name) {
    showToast("Blok nomi kerak", "Masalan A, B yoki C kiriting.", "error");
    return null;
  }

  return { id, block };
}

function clearErrors() {
  document.querySelectorAll("[data-error-for]").forEach((item) => {
    item.textContent = "";
  });
}

function setError(id, message) {
  const element = document.querySelector(`[data-error-for="${id}"]`);
  if (element) {
    element.textContent = message;
  }
}

function showProductDetails(productId) {
  const product = currentState.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  showModal(
    "Mahsulot kartasi",
    product.name,
    `
      <div class="settings-grid">
        <div class="settings-card">
          <p class="muted">Blok va joylashuv</p>
          <div class="row-between">
            ${blockBadge(product.block)}
            <strong>${escapeHTML(product.locationNote || "Joylashuv yo'q")}</strong>
          </div>
        </div>
        <div class="report-grid">
          ${reportCard("Qoldiq", `${formatNumber(product.quantity)} ${escapeHTML(product.unit)}`, "package")}
          ${reportCard("Sotuv narxi", formatCurrency(product.sellPrice), "tag")}
          ${reportCard("Kirim narxi", formatCurrency(product.costPrice), "wallet")}
          ${reportCard("Minimal qoldiq", `${formatNumber(product.minStock)} ${escapeHTML(product.unit)}`, "triangle-alert")}
        </div>
        <div class="settings-card">
          <p class="muted">Kod</p>
          <strong>${escapeHTML(product.code)}</strong>
        </div>
        <div class="settings-card">
          <p class="muted">Izoh</p>
          <strong>${escapeHTML(product.note || "Izoh yo'q")}</strong>
        </div>
        <div class="form-actions">
          <button class="secondary-button" type="button" data-action="open-move-product" data-id="${escapeHTML(product.id)}">
            <i data-lucide="move-right"></i> Blokni o'zgartirish
          </button>
          <button class="primary-button" type="button" data-action="open-sell" data-id="${escapeHTML(product.id)}">
            <i data-lucide="shopping-cart"></i> Sotish
          </button>
        </div>
        <button class="ghost-button" type="button" data-action="copy-code" data-code="${escapeHTML(product.code)}">
          <i data-lucide="copy"></i> Kodni nusxalash
        </button>
      </div>
    `
  );
}

function showMoveProductModal(productId) {
  const product = currentState.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  showModal(
    "Product assignment",
    "Mahsulot blokini o'zgartirish",
    `
      <div class="settings-grid">
        <div class="settings-card">
          <p class="muted">${escapeHTML(product.code)}</p>
          <strong>${escapeHTML(product.name)}</strong>
        </div>
        <label class="field">
          <span>Yangi blok</span>
          <select id="moveProductBlock">${blockOptions(product.block)}</select>
          <small class="field-error"></small>
        </label>
        <label class="field">
          <span>Joylashuv izohi</span>
          <input id="moveProductLocation" type="text" value="${escapeHTML(product.locationNote)}" placeholder="Shelf A3" />
          <small class="field-error"></small>
        </label>
        <div class="form-actions">
          <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
          <button class="primary-button" type="button" data-action="submit-move-product" data-id="${escapeHTML(product.id)}">
            <i data-lucide="save"></i> Saqlash
          </button>
        </div>
      </div>
    `
  );
}

function showBlockFormModal(blockId = "") {
  const block = currentState.blocks.find((item) => item.id === blockId);
  const title = block ? `${block.name} blokni tahrirlash` : "Yangi blok yaratish";

  showModal(
    "Admin Block Panel",
    title,
    `
      <form class="settings-grid" id="blockForm" novalidate>
        <input id="blockEditId" type="hidden" value="${escapeHTML(block?.id || "")}" />
        <label class="field">
          <span>Blok nomi</span>
          <input id="blockName" type="text" maxlength="3" placeholder="A" value="${escapeHTML(block?.name || "")}" ${block ? "readonly" : ""} />
          <small class="field-error">Masalan A, B, C.</small>
        </label>
        <label class="field">
          <span>Tavsif</span>
          <input id="blockDescription" type="text" placeholder="Fast-selling products" value="${escapeHTML(block?.description || "")}" />
          <small class="field-error"></small>
        </label>
        <div class="amount-grid">
          <label class="field">
            <span>Priority</span>
            <select id="blockPriority">
              <option value="high" ${block?.priority === "high" ? "selected" : ""}>high</option>
              <option value="medium" ${!block || block.priority === "medium" ? "selected" : ""}>medium</option>
              <option value="low" ${block?.priority === "low" ? "selected" : ""}>low</option>
            </select>
            <small class="field-error"></small>
          </label>
          <label class="field">
            <span>Rang</span>
            <input id="blockColor" type="color" value="${escapeHTML(block?.color || "#2563EB")}" />
            <small class="field-error"></small>
          </label>
        </div>
        <div class="form-actions">
          <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
          <button class="primary-button" type="submit">
            <i data-lucide="save"></i> Saqlash
          </button>
        </div>
      </form>
    `
  );
}

function showDeleteBlockConfirm(blockId) {
  const block = currentState.blocks.find((item) => item.id === blockId);
  const count = currentState.products.filter((product) => product.block === blockId).length;
  if (!block) {
    return;
  }

  showModal(
    "Blokni o'chirish",
    `${block.name} blokni o'chirasizmi?`,
    `
      <p class="muted">${formatNumber(count)} ta mahsulot birinchi mavjud blokka avtomatik o'tadi.</p>
      <div class="form-actions" style="margin-top: 14px">
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="danger-button" type="button" data-action="confirm-delete-block" data-id="${escapeHTML(block.id)}">
          <i data-lucide="trash-2"></i> O'chirish
        </button>
      </div>
    `
  );
}

function showBulkMoveModal() {
  showModal(
    "Bulk move",
    "Mahsulotlarni bloklar orasida ko'chirish",
    bulkMoveFormTemplate(currentState)
  );
}

function showSellConfirm(productId) {
  const product = currentState.products.find((item) => item.id === productId);
  const input = document.querySelector("#sellQuantity");
  const quantity = toNumber(input?.value);
  const error = validateSell(product, quantity);

  if (error) {
    document.querySelector("#sellError").textContent = error;
    showToast("Sotib bo'lmaydi", error, "error");
    return;
  }

  const revenue = quantity * Number(product.sellPrice || 0);
  const profit = quantity * (Number(product.sellPrice || 0) - Number(product.costPrice || 0));

  showModal(
    "Tasdiqlash",
    "Sotuvni yakunlash",
    `
      <div class="sell-preview">
        <div class="sell-summary">
          <strong>${escapeHTML(product.name)}</strong>
          <p class="muted">${formatNumber(quantity)} ${escapeHTML(product.unit)} - ${blockBadge(product.block)} - ${escapeHTML(product.locationNote || "Joylashuv yo'q")}</p>
        </div>
        <div class="report-grid">
          ${reportCard("Tushum", formatCurrency(revenue), "wallet")}
          ${reportCard("Foyda", formatCurrency(profit), "trending-up")}
        </div>
        <div class="form-actions">
          <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
          <button class="primary-button" type="button" data-action="submit-sell" data-id="${escapeHTML(product.id)}" data-qty="${quantity}">
            <i data-lucide="check"></i> Ha, sotildi
          </button>
        </div>
      </div>
    `
  );
}

function showClearSalesConfirm() {
  showModal(
    "Hisobot",
    "Sotuvlarni tozalash",
    `
      <p class="muted">Bu demo/local sotuv tarixini tozalaydi. Backenddagi haqiqiy ma'lumotlar o'chirilmaydi.</p>
      <div class="form-actions" style="margin-top: 14px">
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="danger-button" type="button" data-action="confirm-clear-sales">
          <i data-lucide="trash-2"></i> Tozalash
        </button>
      </div>
    `
  );
}

function showSettingsModal() {
  const state = currentState;
  showModal(
    "Sozlamalar",
    "API va demo",
    `
      <div class="settings-grid">
        <label class="field">
          <span>Flask backend URL</span>
          <input id="backendUrl" type="url" placeholder="https://your-railway-url.up.railway.app" value="${escapeHTML(state.backendUrl)}" />
          <small class="field-error">Bo'sh qoldirilsa demo rejim ishlaydi.</small>
        </label>
        <div class="settings-card">
          <p class="muted">API endpoints</p>
          <strong>/blocks, /add, /sell/&lt;id&gt;, /sales</strong>
        </div>
        <div class="settings-card">
          <p class="muted">Telegram foydalanuvchi</p>
          <strong>${escapeHTML(state.user.name)}</strong>
        </div>
        <div class="settings-card">
          <p class="muted">Bugungi sana</p>
          <strong>${todayInputValue()}</strong>
        </div>
        <div class="form-actions">
          <button class="secondary-button" type="button" data-action="reset-demo">
            <i data-lucide="rotate-ccw"></i> Demo reset
          </button>
          <button class="primary-button" type="button" data-action="save-settings">
            <i data-lucide="save"></i> Saqlash
          </button>
        </div>
      </div>
    `
  );
}

function updateSellPreview() {
  const product = currentState.products.find((item) => item.id === currentState.selectedProductId);
  const input = document.querySelector("#sellQuantity");
  const summary = document.querySelector("#sellSummary");
  const errorBox = document.querySelector("#sellError");
  if (!product || !input || !summary || !errorBox) {
    return;
  }

  const quantity = toNumber(input.value);
  const error = validateSell(product, quantity);
  errorBox.textContent = error || "";

  const revenue = quantity * Number(product.sellPrice || 0);
  const profit = quantity * (Number(product.sellPrice || 0) - Number(product.costPrice || 0));
  summary.innerHTML = `
    <strong>${formatCurrency(revenue)} tushum</strong>
    <p class="muted">${formatCurrency(profit)} taxminiy foyda - ${formatNumber(quantity)} ${escapeHTML(product.unit)} - ${escapeHTML(product.locationNote || "Joylashuv yo'q")}</p>
  `;
}

function validateSell(product, quantity) {
  if (!product) {
    return "Mahsulot tanlanmagan";
  }
  if (!quantity || quantity <= 0) {
    return "Miqdor 0 dan katta bo'lishi kerak";
  }
  if (quantity > Number(product.quantity || 0)) {
    return "Omborda yetarli mahsulot yo'q";
  }
  return "";
}

function exportCsv() {
  const sales = filteredSales(currentState);
  const rows = [
    ["Sana", "Mahsulot", "Kod", "Miqdor", "Birlik", "Tushum", "Foyda", "Sotuvchi"],
    ...sales.map((sale) => [
      sale.createdAt,
      sale.productName,
      sale.code,
      sale.quantity,
      sale.unit,
      sale.revenue,
      sale.profit,
      sale.seller,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadText(`jalyuzi-sales-${todayInputValue()}.csv`, csv, "text/csv;charset=utf-8");
  showToast("CSV tayyor", "Hisobot fayli yuklandi.", "success");
}

function renderSalesChart(state) {
  const canvas = document.querySelector("#salesChart");
  if (!canvas || !window.Chart) {
    return;
  }

  const sales = filteredSales(state);
  const grouped = new Map();

  sales.forEach((sale) => {
    const date = new Date(sale.createdAt);
    const key = date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
    const item = grouped.get(key) || { revenue: 0, profit: 0 };
    item.revenue += Number(sale.revenue || 0);
    item.profit += Number(sale.profit || 0);
    grouped.set(key, item);
  });

  const labels = [...grouped.keys()].reverse();
  const revenue = labels.map((label) => grouped.get(label).revenue);
  const profit = labels.map((label) => grouped.get(label).profit);

  if (salesChart) {
    salesChart.destroy();
  }

  salesChart = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["Hali sotuv yo'q"],
      datasets: [
        {
          label: "Tushum",
          data: revenue.length ? revenue : [0],
          backgroundColor: "#2563EB",
          borderRadius: 10,
        },
        {
          label: "Foyda",
          data: profit.length ? profit : [0],
          backgroundColor: "#16A34A",
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            usePointStyle: true,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          ticks: {
            callback(value) {
              return formatNumber(value);
            },
          },
        },
      },
    },
  });
}

function screenTitle(route) {
  return {
    dashboard: "Bosh sahifa",
    products: "Mahsulotlar",
    blocks: "Bloklar",
    add: "Mahsulot qo'shish",
    sell: "Sotish",
    reports: "Hisobot",
  }[route];
}

function restoreFocus(focusId, selectionStart) {
  if (!focusId) {
    return;
  }

  const nextFocus = document.getElementById(focusId);
  if (!nextFocus) {
    return;
  }

  nextFocus.focus();
  if (typeof selectionStart === "number" && "setSelectionRange" in nextFocus) {
    nextFocus.setSelectionRange(selectionStart, selectionStart);
  }
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
