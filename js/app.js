document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  const pages = document.querySelectorAll(".app-page");

  // PAGE SWITCHING LOGIC 
  navLinks.forEach(link => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); 

      const targetId = link.getAttribute("data-target");
      if (!targetId) return; 

      navLinks.forEach(item => item.classList.remove("active"));
      link.classList.add("active");

      pages.forEach(page => {
        if (page.id === targetId) {
          page.style.display = "block";
        } else {
          page.style.display = "none";
        }
      });
    });
  });

  // Automatically show the default active page on initial load
  const initialActiveLink = document.querySelector(".navbar-nav .nav-link.active") || document.querySelector(".navbar-nav .nav-link");
  if (initialActiveLink) {
    const defaultTarget = initialActiveLink.getAttribute("data-target");
    pages.forEach(page => {
      page.style.display = page.id === defaultTarget ? "block" : "none";
    });
  }


  // DATABASE INPUT FORM LOGIC 
  const demoForm = document.getElementById("demoForm");
  const formFeedback = document.getElementById("formFeedback");

  if (demoForm) {
    demoForm.addEventListener("submit", async (event) => {
      event.preventDefault(); 

      const leadData = {
        name: document.getElementById("fullName").value,
        phone: document.getElementById("phoneNumber").value,
        email: document.getElementById("emailAddress").value,
        organization: document.getElementById("organization").value,
        createdAt: new Date().toISOString()
      };

      try {
        const response = await fetch("https://github.io", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(leadData)
        });

        if (response.ok) {
          pages.forEach(page => {
            page.style.display = page.id === "demo" ? "block" : "none";
          });

          navLinks.forEach(item => {
            if (item.getAttribute("data-target") === "demo") {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });

          // Successful Registration Messaging
          formFeedback.className = "mt-3 small text-success fw-bold";
          formFeedback.textContent = "Registration Successful! Thank you for your interest.";
          
          demoForm.reset(); 
        } 
          
      } catch (error) {
        formFeedback.className = "mt-3 small text-danger fw-bold";
        formFeedback.textContent = "Oops! Something went wrong connecting to the database server.";
        console.error("Error:", error);
      }
    });
  }
});
