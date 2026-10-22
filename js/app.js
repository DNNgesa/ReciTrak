document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  const pages = document.querySelectorAll(".app-page");

  navLinks.forEach(link => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // Stop page jumping behavior

      const targetId = link.getAttribute("data-target");
      if (!targetId) return; // Ignore links without data-targets

      // Switch active styling on navigation tabs
      navLinks.forEach(item => item.classList.remove("active"));
      link.classList.add("active");

      // Display the active page and hide others
      pages.forEach(page => {
        if (page.id === targetId) {
          page.style.display = "block";
        } else {
          page.style.display = "none";
        }
      });
    });
  });
});

// https://api.api-ninjas.com/v1/nutrition (Returns calories for food items)

