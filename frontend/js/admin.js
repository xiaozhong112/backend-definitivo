// Verificar si el usuario realmente es ADMIN
(function validateAdmin(){
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("userRole");

  if (!token || role !== "admin") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminLoggedIn");
    location.href = "F_Loging.html";
  }
})();

// Manejo del sidebar: marcar el activo según <body data-page="">
const currentPage = document.body.dataset.page;
const navLinks = document.querySelectorAll(".sidebar .nav-link");

navLinks.forEach(link => {
  const linkPage = link.getAttribute("data-link");

  if (linkPage === currentPage) {
    link.classList.add("active");
  } else {
    link.classList.remove("active");
  }
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  localStorage.removeItem("adminLoggedIn");
  location.href = "F_Loging.html";
});
