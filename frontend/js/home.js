// frontend/js/home.js

const TOKEN = localStorage.getItem("token");
const USER  = JSON.parse(localStorage.getItem("user") || "null");
const ROLE  = localStorage.getItem("userRole"); // "admin" | "user" | null

const PLACEHOLDER_IMG = "/img/placeholder_honey.jpg";

(function setupNavbar(){
  const navAuthZone = document.getElementById("navAuthZone");
  const userMenu    = document.getElementById("userMenu");
  const userNameHdr = document.getElementById("userNameHdr");
  const adminPanel  = document.getElementById("adminPanelLink");
  const logoutBtn   = document.getElementById("logoutBtn");

  const isLogged = Boolean(TOKEN && USER);

  if (isLogged) {
    navAuthZone?.classList.add("d-none");
    userMenu?.classList.remove("d-none");
    if (userNameHdr) userNameHdr.textContent = USER.name || USER.email || "Mi cuenta";
    if (adminPanel) (ROLE === "admin") ? adminPanel.classList.remove("d-none") : adminPanel.classList.add("d-none");
    logoutBtn?.addEventListener("click", ()=>{
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("userLoggedIn");
      location.href = "Frontend.html";
    });
  } else {
    userMenu?.classList.add("d-none");
    navAuthZone?.classList.remove("d-none");
  }
})();

// ===== Productos =====
let allProducts = [];

async function fetchActiveProducts(){
  const r = await fetch("/api/productos");
  if(!r.ok) throw new Error("No se pudieron cargar los productos");
  return await r.json();
}

function getMinPrice(variants){
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const nums = variants.map(v => Number(v?.price)).filter(n => Number.isFinite(n) && n >= 0);
  if (nums.length === 0) return null;
  return Math.min(...nums);
}

// Render “Más vendidos” (primeros 6 o filtro)
function renderTop(products){
  const topRow = document.getElementById("topRow");
  if (!topRow) return;
  topRow.innerHTML = "";
  const subset = products.slice(0, 6);

  for(const p of subset){
    const img = p.imageUrl && p.imageUrl.trim() ? p.imageUrl : PLACEHOLDER_IMG;
    const minPrice = getMinPrice(p.variants);

    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

    col.innerHTML = `
      <div class="card card-prod h-100 cursor" data-open="${p._id || p.slug}">
        <div class="img-wrap">
          <img src="${img}" alt="${p.name || "Producto"}" onerror="this.src='${PLACEHOLDER_IMG}'">
        </div>
        <div class="card-body">
          <span class="badge badge-honey">${(p.floralSource || "multiflora").toUpperCase()}</span>
          <h6 class="mt-2 mb-1">${p.name || "-"}</h6>
          ${
            minPrice !== null
              ? `<div class="price">$${minPrice.toFixed(0)}</div>`
              : `<div class="text-muted small">Sin precio</div>`
          }
        </div>
      </div>
    `;

    topRow.appendChild(col);
  }

  // Click en tarjeta → abrir modal detalle
  topRow.querySelectorAll("[data-open]").forEach(card=>{
    card.addEventListener("click", ()=>{
      const idOrSlug = card.getAttribute("data-open");
      openProductModal(idOrSlug);
    });
  });
}

// Contadores por categoría
function updateCategoryCounters(products){
  const counts = { ulmo:0, quillay:0, multiflora:0, eucalipto:0, otras:0 };
  for(const p of products){
    const key = (p.floralSource || "multiflora").toLowerCase();
    if (counts.hasOwnProperty(key)) counts[key]++; else counts.otras++;
  }
  Object.keys(counts).forEach(k=>{
    const el = document.querySelector(`[data-count="${k}"]`);
    if (el) el.textContent = `${counts[k]} producto${counts[k]===1?"":"s"}`;
  });
}

// Filtro por categoría
function setupCategoryFilters(){
  const catsRow = document.getElementById("catsRow");
  if(!catsRow) return;
  catsRow.querySelectorAll(".cat-card").forEach(card=>{
    card.addEventListener("click", ()=>{
      const key = (card.getAttribute("data-filter") || "").toLowerCase();
      const filtered = allProducts.filter(p => (p.floralSource || "multiflora").toLowerCase() === key);
      renderTop(filtered.length ? filtered : allProducts);
      document.getElementById("topRow")?.scrollIntoView({ behavior:"smooth", block:"start" });
    });
  });
}

// ===== Modal Detalle + Carrito =====
let modal, pmTitle, pmImg, pmFloral, pmDesc, pmVariant, pmStockNote, pmQty, pmPrice, pmSku, pmAddBtn, pmMsg;

function ensureModalRefs(){
  if (modal) return;
  modal       = new bootstrap.Modal(document.getElementById("productModal"));
  pmTitle     = document.getElementById("pmTitle");
  pmImg       = document.getElementById("pmImg");
  pmFloral    = document.getElementById("pmFloral");
  pmDesc      = document.getElementById("pmDesc");
  pmVariant   = document.getElementById("pmVariant");
  pmStockNote = document.getElementById("pmStockNote");
  pmQty       = document.getElementById("pmQty");
  pmPrice     = document.getElementById("pmPrice");
  pmSku       = document.getElementById("pmSku");
  pmAddBtn    = document.getElementById("pmAddBtn");
  pmMsg       = document.getElementById("pmMsg");
}

async function openProductModal(idOrSlug){
  ensureModalRefs();
  pmMsg.style.display = "none"; pmMsg.textContent = "";

  const r = await fetch(`/api/productos/${idOrSlug}`);
  if(!r.ok){ console.error("No se pudo obtener producto"); return; }
  const p = await r.json();

  // Datos base
  pmTitle.textContent = p.name || "Producto";
  pmImg.src  = p.imageUrl || PLACEHOLDER_IMG;
  pmImg.onerror = () => { pmImg.src = PLACEHOLDER_IMG; };
  pmFloral.textContent = (p.floralSource || "multiflora").toUpperCase();
  pmDesc.textContent   = p.description || "—";

  // Variantes
  pmVariant.innerHTML = "";
  if (Array.isArray(p.variants) && p.variants.length){
    p.variants.forEach((v, idx)=>{
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = `${v.volumeMl} ml - $${Number(v.price||0).toFixed(0)}`;
      pmVariant.appendChild(opt);
    });
  } else {
    // sin variantes: ponemos una "falsa" por compatibilidad
    pmVariant.innerHTML = `<option value="-1">Única</option>`;
  }

  // Actualiza precio/stock/sku según variante seleccionada
  function updateVariantInfo(){
    const i = Number(pmVariant.value);
    const v = Array.isArray(p.variants) && i >=0 ? p.variants[i] : null;

    const stock = v?.stock ?? 0;
    const price = v ? Number(v.price||0) : 0;
    const sku   = v?.sku || "";

    pmPrice.textContent = `$${price.toFixed(0)}`;
    pmSku.textContent   = sku ? `SKU: ${sku}` : "";
    pmStockNote.textContent = `Stock disponible: ${stock}`;
    pmQty.value = "1";
    pmQty.min   = 1;
    pmQty.max   = Math.max(0, stock);
    pmQty.disabled = stock <= 0;
    pmAddBtn.disabled = stock <= 0;
  }

  pmVariant.onchange = updateVariantInfo;
  updateVariantInfo();

  // Agregar al carrito
  pmAddBtn.onclick = ()=>{
    const idx = Number(pmVariant.value);
    const v = Array.isArray(p.variants) && idx >= 0 ? p.variants[idx] : null;
    const qty = Number(pmQty.value || 1);

    const stock = v?.stock ?? 0;
    if (qty < 1) return;
    if (qty > stock) {
      pmMsg.textContent = "No hay stock suficiente.";
      pmMsg.style.color = "#b00020";
      pmMsg.style.display = "block";
      return;
    }

    // Estructura del item de carrito
    const item = {
      productId: p._id,
      name: p.name,
      imageUrl: p.imageUrl || PLACEHOLDER_IMG,
      floralSource: p.floralSource || "multiflora",
      variantIndex: idx,
      volumeMl: v?.volumeMl ?? null,
      price: v ? Number(v.price||0) : 0,
      sku: v?.sku || "",
      qty
    };

    saveToCart(item);

    pmMsg.textContent = "Agregado al carrito.";
    pmMsg.style.color = "#127c35";
    pmMsg.style.display = "block";
  };

  modal.show();
}

function saveToCart(item){
  const key = "cart";
  const cart = JSON.parse(localStorage.getItem(key) || "[]");

  // Merge si mismo product + variante
  const i = cart.findIndex(x =>
    x.productId === item.productId && x.variantIndex === item.variantIndex
  );
  if (i >= 0){
    cart[i].qty = Number(cart[i].qty || 0) + Number(item.qty || 0);
  } else {
    cart.push(item);
  }

  localStorage.setItem(key, JSON.stringify(cart));
}

// INIT
(async ()=>{
  try{
    allProducts = await fetchActiveProducts();
    updateCategoryCounters(allProducts);
    renderTop(allProducts);
    setupCategoryFilters();
  }catch(e){
    console.error(e);
  }
})();
