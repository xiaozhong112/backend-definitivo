// frontend/js/gestionProducto.js

// ========= CONFIG =========
const API_BASE = ""; // mismo origen (sirves con express.static)
const TOKEN = localStorage.getItem("token");
const USER = JSON.parse(localStorage.getItem("user") || "null");

// ========= GUARD DE ADMIN =========
(function adminGuard(){
  const role = localStorage.getItem("userRole");
  if(!TOKEN || role !== "admin"){
    location.href = "F_Loging.html";
  }
})();

// ========= UI HELPERS =========
const alertOk  = document.getElementById("alertOk");
const alertErr = document.getElementById("alertErr");

function showOk(msg){
  if(!alertOk) return;
  alertOk.textContent = msg;
  alertOk.classList.add("show");
  setTimeout(()=>alertOk.classList.remove("show"), 2500);
}
function showErr(msg){
  if(!alertErr) return;
  alertErr.textContent = msg;
  alertErr.classList.add("show");
  setTimeout(()=>alertErr.classList.remove("show"), 3500);
}

// ========= ELEMENTOS =========
const productsBody  = document.getElementById("productsBody");
const productForm   = document.getElementById("productForm");
const btnReload     = document.getElementById("btnReload");
const btnReset      = document.getElementById("btnReset");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const btnAddVar     = document.getElementById("btnAddVar");
const btnToggleView = document.getElementById("btnToggleView");
const productsTitle = document.getElementById("productsTitle");
const formTitle     = document.getElementById("formTitle");
const editingIdEl   = document.getElementById("editingId");
const variantsGrid  = document.getElementById("variantsGrid");

// Campos form
const nameEl         = document.getElementById("name");
const floralSourceEl = document.getElementById("floralSource");
const descEl         = document.getElementById("description");
const imageEl        = document.getElementById("imageUrl");
const isActiveEl     = document.getElementById("isActive");

// ========= ESTADO DE VISTA =========
// "active" -> muestra activos
// "inactive" -> muestra inactivos
let viewMode = "active";

// ========= VARIANTES DINÁMICAS =========
function addVariantRow(v = { volumeMl:"", price:"", stock:"", sku:"" }){
  const row = document.createElement("div");
  row.className = "variant-row";

  row.innerHTML = `
    <input type="number" min="0" placeholder="Volumen (ml)" value="${v.volumeMl ?? ""}" class="v-volume"/>
    <input type="number" min="0" placeholder="Precio" value="${v.price ?? ""}" class="v-price"/>
    <input type="number" min="0" placeholder="Stock" value="${v.stock ?? ""}" class="v-stock"/>
    <input type="text" placeholder="SKU" value="${v.sku ?? ""}" class="v-sku"/>
    <div class="variant-actions">
      <button type="button" class="btn small danger btnDelVar"><i class='bx bx-trash'></i></button>
    </div>
  `;
  variantsGrid.appendChild(row);

  row.querySelector(".btnDelVar").addEventListener("click", ()=> row.remove());
}

btnAddVar?.addEventListener("click", ()=> addVariantRow());
// fila inicial
addVariantRow();

// ========= FETCH RESILIENTE =========
// Intenta traer "todos" (activos + inactivos) si el backend lo soporta.
// Orden: /api/productos/all  -> /api/productos?all=true  -> fallback /api/productos (solo activos)
async function fetchAllProductsTry() {
  // 1) /all (requiere auth admin)
  try{
    const r1 = await fetch(`${API_BASE}/api/productos/all`, {
      headers: { "Authorization": `Bearer ${TOKEN}` }
    });
    if (r1.ok) return await r1.json();
  }catch{}

  // 2) ?all=true (requiere auth admin)
  try{
    const r2 = await fetch(`${API_BASE}/api/productos?all=true`, {
      headers: { "Authorization": `Bearer ${TOKEN}` }
    });
    if (r2.ok) return await r2.json();
  }catch{}

  // 3) fallback: públicos (solo activos)
  const r3 = await fetch(`${API_BASE}/api/productos`);
  if (!r3.ok) throw new Error("No se pudieron cargar productos");
  return await r3.json();
}

// ========= CARGAR Y RENDER =========
async function loadProducts(){
  try{
    productsBody.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

    // Trae lo que haya disponible (todos si es posible, sino activos)
    const allList = await fetchAllProductsTry();

    // Si el endpoint solo devolvió activos, entonces "inactive" quedará vacío (es correcto)
    let list = Array.isArray(allList) ? allList : [];

    if (viewMode === "active") {
      list = list.filter(p => p.isActive === true);
      productsTitle && (productsTitle.innerHTML = `<i class='bx bx-list-ul'></i> Productos (solo activos)`);
      btnToggleView && (btnToggleView.innerHTML = `<i class='bx bx-hide'></i> Ver inactivos`);
    } else if (viewMode === "inactive") {
      // Si solo llegan activos (fallback), esto mostrará vacío (hasta que implementes /all en el backend)
      list = list.filter(p => p.isActive === false);
      productsTitle && (productsTitle.innerHTML = `<i class='bx bx-list-ul'></i> Productos inactivos`);
      btnToggleView && (btnToggleView.innerHTML = `<i class='bx bx-show'></i> Ver activos`);
    }

    renderProducts(list);
  }catch(e){
    productsBody.innerHTML = `<tr><td colspan="5">Error al cargar</td></tr>`;
    showErr(e.message || "No se pudieron cargar los productos");
  }
}

function renderProducts(list){
  productsBody.innerHTML = "";
  if(!Array.isArray(list) || list.length === 0){
    productsBody.innerHTML = `<tr><td colspan="5">Sin productos para esta vista</td></tr>`;
    return;
  }

  for(const p of list){
    const tr = document.createElement("tr");
    const variantsCount = Array.isArray(p.variants) ? p.variants.length : 0;

    tr.innerHTML = `
      <td>${p.name ?? "-"}</td>
      <td>${p.floralSource ?? "-"}</td>
      <td>${variantsCount}</td>
      <td>${p.isActive ? "Activo" : "Inactivo"}</td>
      <td class="actions-col">
        <button class="btn small icon" data-edit="${p._id}">
          <i class='bx bx-edit'></i> Editar
        </button>
        <button class="btn small icon" data-toggle="${p._id}">
          <i class='bx bx-power-off'></i> Toggle
        </button>
        <button class="btn small danger icon" data-delete="${p._id}">
          <i class='bx bx-trash'></i> Eliminar
        </button>
      </td>
    `;
    productsBody.appendChild(tr);
  }

  // acciones
  productsBody.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.addEventListener("click", ()=> startEdit(btn.getAttribute("data-edit")));
  });
  productsBody.querySelectorAll("[data-toggle]").forEach(btn=>{
    btn.addEventListener("click", ()=> toggleProduct(btn.getAttribute("data-toggle")));
  });
  productsBody.querySelectorAll("[data-delete]").forEach(btn=>{
    btn.addEventListener("click", ()=> deleteProduct(btn.getAttribute("data-delete")));
  });
}

// ========= DETALLE (prefill usando lista) =========
async function fetchProductByIdFromList(id){
  // intenta usar la misma estrategia que loadProducts para obtener la lista más completa posible
  const allList = await fetchAllProductsTry();
  return Array.isArray(allList) ? allList.find(x => x._id === id) : null;
}

// ========= TOGGLE ACTIVO/INACTIVO =========
async function toggleProduct(id){
  try{
    const resp = await fetch(`${API_BASE}/api/productos/${id}/toggle`,{
      method:"PATCH",
      headers:{ "Authorization": `Bearer ${TOKEN}` }
    });
    if(!resp.ok){
      const err = await resp.json().catch(()=>({error:"Error"}));
      throw new Error(err.error || "No se pudo cambiar el estado");
    }
    showOk("Estado actualizado");
    await loadProducts(); // respeta viewMode actual
  }catch(e){
    showErr(e.message);
  }
}

// ========= ELIMINAR PRODUCTO =========
async function deleteProduct(id){
  const ok = confirm("¿Eliminar este producto de forma permanente?");
  if(!ok) return;

  try{
    const resp = await fetch(`${API_BASE}/api/productos/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${TOKEN}` }
    });
    if(!resp.ok){
      const err = await resp.json().catch(()=>({error:"Error"}));
      throw new Error(err.error || "No se pudo eliminar");
    }
    showOk("Producto eliminado");
    await loadProducts(); // respeta viewMode actual
  }catch(e){
    showErr(e.message);
  }
}

// ========= EDITAR (prefill en el form) =========
async function startEdit(id){
  try{
    const p = await fetchProductByIdFromList(id);
    if(!p){ showErr("No encontrado"); return; }

    formTitle.innerHTML = `<i class='bx bx-edit'></i> Editar producto`;
    btnCancelEdit.classList.remove("hidden");
    editingIdEl.value = id;

    nameEl.value         = p.name ?? "";
    floralSourceEl.value = p.floralSource ?? "multiflora";
    descEl.value         = p.description ?? "";
    imageEl.value        = p.imageUrl ?? "";
    isActiveEl.checked   = !!p.isActive;

    // variantes
    variantsGrid.innerHTML = "";
    if(Array.isArray(p.variants) && p.variants.length){
      for(const v of p.variants){
        addVariantRow({
          volumeMl: v.volumeMl ?? "",
          price:    v.price ?? "",
          stock:    v.stock ?? "",
          sku:      v.sku ?? ""
        });
      }
    }else{
      addVariantRow();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }catch(e){
    showErr(e.message || "Error al preparar edición");
  }
}

btnCancelEdit?.addEventListener("click", ()=>{
  resetForm();
  showOk("Edición cancelada");
});

// ========= RESET FORM =========
btnReset?.addEventListener("click", resetForm);
function resetForm(){
  editingIdEl.value = "";
  formTitle.innerHTML = `<i class='bx bx-plus-circle'></i> Nuevo producto`;
  btnCancelEdit.classList.add("hidden");

  nameEl.value = "";
  floralSourceEl.value = "multiflora";
  descEl.value = "";
  imageEl.value = "";
  isActiveEl.checked = true;

  variantsGrid.innerHTML = "";
  addVariantRow();
}

// ========= RECOGER VARIANTES DEL FORM =========
function getVariantsFromForm(){
  const rows = Array.from(variantsGrid.querySelectorAll(".variant-row"));
  const variants = [];
  for(const r of rows){
    const volume = Number(r.querySelector(".v-volume")?.value || 0);
    const price  = Number(r.querySelector(".v-price")?.value || 0);
    const stock  = Number(r.querySelector(".v-stock")?.value || 0);
    const sku    = (r.querySelector(".v-sku")?.value || "").trim();

    if(!volume || !price){
      // saltar filas vacías
      continue;
    }
    variants.push({ volumeMl: volume, price, stock, sku });
  }
  return variants;
}

// ========= SUBMIT (CREAR / EDITAR) =========
productForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();

  const name         = nameEl.value.trim();
  const floralSource = floralSourceEl.value;
  const description  = descEl.value.trim();
  const imageUrl     = imageEl.value.trim();
  const isActive     = isActiveEl.checked;
  const variants     = getVariantsFromForm();

  if(!name){ showErr("El nombre es obligatorio"); return; }
  if(!variants.length){ showErr("Agrega al menos una variante con volumen y precio"); return; }

  const payload = { name, floralSource, description, imageUrl, isActive, variants };

  try{
    const id = editingIdEl.value;
    let resp;

    if(id){
      // editar
      resp = await fetch(`${API_BASE}/api/productos/${id}`,{
        method:"PUT",
        headers:{
          "Content-Type":"application/json",
          "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
      });
    }else{
      // crear
      resp = await fetch(`${API_BASE}/api/productos`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
      });
    }

    if(!resp.ok){
      const err = await resp.json().catch(()=>({error:"Error"}));
      throw new Error(err.error || "No se pudo guardar");
    }

    resetForm();
    showOk(id ? "Producto actualizado" : "Producto creado");
    await loadProducts(); // respeta viewMode actual

  }catch(e){
    showErr(e.message);
  }
});

// ========= EVENTOS DE CABECERA =========
btnReload?.addEventListener("click", loadProducts);

btnToggleView?.addEventListener("click", ()=>{
  viewMode = (viewMode === "active") ? "inactive" : "active";
  loadProducts();
});

// ========= INIT =========
loadProducts();
