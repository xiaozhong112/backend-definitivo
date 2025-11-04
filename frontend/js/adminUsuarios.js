// frontend/js/adminUsuarios.js

const API_BASE = "";
const USERS_API = "/api/usuarios";
const TOKEN = localStorage.getItem("token");

// ====== GUARD ======
(function guard(){
  const role = localStorage.getItem("userRole");
  if(!TOKEN || role !== "admin"){
    location.href = "F_Loging.html";
  }
})();

// ====== UI ======
const alertOk  = document.getElementById("alertOk");
const alertErr = document.getElementById("alertErr");
const showOk = (m)=>{ if(!alertOk) return; alertOk.textContent=m; alertOk.classList.add("show"); setTimeout(()=>alertOk.classList.remove("show"),2500); };
const showErr= (m)=>{ if(!alertErr) return; alertErr.textContent=m; alertErr.classList.add("show"); setTimeout(()=>alertErr.classList.remove("show"),3500); };

// Elements
const userForm     = document.getElementById("userForm");
const editingIdEl  = document.getElementById("editingId");
const formTitle    = document.getElementById("formTitle");
const btnReset     = document.getElementById("btnReset");
const btnCancel    = document.getElementById("btnCancelEdit");
const usersBody    = document.getElementById("usersBody");
const btnReload    = document.getElementById("btnReload");
const btnToggleView= document.getElementById("btnToggleView");
const usersTitle   = document.getElementById("usersTitle");

const uName   = document.getElementById("uName");
const uEmail  = document.getElementById("uEmail");
const uPass   = document.getElementById("uPassword");
const uRole   = document.getElementById("uRole");
const uActive = document.getElementById("uActive");

// Estado de vista: "active" o "inactive"
let viewMode = "active";

// ====== HELPERS ======
function resetForm(){
  editingIdEl.value = "";
  formTitle.innerHTML = `<i class='bx bx-user-plus'></i> Nuevo usuario`;
  btnCancel.style.display = "none";
  userForm.reset();
  uActive.checked = true;
}

btnReset?.addEventListener("click", resetForm);
btnCancel?.addEventListener("click", ()=>{ resetForm(); showOk("Edición cancelada"); });

// ====== CARGA DE USUARIOS ======
async function fetchUsers(){
  const url = (viewMode === "active") ? `${USERS_API}` : `${USERS_API}/inactive`;
  const r = await fetch(url, { headers: { "Authorization": `Bearer ${TOKEN}` } });
  if(!r.ok) throw new Error("No se pudo cargar usuarios");
  return await r.json();
}

async function loadUsers(){
  try{
    usersBody.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;
    const list = await fetchUsers();

    if(viewMode === "active"){
      usersTitle.innerHTML = `<i class='bx bx-list-ul'></i> Usuarios (activos)`;
      btnToggleView.innerHTML = `<i class='bx bx-hide'></i> Ver inactivos`;
    }else{
      usersTitle.innerHTML = `<i class='bx bx-list-ul'></i> Usuarios inactivos`;
      btnToggleView.innerHTML = `<i class='bx bx-show'></i> Ver activos`;
    }

    renderUsers(list);
  }catch(e){
    usersBody.innerHTML = `<tr><td colspan="5">Error al cargar</td></tr>`;
    showErr(e.message || "Error al cargar usuarios");
  }
}

function renderUsers(list){
  usersBody.innerHTML = "";
  if(!Array.isArray(list) || list.length === 0){
    usersBody.innerHTML = `<tr><td colspan="5">Sin usuarios para esta vista</td></tr>`;
    return;
  }

  for(const u of list){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name ?? "-"}</td>
      <td>${u.email ?? "-"}</td>
      <td>${u.role ?? "-"}</td>
      <td>${u.isActive ? "Activo" : "Inactivo"}</td>
      <td class="actions-col">
        <button class="btn btn-sm btn-outline-primary small icon" data-edit="${u._id}">
          <i class='bx bx-edit'></i> Editar
        </button>
        <button class="btn btn-sm btn-outline-warning small icon" data-toggle="${u._id}">
          <i class='bx bx-power-off'></i> Toggle
        </button>
        <button class="btn btn-sm danger small icon" data-delete="${u._id}">
          <i class='bx bx-trash'></i> Eliminar
        </button>
      </td>
    `;
    usersBody.appendChild(tr);
  }

  usersBody.querySelectorAll("[data-edit]").forEach(b => {
    b.addEventListener("click", ()=> startEdit(b.getAttribute("data-edit")));
  });
  usersBody.querySelectorAll("[data-toggle]").forEach(b => {
    b.addEventListener("click", ()=> toggleUser(b.getAttribute("data-toggle")));
  });
  usersBody.querySelectorAll("[data-delete]").forEach(b => {
    b.addEventListener("click", ()=> deleteUser(b.getAttribute("data-delete")));
  });
}

// ====== CRUD ======
userForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();

  const id = editingIdEl.value;
  const payload = {
    name: uName.value.trim(),
    email: uEmail.value.trim(),
    role: uRole.value,
    isActive: !!uActive.checked,
  };
  const pass = uPass.value.trim();
  if(pass) payload.password = pass;

  if(!payload.name){ return showErr("El nombre es obligatorio"); }
  if(!payload.email){ return showErr("El email es obligatorio"); }

  try{
    let r;
    if(id){
      r = await fetch(`${USERS_API}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type":"application/json",
          "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
      });
    }else{
      r = await fetch(`${USERS_API}`, {
        method: "POST",
        headers: {
          "Content-Type":"application/json",
          "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify(payload)
      });
    }

    if(!r.ok){
      const err = await r.json().catch(()=>({error:"Error"}));
      throw new Error(err.error || "No se pudo guardar");
    }

    resetForm();
    showOk(id ? "Usuario actualizado" : "Usuario creado");
    await loadUsers();
  }catch(e){
    showErr(e.message);
  }
});

async function startEdit(id){
  try{
    const r = await fetch(`${USERS_API}/${id}`, {
      headers: { "Authorization": `Bearer ${TOKEN}` }
    });
    if(!r.ok) throw new Error("No se pudo obtener el usuario");
    const u = await r.json();

    formTitle.innerHTML = `<i class='bx bx-edit'></i> Editar usuario`;
    btnCancel.style.display = "inline-block";
    editingIdEl.value = id;

    uName.value   = u.name || "";
    uEmail.value  = u.email || "";
    uPass.value   = ""; // no se muestra por seguridad
    uRole.value   = u.role || "user";
    uActive.checked = !!u.isActive;

    window.scrollTo({ top: 0, behavior: "smooth" });
  }catch(e){
    showErr(e.message);
  }
}

async function toggleUser(id){
  try{
    const r = await fetch(`${USERS_API}/${id}/toggle`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${TOKEN}` }
    });
    if(!r.ok){
      const err = await r.json().catch(()=>({error:"Error"}));
      throw new Error(err.error || "No se pudo cambiar el estado");
    }
    showOk("Estado actualizado");
    await loadUsers();
  }catch(e){
    showErr(e.message);
  }
}

async function deleteUser(id){
  const ok = confirm("¿Eliminar este usuario de forma permanente?");
  if(!ok) return;
  try{
    const r = await fetch(`${USERS_API}/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${TOKEN}` }
    });
    if(!r.ok){
      const err = await r.json().catch(()=>({error:"Error"}));
      throw new Error(err.error || "No se pudo eliminar");
    }
    showOk("Usuario eliminado");
    await loadUsers();
  }catch(e){
    showErr(e.message);
  }
}

// Header actions
btnReload?.addEventListener("click", loadUsers);
btnToggleView?.addEventListener("click", ()=>{
  viewMode = (viewMode === "active") ? "inactive" : "active";
  loadUsers();
});

// Init
loadUsers();
