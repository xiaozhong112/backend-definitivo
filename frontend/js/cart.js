// frontend/js/cart.js

const CURRENCY = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const PLACEHOLDER_IMG = "/img/placeholder_honey.jpg";

const els = {
  cartList: document.getElementById("cartList"),
  empty: document.getElementById("emptyState"),
  cartCount: document.getElementById("cartCount"),
  cartCountS: document.getElementById("cartCountS"),
  chkAll: document.getElementById("chkAll"),
  sumItems: document.getElementById("sumItems"),
  sumDiscount: document.getElementById("sumDiscount"),
  sumSubtotal: document.getElementById("sumSubtotal"),
  sumShipping: document.getElementById("sumShipping"),
  sumTotal: document.getElementById("sumTotal"),
  btnCheckout: document.getElementById("btnCheckout"),
};

function loadCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Para validar stock “real” al cargar (si no guardaste stock al agregar)
async function hydrateStock(item) {
  if (typeof item.maxStock === "number") return item; // ya hidratado
  try {
    const r = await fetch(`/api/productos/${item.productId}`);
    if (!r.ok) throw 0;
    const p = await r.json();
    let stock = 9999;
    if (Array.isArray(p.variants) && item.variantIndex >= 0 && p.variants[item.variantIndex]) {
      stock = Number(p.variants[item.variantIndex].stock ?? 0);
    }
    item.maxStock = stock;
  } catch {
    item.maxStock = 9999; // fallback
  }
  return item;
}

function itemLineHTML(item, index) {
  const vol = item.volumeMl ? ` · ${item.volumeMl} ml` : "";
  const title = `${item.name || "Producto"}${vol}`;
  const price = Number(item.price || 0);
  const img = item.imageUrl || PLACEHOLDER_IMG;
  const max = Math.max(0, Number(item.maxStock ?? 0));
  const disabled = max <= 0 ? "disabled" : "";
  const stockNote = max > 0 ? `Máx ${max} unidades` : "Sin stock";

  return `
    <div class="d-flex align-items-start mb-3" data-idx="${index}">
      <input class="form-check-input mt-3 me-2 item-check" type="checkbox" checked ${max<=0?"disabled":""}/>
      <img src="${img}" class="me-3 item-img" alt="${item.name||"Producto"}" onerror="this.src='${PLACEHOLDER_IMG}'"/>
      <div class="flex-grow-1">
        <h6 class="mb-1">${title}</h6>
        <small class="text-muted">${item.floralSource ? item.floralSource.toUpperCase() : ""} ${item.sku ? "· SKU: "+item.sku : ""}</small>
        <div class="d-flex align-items-center mt-3">
          <button class="btn-qty btn-minus" ${disabled} aria-label="Restar">-</button>
          <span class="qty-num mx-2">${item.qty}</span>
          <button class="btn-qty btn-plus" ${disabled} aria-label="Sumar">+</button>
        </div>
        <small class="text-muted">${stockNote}</small>
      </div>
      <div class="text-end ms-3">
        <p class="mb-1 fw-bold">${CURRENCY.format(price)}</p>
        <button class="btn btn-outline-danger btn-sm border-0 p-0 btn-del" title="Eliminar">
          <img src="/img/basurero.png" style="width:30px" alt="Eliminar"/>
        </button>
      </div>
    </div>
  `;
}

function recalcSummary() {
  const cart = loadCart();
  // Solo cuentan los seleccionados
  const lines = Array.from(els.cartList.querySelectorAll("[data-idx]"));
  let selectedQty = 0;
  let subtotal = 0;

  lines.forEach(line => {
    const idx = Number(line.getAttribute("data-idx"));
    const chk = line.querySelector(".item-check");
    if (!chk || !chk.checked) return;
    const item = cart[idx];
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 0);
    selectedQty += qty;
    subtotal += price * qty;
  });

  const discount = 0; // aquí podrías aplicar cupones o promos
  const shipping = subtotal > 0 ? 3500 : 0; // envío plan base (ajústalo)
  const total = Math.max(0, subtotal - discount) + shipping;

  els.sumItems.textContent = CURRENCY.format(subtotal);
  els.sumDiscount.textContent = "-" + CURRENCY.format(discount);
  els.sumSubtotal.textContent = CURRENCY.format(subtotal - discount);
  els.sumShipping.textContent = CURRENCY.format(shipping);
  els.sumTotal.textContent = CURRENCY.format(total);

  // Botón checkout
  const hasSelection = selectedQty > 0;
  els.btnCheckout.textContent = `Continuar (${selectedQty})`;
  if (hasSelection) {
    els.btnCheckout.classList.remove("disabled");
    els.btnCheckout.removeAttribute("aria-disabled");
  } else {
    els.btnCheckout.classList.add("disabled");
    els.btnCheckout.setAttribute("aria-disabled", "true");
  }
}

function updateHeaderCount(cart) {
  const totalLines = cart.length;
  els.cartCount.textContent = totalLines;
  els.cartCountS.textContent = totalLines === 1 ? "" : "s";
}

function attachLineEvents(lineEl) {
  const idx = Number(lineEl.getAttribute("data-idx"));
  const btnMinus = lineEl.querySelector(".btn-minus");
  const btnPlus = lineEl.querySelector(".btn-plus");
  const qtyNum = lineEl.querySelector(".qty-num");
  const chk = lineEl.querySelector(".item-check");
  const btnDel = lineEl.querySelector(".btn-del");

  btnMinus?.addEventListener("click", () => {
    const cart = loadCart();
    const item = cart[idx];
    if (!item) return;
    const max = Math.max(0, Number(item.maxStock ?? 0));
    let q = Number(item.qty || 1);
    q = Math.max(1, q - 1);
    item.qty = q;
    qtyNum.textContent = q;
    saveCart(cart);
    recalcSummary();
    // Si el user baja a 0, podrías preguntar y eliminar; aquí mantenemos mínimo 1
  });

  btnPlus?.addEventListener("click", () => {
    const cart = loadCart();
    const item = cart[idx];
    if (!item) return;
    const max = Math.max(0, Number(item.maxStock ?? 9999));
    let q = Number(item.qty || 1);
    if (q >= max) return; // no superar stock
    q = q + 1;
    item.qty = q;
    qtyNum.textContent = q;
    saveCart(cart);
    recalcSummary();
  });

  chk?.addEventListener("change", () => {
    // Si alguno se desmarca, quita "seleccionar todos"
    if (!chk.checked) els.chkAll.checked = false;
    recalcSummary();
  });

  btnDel?.addEventListener("click", () => {
    const cart = loadCart();
    cart.splice(idx, 1);
    saveCart(cart);
    render(); // re-render para reindexar
  });
}

function syncChkAll() {
  const checks = Array.from(els.cartList.querySelectorAll(".item-check"));
  if (checks.length === 0) {
    els.chkAll.checked = false;
    return;
  }
  els.chkAll.checked = checks.every(c => c.checked || c.disabled);
}

function bindChkAll() {
  els.chkAll.addEventListener("change", () => {
    const checks = Array.from(els.cartList.querySelectorAll(".item-check"));
    checks.forEach(c => { if (!c.disabled) c.checked = els.chkAll.checked; });
    recalcSummary();
  });
}

async function render() {
  let cart = loadCart();

  updateHeaderCount(cart);

  if (cart.length === 0) {
    els.cartList.innerHTML = "";
    els.empty.classList.remove("d-none");
    recalcSummary();
    return;
  }
  els.empty.classList.add("d-none");

  // Hidratar stock (una sola vez por ítem)
  await Promise.all(cart.map(async (it, i) => {
    const before = it.maxStock;
    await hydrateStock(it);
    // Si cambió, guardamos
    if (before !== it.maxStock) {
      const fresh = loadCart();
      fresh[i].maxStock = it.maxStock;
      saveCart(fresh);
    }
  }));

  // Releer cart luego de hidratar
  cart = loadCart();

  // Render
  els.cartList.innerHTML = cart.map((it, i) => itemLineHTML(it, i)).join("");
  // Eventos por línea
  Array.from(els.cartList.querySelectorAll("[data-idx]")).forEach(attachLineEvents);

  syncChkAll();
  recalcSummary();
}

// Init
bindChkAll();
render();
