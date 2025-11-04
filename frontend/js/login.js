// /frontend/js/login.js

// ===== Helper alert
const alertBox = document.getElementById("alertBox");
function showError(msg){
  if(!alertBox) return;
  alertBox.textContent = msg;
  alertBox.classList.add("show");
}
function hideError(){
  if(!alertBox) return;
  alertBox.classList.remove("show");
  alertBox.textContent = "";
}

// ===== Autocompletar admin demo
const adminAccess = document.getElementById("adminAccess");
adminAccess?.addEventListener("click", (e)=>{
  e.preventDefault();
  const emailEl = document.getElementById("email");
  const passEl  = document.getElementById("password");
  if(emailEl) emailEl.value = "admin@honeysweeat.cl";
  if(passEl)  passEl.value  = "admin123";
});

// ===== Login contra backend
// Como sirves con express.static en el MISMO dominio, deja vacío:
const API_BASE = ""; 
// Si algún día abres el HTML desde otro origen, cambia a "http://localhost:4000"

const form = document.getElementById("loginForm");
form?.addEventListener("submit", async (event)=>{
  event.preventDefault();
  hideError();

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if(!email || !password){ showError("Completa correo y contraseña."); return; }

  try{
    const resp = await fetch(`${API_BASE}/api/auth/login`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, password })
    });

    if(!resp.ok){
      const err = await resp.json().catch(()=>({error:"Error desconocido"}));
      throw new Error(err.error || "Credenciales inválidas");
    }

    const data = await resp.json(); // { token, user:{id,name,email,role} }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("userRole", data.user?.role || "user");

    // Redirección por rol
    if(data.user?.role === "admin"){
      location.href = "F_Loging_Admin.html";
    }else{
      location.href = "Frontend.html";
    }
  }catch(e){
    showError(e.message || "No se pudo iniciar sesión");
  }
});
