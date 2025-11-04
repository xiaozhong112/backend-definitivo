// frontend/js/nav.js
const TOKEN = localStorage.getItem("token");
const USER  = JSON.parse(localStorage.getItem("user") || "null");
const ROLE  = localStorage.getItem("userRole");

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
    logoutBtn?.addEventListener("click", ()=> {
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
