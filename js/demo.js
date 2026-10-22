document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  const pages = document.querySelectorAll(".app-page");

  // PAGE SWITCHING
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

  const initialActiveLink = document.querySelector(".navbar-nav .nav-link.active") || document.querySelector(".navbar-nav .nav-link");
  if (initialActiveLink) {
    const defaultTarget = initialActiveLink.getAttribute("data-target");
    pages.forEach(page => {
      page.style.display = page.id === defaultTarget ? "block" : "none";
    });
  }

  // MENU ITEM DATABASE 
  const menuItemForm = document.getElementById("menuItemForm");
  const menuTableBody = document.getElementById("menuTableBody");
  const menuFeedback = document.getElementById("menuFeedback");
  
  const menuItemsEndpoint = "http://localhost:3001/menuItems";
  const recipeEndpoint = "http://localhost:3001/recipes";

  // Function to Load Items
  async function loadMenuItems() {
    try {
      const response = await fetch(menuItemsEndpoint);
      if (!response.ok) throw new Error("Could not fetch menu items.");
      
      const items = await response.json();
      menuTableBody.innerHTML = ""; 

      if (items.length === 0) {
        menuTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No menu items found. Add one on the left!</td></tr>`;
        return;
      }

      
      items.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="fw-bold dish-name-target">${item.name}</td>
          <td>KES ${parseFloat(item.price).toFixed(2)}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-outline-secondary" onclick="actionPhoto('${item.id}', '${item.name}')" title="Add Photo">Photo</button>
              <button class="btn btn-outline-secondary" onclick="actionRecipe('${item.id}')" title="Add Recipe">Recipe</button>
              <button class="btn btn-outline-primary" onclick="actionChangePrice('${item.id}', '${item.name}', ${item.price})" title="Change Price">Price</button>
              <button class="btn btn-outline-danger" onclick="actionRemoveItem('${item.id}')" title="Remove Item">Remove</button>
            </div>
          </td>
        `;
        menuTableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      menuTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error loading database.</td></tr>`;
    }
  }

  // Form Submission 
  if (menuItemForm) {
    menuItemForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const newItem = {
        name: document.getElementById("itemName").value,
        price: parseFloat(document.getElementById("itemPrice").value)
      };

      try {
        const response = await fetch(menuItemsEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem)
        });

        if (response.ok) {
          menuFeedback.className = "mt-2 small text-success fw-bold";
          menuFeedback.textContent = "Item saved successfully!";
          menuItemForm.reset();
          loadMenuItems(); 
        }
      } catch (error) {
        console.error("Item Saving Error:", error);
      }
    });
  }

  // Remove Item 
  window.actionRemoveItem = async function(id) {
    if (confirm("Are you sure you want to remove this dish?")) {
      try {
        const response = await fetch(`${menuItemsEndpoint}/${id}`, { method: "DELETE" });
        if (response.ok) {
          loadMenuItems(); 
        }
      } catch (error) {
        console.error("Delete Error:", error);
      }
    }
  };

  // Change Price 
  window.actionChangePrice = async function(id, name, currentPrice) {
    const newPrice = prompt(`Enter new price in KES for ${name}:`, currentPrice);
    if (newPrice === null || newPrice === "" || isNaN(newPrice)) return;

    try {
      const response = await fetch(`${menuItemsEndpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(newPrice) })
      });
      if (response.ok) {
        loadMenuItems();
      }
    } catch (error) {
      console.error("Price Update Error:", error);
    }
  };

  // Add Photo 
  window.actionPhoto = function(id, name) {
  alert(`Uploading "${name}" (ID: ${id}) photo!`);
};



  // RECIPE & INGREDIENT MANAGEMENT 
  const activeText = document.getElementById("activeRecipeDishName");
  const activeHiddenId = document.getElementById("activeRecipeItemId");
  const recipeIngredientForm = document.getElementById("recipeIngredientForm");
  const recipeTableBody = document.getElementById("recipeTableBody");

  window.actionRecipe = function(id) {
    const tableRows = menuTableBody.querySelectorAll("tr");
    let targetDishName = "Unknown Item";
    
    tableRows.forEach(row => {
      if (row.innerHTML.includes(`onclick="actionRecipe('${id}')"`)) {
        targetDishName = row.querySelector(".dish-name-target").innerText;
      }
    });

    if (activeText && activeHiddenId) {
      activeText.textContent = targetDishName;
      activeHiddenId.value = id;
    }

    // Load any existing ingredients 
    loadRecipeIngredients(id);

    // Page routing transition
    pages.forEach(page => {
      page.style.display = page.id === "recipes" ? "block" : "none";
    });

    navLinks.forEach(item => {
      if (item.getAttribute("data-target") === "recipes") {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  };

  // Load ingredients from recipes matching the menuItemId
  async function loadRecipeIngredients(itemId) {
    try {
      const response = await fetch(`${recipeEndpoint}?menuItemId=${itemId}`);
      if (!response.ok) throw new Error("Could not fetch ingredients.");
      
      const ingredients = await response.json();
      recipeTableBody.innerHTML = "";

      if (ingredients.length === 0) {
        recipeTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No ingredients added yet!</td></tr>`;
        return;
      }

      ingredients.forEach(ing => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${ing.name}</td>
          <td><span class="badge bg-success">${ing.quantity} ${ing.unit}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="removeIngredient('${ing.id}', '${itemId}')">REMOVE</button>
          </td>
        `;
        recipeTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      recipeTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error loading recipe data.</td></tr>`;
    }
  }

  // Ingredients form submissions 
  if (recipeIngredientForm) {
    recipeIngredientForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const currentItemId = activeHiddenId.value;
      if (!currentItemId) {
        alert("Please select a dish from Menu Items first!");
        return;
      }

      const newIngredient = {
        menuItemId: currentItemId, 
        name: document.getElementById("ingredientName").value,
        quantity: parseFloat(document.getElementById("ingredientQty").value),
        unit: document.getElementById("ingredientUnit").value
      };

      try {
        const response = await fetch(recipeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newIngredient)
        });

        if (response.ok) {
          recipeIngredientForm.reset();
          loadRecipeIngredients(currentItemId); 
        }
      } catch (error) {
        console.error("Save Ingredient Error:", error);
      }
    });
  }

  // Remove individual ingredients
  window.removeIngredient = async function(id, itemId) {
    try {
      const response = await fetch(`${recipeEndpoint}/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadRecipeIngredients(itemId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  loadMenuItems();
});
