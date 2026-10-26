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
  
  const menuItemsEndpoint = "https://dnngesa.github.io/ReciTrak/db.json";
  const recipeEndpoint = "https://dnngesa.github.io/ReciTrak/db.json";

  // Function to Load Items
  async function loadMenuItems() {

    if (!menuTableBody) return;

    try {
      const response = await fetch(menuItemsEndpoint);
      if (!response.ok) throw new Error("Could not fetch menu items.");
      
      const items = await response.json();
      menuTableBody.innerHTML = ""; 

      if (items.length === 0) {
        menuTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No menu items found. Add one on the left!</td></tr>`;
        return;
      }

      
      items.forEach(item => {
        const displayImage = item.image ? item.image : "https://unsplash.com";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>
           <img src="${displayImage}" alt="${item.name}" class="rounded-circle shadow-sm border border-2 border-white" style="width: 45px; height: 45px; object-fit: cover;">
          </td>
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
      menuTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading database.</td></tr>`;
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
   window.actionPhoto = async function(id, name) {
    const imageUrl = prompt(`Paste an Image URL link from the web for "${name}":`);
    if (imageUrl === null || imageUrl.trim() === "") return;

    try {
      const response = await fetch(`${menuItemsEndpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl.trim() })
      });

      if (response.ok) {
        loadMenuItems(); 
      } else {
        throw new Error("Failed to upload photo link to local database.");
      }
    } catch (error) {
      console.error("Photo link error:", error);
      alert("Error linking image to database resource.");
    }
  };

  loadMenuItems();


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



 // INVENTORY 
  const inventoryForm = document.getElementById("inventoryForm");
  const inventoryTableBody = document.getElementById("inventoryTableBody");
  const inventoryFeedback = document.getElementById("inventoryFeedback");
  const inventoryEndpoint = "https://dnngesa.github.io/ReciTrak/db.json";

  // Fetch inventory 
  async function loadInventoryItems() {
    try {
      const response = await fetch(inventoryEndpoint);
      if (!response.ok) throw new Error("Could not retrieve inventory.");
      
      const data = await response.json();
      const stockItems = Array.isArray(data) ? data : (data.inventory || []);
      inventoryTableBody.innerHTML = ""; 

      if (stockItems.length === 0) {
        inventoryTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No inventory tracked yet!</td></tr>`;
        return;
      }

      // Loop through items
      stockItems.forEach(item => {
        const qty = parseFloat(item.quantity);
        const limit = parseFloat(item.minThreshold);
        
        // Low Inventory Alert!
        let statusBadge = `<span class="badge bg-success">Healthy Stock</span>`;
        if (qty <= limit) {
          statusBadge = `<span class="badge bg-danger animate-pulse">Low Stock Alert</span>`;
        }

        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="fw-bold">${item.name}</td>
          <td>${qty} <span class="text-muted small">${item.unit}</span></td>
          <td>${statusBadge}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="updateStockLevel('${item.id}', '${item.name}', ${qty})">ADJUST</button>
              <button class="btn btn-outline-danger" onclick="removeInventoryItem('${item.id}')">REMOVE</button>
            </div>
          </td>
        `;
        inventoryTableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Inventory Fetch Error:", error);
      inventoryTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading inventory ledger logs.</td></tr>`;
    }
  }

  // Form Submission 
  if (inventoryForm) {
    inventoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const newStock = {
        name: document.getElementById("invIngredientName").value,
        quantity: parseFloat(document.getElementById("invQuantity").value),
        unit: document.getElementById("invUnit").value,
        minThreshold: parseFloat(document.getElementById("invMinThreshold").value)
      };

      try {
        const response = await fetch(inventoryEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newStock)
        });

        if (response.ok) {
          inventoryFeedback.className = "mt-2 small text-success fw-bold";
          inventoryFeedback.textContent = "Inventory level logged successfully!";
          inventoryForm.reset();
          loadInventoryItems(); 
        }
      } catch (error) {
        console.error("Inventory Error:", error);
      }
    });
  }

  // Adjust Stock Count 
  window.updateStockLevel = async function(id, name, currentQty) {
    const newQty = prompt(`Enter new inventory balance for "${name}":`, currentQty);
    if (newQty === null || newQty === "" || isNaN(newQty)) return;

    try {
      const response = await fetch(`${inventoryEndpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseFloat(newQty) })
      });
      if (response.ok) loadInventoryItems();
    } catch (error) {
      console.error(error);
    }
  };

  // Delete Item
  window.removeInventoryItem = async function(id) {
    if (confirm("Stop tracking this inventory item line?")) {
      try {
        const response = await fetch(`${inventoryEndpoint}/${id}`, { method: "DELETE" });
        if (response.ok) loadInventoryItems();
      } catch (error) {
        console.error(error);
      }
    }
  };


  loadInventoryItems();


  // SUPPLY CHAIN
  const supplyForm = document.getElementById("supplyForm");
  const supplyTable = document.getElementById("supplyTableBody");
  const supplyFeedback = document.getElementById("supplyFeedback");
  const supplyEndpoint = "https://dnngesa.github.io/ReciTrak/db.json";

  // Function to pull procurement orders 
  async function loadSupplyOrders() {
    try {
      const response = await fetch(supplyEndpoint);
      if (!response.ok) throw new Error("Could not fetch supply chain logs.");
      
      const data = await response.json();
      const orders = Array.isArray(data) ? data : (data.supply || []);
      supplyTable.innerHTML = "";

      if (orders.length === 0) {
        supplyTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No active procurement logs found.</td></tr>`;
        return;
      }

      
      orders.forEach(order => {
        const cost = parseFloat(order.unitCost);
        const qty = parseFloat(order.quantity);
        const totalOrderValue = cost * qty; 

        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="fw-bold text-secondary">${order.vendor}</td>
          <td>${order.itemName}</td>
          <td>KES ${cost.toFixed(2)}</td>
          <td>${qty}</td>
          <td class="fw-bold text-success">KES ${totalOrderValue.toFixed(2)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" onclick="cancelProcurementOrder('${order.id}')">DELETE</button>
          </td>
        `;
        supplyTable.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      supplyTable.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error loading procurement systems database.</td></tr>`;
    }
  }

  // Procurement Form Submission
  if (supplyForm) {
    supplyForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const newOrder = {
        vendor: document.getElementById("vendorName").value,
        itemName: document.getElementById("supplyItem").value,
        unitCost: parseFloat(document.getElementById("supplyCost").value),
        quantity: parseInt(document.getElementById("orderQty").value)
      };

      try {
        const response = await fetch(supplyEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newOrder)
        });

        if (response.ok) {
          supplyFeedback.className = "mt-2 small text-success fw-bold";
          supplyFeedback.textContent = "Procurement order logged and calculated successfully!";
          supplyForm.reset();
          loadSupplyOrders();
        }
      } catch (error) {
        console.error("Procurement Database Post Error:", error);
      }
    });
  }

  // Cancel Order
  window.cancelProcurementOrder = async function(id) {
    if (confirm("Void this procurement item log line permanently?")) {
      try {
        const response = await fetch(`${supplyEndpoint}/${id}`, { method: "DELETE" });
        if (response.ok) loadSupplyOrders();
      } catch (error) {
        console.error(error);
      }
    }
  };

  
  loadSupplyOrders();
