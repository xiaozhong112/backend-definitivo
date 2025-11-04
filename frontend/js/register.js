// frontend/js/register.js
(() => {
  const alertBox = document.getElementById("alertBox");
  const showError = (msg) => { alertBox.textContent = msg; alertBox.classList.add("show"); };
  const hideError = () => { alertBox.classList.remove("show"); alertBox.textContent = ""; };

  // Si sirves el frontend con el mismo backend, deja vacío.
  const API_BASE = "";

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const name = document.getElementById("nameRegister").value.trim();
    const email = document.getElementById("emailRegister").value.trim();
    const pass = document.getElementById("passRegister").value;
    const confirm = document.getElementById("passConfirm").value;

    if (!name || !email || !pass || !confirm) {
      showError("Completa todos los campos.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) { showError("Correo inválido."); return; }

    if (pass.length < 6) { showError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (pass !== confirm) { showError("Las contraseñas no coinciden."); return; }

    try {
      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error || "No se pudo registrar");
      }

      const data = await resp.json(); // { token, user:{id,name,email,role} }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userRole", data.user?.role || "user");

      if (data.user?.role === "admin") {
        location.href = "F_Loging_Admin.html";
      } else {
        location.href = "Frontend.html";
      }
    } catch (e) {
      showError(e.message || "No se pudo registrar");
    }
  });
})();
