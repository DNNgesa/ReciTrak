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
  
const menuItemsEndpoint = "https://DNNgesa.github.io/ReciTrak/db.json";
const recipeEndpoint = "https://DNNgesa.github.io/ReciTrak/db.json";

  // const menuItemsEndpoint = "http://localhost:3000/menuItems";
  // const recipeEndpoint = "http://localhost:3000/recipes";

  // Function to Load Items
  async function loadMenuItems() {

    if (!menuTableBody) return;

    try {
      const response = await fetch(menuItemsEndpoint);
      if (!response.ok) throw new Error("Could not fetch menu items.");
      
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.menuItems || []);
      menuTableBody.innerHTML = ""; 

            // Search 'Filter' Process
      const menuSearchInput = document.getElementById("menuSearchInput");
      let searchTerm = menuSearchInput ? menuSearchInput.value.trim() : "";
      
      let filteredItems = items;
      if (searchTerm !== "") {
        filteredItems = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filteredItems.length === 0) {
        menuTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No matching items found.</td></tr>`;
        return;
      }
      

      filteredItems.forEach(item => {
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

  // Search Function
  const menuSearchForm = document.getElementById("menuSearchForm");
  const menuSearchInput = document.getElementById("menuSearchInput");

  if (menuSearchForm && menuSearchInput) {
    // Triggers search filtering when user hits enter 
    menuSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      loadMenuItems();
    });

    // Real-time responsive filter action
    menuSearchInput.addEventListener("input", () => {
      loadMenuItems();
    });
  }

  // RECIPE & INGREDIENT MANAGEMENT 
  const activeText = document.getElementById("activeRecipeDishName");
  const activeHiddenId = document.getElementById("activeRecipeItemId");
  const recipeIngredientForm = document.getElementById("recipeIngredientForm");
  const recipeTableBody = document.getElementById("recipeTableBody");

  window.actionRecipe = async function(id) {
    if (!activeText || !activeHiddenId) return;

    activeHiddenId.value = id;
    
    const yieldDisplay = document.getElementById("activeRecipeYieldDisplay");
    const yieldBlock = document.getElementById("recipeYieldConfigBlock");
    const masterYieldInput = document.getElementById("recipeServingsMaster");

    try {
      const response = await fetch(`${menuItemsEndpoint}/${id}`);
      if (!response.ok) throw new Error("Could not find dish properties.");
      const currentDish = await response.json();

      activeText.textContent = currentDish.name;

      const masterYieldValue = currentDish.recipeYield || 1;
      if (yieldDisplay && yieldBlock && masterYieldInput) {
        yieldDisplay.textContent = `(Yield: ${masterYieldValue} Portions)`;
        masterYieldInput.value = masterYieldValue;
        yieldBlock.style.setProperty("display", "flex", "important"); 
      }

      // Load matching formula ingredients
      loadRecipeIngredients(id);

      pages.forEach(page => page.style.display = page.id === "recipes" ? "block" : "none");
      navLinks.forEach(item => {
        if (item.getAttribute("data-target") === "recipes") item.classList.add("active");
        else item.classList.remove("active");
      });

    } catch (error) {
      console.error("Action Recipe Error:", error);
      activeText.textContent = "Error loading dish target.";
    }
  };

  window.updateActiveRecipeYield = async function() {
    const currentItemId = activeHiddenId.value;
    if (!currentItemId) return;

    const masterYieldInput = document.getElementById("recipeServingsMaster");
    const yieldDisplay = document.getElementById("activeRecipeYieldDisplay");
    const newYield = parseInt(masterYieldInput.value) || 1;

    try {
      const response = await fetch(`${menuItemsEndpoint}/${currentItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeYield: newYield })
      });

      if (response.ok) {
        if (yieldDisplay) yieldDisplay.textContent = `(Yield: ${newYield} Portions)`;
        alert("Recipe batch yield configured successfully!");
      }
    } catch (error) {
      console.error("Yield Save Error:", error);
    }
  };

  // Food Cost Calculation Engine 
  async function loadRecipeIngredients(itemId) {
    try {
      // Fetch both ingredients and vendor price lists 
      const [ingredientsRes, vendorsRes, menuRes] = await Promise.all([
        fetch(`${recipeEndpoint}?menuItemId=${itemId}`),
        // fetch("http://localhost:3000/vendors"),
        fetch("https://DNNgesa.github.io/ReciTrak/db.json"),
        fetch(`${menuItemsEndpoint}/${itemId}`)
      ]);

      if (!ingredientsRes.ok || !vendorsRes.ok || !menuRes.ok) throw new Error("Database fetch error.");
      
      const ingredients = await ingredientsRes.json();
      const vendors = await vendorsRes.json();
      const currentDish = await menuRes.json();

      recipeTableBody.innerHTML = "";

      if (ingredients.length === 0) {
        recipeTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No ingredients added yet!</td></tr>`;
        return;
      }

      let totalRecipeCost = 0;

      ingredients.forEach(ing => {
        const displayBrand = ing.brand ? ing.brand : "Generic";
        let itemizedCost = 0;
        let costLabel = `<span class="text-muted small">No vendor contract match</span>`;

          const matchedVendorContract = vendors.find(vnd => {
          const contractItem = (vnd.itemName || "").toLowerCase().trim();
          const contractVendor = (vnd.vendorName || "").toLowerCase().trim();
          
          const recipeItem = (ing.name || "").toLowerCase().trim();
          const recipeBrand = (displayBrand || "").toLowerCase().trim();

          // Returns true if names overlap 
          const itemsMatch = contractItem.includes(recipeItem) || recipeItem.includes(contractItem);
          
          const brandsMatch = recipeBrand === "generic" || contractVendor.includes(recipeBrand) || recipeBrand.includes(contractVendor);

          return itemsMatch && brandsMatch;
        });



        if (matchedVendorContract) {
          const packQty = parseFloat(matchedVendorContract.packQuantity) || 1;
          const contractCost = parseFloat(matchedVendorContract.unitCost) || 0;
          
          // Cost per single base unit 
          const costPerUnit = contractCost / packQty;
          
          // Total cost for this recipe's required quantity amount
          itemizedCost = costPerUnit * parseFloat(ing.quantity);
          totalRecipeCost += itemizedCost;
          
          costLabel = `<span class="fw-semibold text-dark">KES ${itemizedCost.toFixed(2)}</span>`;
        }

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>
            <div class="fw-bold text-dark">${ing.name}</div>
            <div class="text-muted small">Brand: ${displayBrand}</div>
          </td>
          <td><span class="badge bg-light text-dark border">${ing.quantity} ${ing.unit}</span></td>
          <td>${costLabel}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="editRecipeIngredient('${ing.id}', '${ing.menuItemId}', '${ing.name}', '${displayBrand}', ${ing.quantity}, '${ing.unit}')">Adjust</button>
              <button class="btn btn-sm btn-outline-danger" onclick="removeIngredient('${ing.id}', '${itemId}')">Remove</button>
            </div>
          </td>
        `;
        recipeTableBody.appendChild(row);
      });

      // Compute Cost per Portion
      const dishYieldCount = currentDish.recipeYield || 1;
      const costPerPortion = totalRecipeCost / dishYieldCount;

      const batchCostRow = document.createElement("tr");
      batchCostRow.className = "table-light border-top border-2";
      batchCostRow.innerHTML = `
        <td colspan="2" class="fw-bold text-end">Total Batch Cost:</td>
        <td colspan="2" class="fw-bold text-dark">KES ${totalRecipeCost.toFixed(2)}</td>
      `;
      recipeTableBody.appendChild(batchCostRow);

      const portionCostRow = document.createElement("tr");
      portionCostRow.className = "table-success border-top";
      portionCostRow.innerHTML = `
        <td colspan="2" class="fw-bold text-end">Plate Cost per Serving:</td>
        <td colspan="2" class="fw-bold text-success">KES ${costPerPortion.toFixed(2)}</td>
      `;
      recipeTableBody.appendChild(portionCostRow);

    } catch (error) {
      console.error("Food Cost Engine Mismatch Error:", error);
      recipeTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error running linked food cost calculations ledger.</td></tr>`;
    }
  }

  if (recipeIngredientForm) {
    recipeIngredientForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const currentItemId = activeHiddenId.value;
      if (!currentItemId) return;

      const newIngredient = {
        menuItemId: currentItemId, 
        name: document.getElementById("ingredientName").value.trim(),
        brand: document.getElementById("ingredientBrand").value.trim(),
        quantity: parseFloat(document.getElementById("ingredientQty").value),
        unit: document.getElementById("ingredientUnit").value.trim()
      };

      try {
        const response = await fetch(recipeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newIngredient)
        });

        if (response.ok) {
          document.getElementById("ingredientName").value = "";
          document.getElementById("ingredientBrand").value = "";
          document.getElementById("ingredientQty").value = "";
          document.getElementById("ingredientUnit").value = "";
          loadRecipeIngredients(currentItemId); 
        }
      } catch (error) {
        console.error("Save Ingredient Error:", error);
      }
    });
  }

  // Adjust/Edit Individual Recipe Ingredient 
  window.editRecipeIngredient = async function(id, menuItemId, name, currentBrand, currentQuantity, currentUnit) {
    
    const newIngredientName = prompt(`Enter Ingredient Name:`, name);
    if (newIngredientName === null || newIngredientName.trim() === "") return;

    const newBrandName = prompt(`Enter Brand Name for "${newIngredientName.trim()}":`, currentBrand);
    if (newBrandName === null || newBrandName.trim() === "") return;

    const newQuantityInput = prompt(`Enter quantity required for ${newIngredientName.trim()} (${currentUnit}):`, currentQuantity);
    if (newQuantityInput === null || newQuantityInput.trim() === "" || isNaN(newQuantityInput)) return;

    const newUnitInput = prompt(`Enter measurement unit (e.g., g, ml, pcs):`, currentUnit);
    if (newUnitInput === null || newUnitInput.trim() === "") return;

    const updatedIngredientData = {
      name: newIngredientName.trim(),
      brand: newBrandName.trim(),
      quantity: parseFloat(newQuantityInput),
      unit: newUnitInput.trim()
    };

    try {
      const response = await fetch(`${recipeEndpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedIngredientData)
      });

      if (response.ok) {
        loadRecipeIngredients(menuItemId); 
      } else {
        throw new Error("Local database server rejected ingredient adjustment request.");
      }
    } catch (error) {
      console.error("Recipe Ingredient Update Error:", error);
    }
  };


  window.removeIngredient = async function(id, itemId) {
    try {
      const response = await fetch(`${recipeEndpoint}/${id}`, { method: "DELETE" });
      if (response.ok) loadRecipeIngredients(itemId);
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
  const inventoryEndpoint = "https://DNNgesa.github.io/ReciTrak/db.json";
  // const inventoryEndpoint = "http://localhost:3000/inventory";

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


  // VENDOR DIRECTORY 
  const vendorCatalogForm = document.getElementById("vendorCatalogForm");
  const vendorTableBody = document.getElementById("vendorTableBody");
  const vendorFeedback = document.getElementById("vendorFeedback");
  const vendorsEndpoint = "https://DNNgesa.github.io/ReciTrak/db.json";
  // const vendorsEndpoint = "http://localhost:3000/vendors";

  async function loadVendorDirectory() {
    if (!vendorTableBody) return;

    try {
      const response = await fetch(vendorsEndpoint);
      if (!response.ok) throw new Error("Could not retrieve vendor listings.");
      
      const vendors = await response.json();
      vendorTableBody.innerHTML = "";

      if (vendors.length === 0) {
        vendorTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No vendors registered yet. Log your first supplier on the left!</td></tr>`;
        return;
      }

      vendors.forEach(vnd => {
        const packQty = parseFloat(vnd.packQuantity) || parseFloat(vnd.packSize) || 1;
        const measureUnit = vnd.measurementUnit || "Unit";
        const cost = parseFloat(vnd.unitCost) || 0;
        const costPerBaseUnit = cost / packQty;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="fw-bold text-secondary">${vnd.vendorName}</td>
          <td>${vnd.itemName}</td>
          <td><span class="badge bg-light text-dark border">${packQty} ${measureUnit}</span></td>
          <td class="fw-semibold">KES ${cost.toFixed(2)}</td>
          <td class="text-muted small">KES ${costPerBaseUnit.toFixed(2)} / ${measureUnit}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="editVendorCatalogItem('${vnd.id}', '${vnd.vendorName}', '${vnd.itemName}', ${packQty}, '${measureUnit}', ${cost})">Adjust</button>
              <button class="btn btn-outline-danger" onclick="removeVendorEntry('${vnd.id}')">Remove</button>
            </div>
          </td>
        `;

        vendorTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      vendorTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error loading vendor systems database.</td></tr>`;
    }
  }

  // Catalog Form Submission 
  if (vendorCatalogForm) {
    vendorCatalogForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      
      const newVendorItem = {
        vendorName: document.getElementById("vndCompanyName").value,
        itemName: document.getElementById("vndItemSupplied").value,
        packQuantity: parseFloat(document.getElementById("vndPackQuantity").value),
        measurementUnit: document.getElementById("vndMeasurementUnit").value,      
        unitCost: parseFloat(document.getElementById("vndUnitCost").value)
      };

      try {
        const response = await fetch(vendorsEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newVendorItem)
        });

        if (response.ok) {
          vendorFeedback.className = "mt-2 small text-success fw-bold";
          vendorFeedback.textContent = "Vendor catalog item registered successfully!";
          vendorCatalogForm.reset();
          loadVendorDirectory();
        }
      } catch (error) {
        console.error("Vendor Database Error:", error);
      }
    });
  }

  window.editVendorCatalogItem = async function(id, vendorName, itemName, currentPackQuantity, currentMeasurementUnit, currentUnitCost) {
    const newVendorName = prompt(`Enter Vendor/Company Name for "${itemName}":`, vendorName);
    if (newVendorName === null || newVendorName.trim() === "") return;

    const newPackQtyInput = prompt(`Enter pack volume/quantity size for ${newVendorName.trim()} - ${itemName}:`, currentPackQuantity);
    if (newPackQtyInput === null || newPackQtyInput.trim() === "" || isNaN(newPackQtyInput)) return;

    const newUnitInput = prompt(`Enter measurement unit (kg, g, L, ml, pcs, pack) for ${newVendorName.trim()} - ${itemName}:`, currentMeasurementUnit);
    if (newUnitInput === null || newUnitInput.trim() === "") return;

    const newCostInput = prompt(`Enter contract unit cost in KES for ${newVendorName.trim()} - ${itemName}:`, currentUnitCost);
    if (newCostInput === null || newCostInput.trim() === "" || isNaN(newCostInput)) return;

    const updatedData = {
      vendorName: newVendorName.trim(),
      itemName: itemName,
      packQuantity: parseFloat(newPackQtyInput),
      measurementUnit: newUnitInput.trim().toLowerCase(),
      unitCost: parseFloat(newCostInput)
    };

    try {
      const response = await fetch(`${vendorsEndpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        loadVendorDirectory(); 
      } else {
        throw new Error("Local database server rejected package layout update request.");
      }
    } catch (error) {
      console.error("Vendor Catalog Update Error:", error);
    }
  };

  // Remove vendor data 
  window.removeVendorEntry = async function(id) {
    if (confirm("Permanently drop this item record from vendor contracts directory?")) {
      try {
        const response = await fetch(`${vendorsEndpoint}/${id}`, { method: "DELETE" });
        if (response.ok) loadVendorDirectory();
      } catch (error) {
        console.error(error);
      }
    }
  };

  loadVendorDirectory();

  // SUPPLY CHAIN
  const supplyForm = document.getElementById("supplyForm");
  const supplyTable = document.getElementById("supplyTableBody");
  const supplyFeedback = document.getElementById("supplyFeedback");
  const supplyEndpoint = "https://DNNgesa.github.io/ReciTrak/db.json";
   
  // const supplyEndpoint = "http://localhost:3000/supply";

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
