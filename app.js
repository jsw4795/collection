"use strict";

const state = {
  whiskies: [],
  search: "",
  sort: "name",
  filters: {},
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const labels = {
  status: { sealed: "미개봉", opened: "개봉", finished: "완병", sold: "판매", gifted: "선물" },
  purchaseType: { normal: "일반 구매", tax_free: "Tax Free", duty_free: "Duty Free" },
};

function text(value, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function escapeHtml(value) {
  return text(value, "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function assetUrl(path) {
  if (!path) return null;
  const relativePath = String(path).replace(/^\/+/, "");
  return new URL(relativePath, document.baseURI).href;
}

function krwValue(item) {
  return item.purchase?.price?.paidKrw ?? item.purchase?.price?.convertedKrw ?? null;
}

function formatKrw(value) {
  return value === null || value === undefined ? "-" : new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

function formatMoney(amount, currency) {
  if (amount === null || amount === undefined || !currency) return "-";
  try {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${Number(amount).toLocaleString("ko-KR")} ${currency}`;
  }
}

function displayPrice(item) {
  const price = item.purchase?.price ?? {};
  const original = formatMoney(price.amount, price.currency);
  const krw = krwValue(item);
  if (price.currency && price.currency !== "KRW" && original !== "-" && krw !== null) return `${original} · 약 ${formatKrw(krw)}`;
  return original !== "-" ? original : formatKrw(krw);
}

function stars(rating) {
  if (rating === null || rating === undefined) return "-";
  const rounded = Math.round(Number(rating));
  return `<span class="stars" aria-hidden="true">${"★".repeat(rounded)}${"☆".repeat(Math.max(0, 5 - rounded))}</span> ${escapeHtml(rating)}`;
}

function imageMarkup(item, className = "") {
  const name = item.whisky?.nameKo || item.whisky?.name || "위스키";
  const url = assetUrl(item.whisky?.image);
  if (!url) return `<div class="empty-bottle card-placeholder ${className}" aria-label="이미지 없음"><span></span></div>`;
  return `<img class="${className}" src="${escapeHtml(url)}" alt="${escapeHtml(name)} 병" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="empty-bottle card-placeholder" hidden aria-label="이미지 없음"><span></span></div>`;
}

function updateStats() {
  const current = state.whiskies.filter((item) => ["sealed", "opened"].includes(item.bottle?.status));
  const total = state.whiskies.reduce((sum, item) => sum + (krwValue(item) ?? 0), 0);
  $("#stat-owned").textContent = current.length.toLocaleString("ko-KR");
  $("#stat-sealed").textContent = state.whiskies.filter((item) => item.bottle?.status === "sealed").length.toLocaleString("ko-KR");
  $("#stat-opened").textContent = state.whiskies.filter((item) => item.bottle?.status === "opened").length.toLocaleString("ko-KR");
  $("#stat-total").textContent = formatKrw(total);
}

function uniqueValues(path) {
  return [...new Set(state.whiskies.map((item) => path(item)).filter((value) => value !== null && value !== undefined && value !== ""))].sort((a, b) => String(a).localeCompare(String(b), "ko"));
}

function populateFilters() {
  const configs = {
    country: (item) => item.whisky?.country,
    region: (item) => item.whisky?.region,
    category: (item) => item.whisky?.category,
    status: (item) => item.bottle?.status,
    purchaseCountry: (item) => item.purchase?.place?.country,
  };
  Object.entries(configs).forEach(([key, getter]) => {
    const select = $(`[data-filter="${key}"]`);
    uniqueValues(getter).forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = key === "status" ? (labels.status[value] ?? value) : value;
      select.append(option);
    });
  });
}

function matches(item) {
  const query = state.search.trim().toLocaleLowerCase("ko");
  const searchable = [item.whisky?.nameKo, item.whisky?.name, item.whisky?.distillery].filter(Boolean).join(" ").toLocaleLowerCase("ko");
  if (query && !searchable.includes(query)) return false;
  const f = state.filters;
  if (f.country && item.whisky?.country !== f.country) return false;
  if (f.region && item.whisky?.region !== f.region) return false;
  if (f.category && item.whisky?.category !== f.category) return false;
  if (f.status && item.bottle?.status !== f.status) return false;
  if (f.purchaseCountry && item.purchase?.place?.country !== f.purchaseCountry) return false;
  if (f.purchaseType && (item.purchase?.purchaseType ?? "unknown") !== f.purchaseType) return false;
  if (f.peated && String(item.whisky?.peated ?? "unknown") !== f.peated) return false;
  return true;
}

function compareNullable(a, b, direction = 1) {
  const aMissing = a === null || a === undefined || a === "";
  const bMissing = b === null || b === undefined || b === "";
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return (a > b ? 1 : a < b ? -1 : 0) * direction;
}

function sortItems(items) {
  const sorters = {
    name: (a, b) => text(a.whisky?.nameKo || a.whisky?.name, "").localeCompare(text(b.whisky?.nameKo || b.whisky?.name, ""), "ko"),
    "purchase-desc": (a, b) => compareNullable(a.purchase?.date, b.purchase?.date, -1),
    "purchase-asc": (a, b) => compareNullable(a.purchase?.date, b.purchase?.date, 1),
    "price-desc": (a, b) => compareNullable(krwValue(a), krwValue(b), -1),
    "price-asc": (a, b) => compareNullable(krwValue(a), krwValue(b), 1),
    "abv-desc": (a, b) => compareNullable(a.whisky?.abv, b.whisky?.abv, -1),
    "abv-asc": (a, b) => compareNullable(a.whisky?.abv, b.whisky?.abv, 1),
    "rating-desc": (a, b) => compareNullable(a.personal?.rating, b.personal?.rating, -1),
  };
  return [...items].sort(sorters[state.sort] ?? sorters.name);
}

function cardMarkup(item) {
  const whisky = item.whisky ?? {};
  const location = [whisky.country, whisky.region].filter(Boolean).join(" · ");
  const facts = [location, whisky.category, whisky.age != null ? `${whisky.age}년` : null, whisky.abv != null ? `${whisky.abv}% ABV` : null, whisky.volumeMl != null ? `${whisky.volumeMl}ml` : null].filter(Boolean);
  return `
    <button class="whisky-card" type="button" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(whisky.nameKo || whisky.name)} 상세 보기">
      <div class="card-image">
        ${imageMarkup(item)}
        <span class="card-status"><i class="status-dot ${escapeHtml(item.bottle?.status)}"></i>${escapeHtml(labels.status[item.bottle?.status] ?? "상태 미상")}</span>
      </div>
      <div class="card-body">
        <p class="card-kicker">${escapeHtml(whisky.distillery)}</p>
        <h3>${escapeHtml(whisky.nameKo || whisky.name)}</h3>
        <p class="english-name">${escapeHtml(whisky.name)}</p>
        <div class="card-facts">${facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join("") || "<span>-</span>"}</div>
        <div class="card-footer">
          <div class="card-price"><span>구매가격</span><strong>${escapeHtml(displayPrice(item))}</strong></div>
          <div class="card-rating"><span>내 평점</span><strong>${stars(item.personal?.rating)}</strong></div>
        </div>
      </div>
    </button>`;
}

function render() {
  const items = sortItems(state.whiskies.filter(matches));
  $("#result-count").textContent = `${items.length.toLocaleString("ko-KR")} bottle${items.length === 1 ? "" : "s"}`;
  $("#card-grid").innerHTML = items.map(cardMarkup).join("");
  $("#empty-state").hidden = state.whiskies.length !== 0;
  $("#no-results").hidden = state.whiskies.length === 0 || items.length !== 0;
  $("#card-grid").hidden = items.length === 0;
  $$(".whisky-card").forEach((card) => card.addEventListener("click", () => openDetail(card.dataset.id)));
}

function detailRow(label, value, wide = false, raw = false) {
  return `<div${wide ? ' class="wide"' : ""}><dt>${escapeHtml(label)}</dt><dd>${raw ? value : escapeHtml(value)}</dd></div>`;
}

function detailSpec(label, value, raw = false) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${raw ? value : escapeHtml(value)}</dd></div>`;
}

function openDetail(id) {
  const item = state.whiskies.find((entry) => entry.id === id);
  if (!item) return;
  const w = item.whisky ?? {};
  const p = item.purchase ?? {};
  const place = p.place ?? {};
  const price = p.price ?? {};
  const b = item.bottle ?? {};
  const personal = item.personal ?? {};
  const peated = w.peated === true ? "예" : w.peated === false ? "아니오" : "-";
  const tags = Array.isArray(personal.tags) && personal.tags.length ? personal.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("") : "-";
  const kicker = [w.distillery, w.category].filter(Boolean).join(" / ");
  const status = labels.status[b.status] ?? "-";
  const statusMarkup = b.status
    ? `<span class="status-dot ${escapeHtml(b.status)}"></span>${escapeHtml(status)}`
    : escapeHtml(status);
  $("#detail-content").innerHTML = `
    <div class="detail-hero">
      <div class="detail-image">${imageMarkup(item)}</div>
      <div class="detail-summary">
        <p class="card-kicker">${escapeHtml(kicker)}</p>
        <h2 id="detail-title">${escapeHtml(w.nameKo || w.name)}</h2>
        <p class="english-name">${escapeHtml(w.name)}</p>
        ${personal.rating != null ? `<p class="detail-rating">${stars(personal.rating)}</p>` : ""}
        <dl class="detail-specs">
          ${detailSpec("TYPE", text(w.category))}${detailSpec("REGION", text(w.region))}
          ${detailSpec("AGE", w.age != null ? `${w.age}년` : "-")}${detailSpec("ABV", w.abv != null ? `${w.abv}%` : "-")}
          ${detailSpec("VOLUME", w.volumeMl != null ? `${w.volumeMl} ml` : "-")}${detailSpec("STATUS", statusMarkup, true)}
        </dl>
      </div>
    </div>
    <div class="detail-sections">
      <section class="detail-section"><h3>Whisky</h3><dl class="detail-list">
        ${detailRow("이름", text(w.name))}${detailRow("증류소", text(w.distillery))}${detailRow("국가", text(w.country))}${detailRow("캐스크", text(w.cask))}${detailRow("피니시", text(w.finish))}${detailRow("피트", peated)}
      </dl></section>
      <section class="detail-section"><h3>Purchase</h3><dl class="detail-list">
        ${detailRow("구매일", text(p.date))}${detailRow("구매 유형", labels.purchaseType[p.purchaseType] ?? "-")}${detailRow("구매처", text(place.name))}${detailRow("도시", text(place.city))}${detailRow("구매 국가", text(place.country))}${detailRow("현지 구매가격", formatMoney(price.amount, price.currency))}${detailRow("원화 환산가격", formatKrw(price.convertedKrw))}${detailRow("실제 원화 지출", formatKrw(price.paidKrw))}${detailRow("적용 환율", price.exchangeRate != null ? `${price.exchangeRate} (${text(price.exchangeRateDate)})` : "-", true)}
      </dl></section>
      <section class="detail-section"><h3>Bottle</h3><dl class="detail-list">
        ${detailRow("개봉일", text(b.openedDate))}${detailRow("남은 양", b.remainingPercent != null ? `${b.remainingPercent}%` : "-")}
      </dl></section>
      <section class="detail-section"><h3>Personal</h3><dl class="detail-list">
        ${detailRow("태그", tags, false, true)}${detailRow("메모", text(personal.memo), true)}
      </dl></section>
    </div>`;
  $("#detail-dialog").showModal();
}

function resetControls() {
  state.search = "";
  state.filters = {};
  $("#search-input").value = "";
  $$('[data-filter]').forEach((select) => { select.value = ""; });
  updateFilterCount();
  render();
}

function updateFilterCount() {
  const count = Object.values(state.filters).filter(Boolean).length;
  $("#filter-count").textContent = count;
  $("#filter-count").hidden = count === 0;
}

function bindEvents() {
  $("#search-input").addEventListener("input", (event) => { state.search = event.target.value; render(); });
  $("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; render(); });
  $("#filter-toggle").addEventListener("click", () => {
    const panel = $("#filter-panel");
    panel.hidden = !panel.hidden;
    $("#filter-toggle").setAttribute("aria-expanded", String(!panel.hidden));
  });
  $$('[data-filter]').forEach((select) => select.addEventListener("change", (event) => {
    state.filters[event.target.dataset.filter] = event.target.value;
    updateFilterCount();
    render();
  }));
  $("#reset-filters").addEventListener("click", () => {
    state.filters = {};
    $$('[data-filter]').forEach((select) => { select.value = ""; });
    updateFilterCount();
    render();
  });
  $("#reset-search").addEventListener("click", resetControls);
  $("#dialog-close").addEventListener("click", () => $("#detail-dialog").close());
  $("#detail-dialog").addEventListener("click", (event) => {
    if (event.target === $("#detail-dialog")) $("#detail-dialog").close();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#search-input").focus();
    }
  });
}

async function loadCollection() {
  try {
    const response = await fetch(assetUrl("data/whiskies.json"), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("The whisky data must be an array.");
    state.whiskies = data;
    updateStats();
    populateFilters();
    render();
    $("#as-of").textContent = `총 ${data.length.toLocaleString("ko-KR")}개의 기록`;
  } catch (error) {
    console.error("Failed to load whisky collection:", error);
    $("#error-state").hidden = false;
  } finally {
    $("#loading-state").hidden = true;
  }
}

bindEvents();
loadCollection();
