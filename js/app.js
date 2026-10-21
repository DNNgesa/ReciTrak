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

// fetch('https://api.api-ninjas.com/v1/nutrition?query=1lb brisket and fries', { 
//     headers: { 'User-Agent': 'Node' } 
// })

//   .then(res => res.json()).then(console.log);

// MENU FUNCTIONS
let menuItems = [
  { id: 1, name: "Beef Pilau", price: 550 }
];

function renderMenu() {
  const container = document.getElementById('menuContainer');
  if (!container) return; 
  container.innerHTML = ''; 

  menuItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'menu-item';
    
    li.innerHTML = `
      <div class="item-header">
        <span>${item.name}</span>
        <span>KES ${item.price.toFixed(2)}</span>
      </div>
      
      <div class="item-actions">
        <button class="action-btn" onclick="updatePrice(${item.id})">Edit Price</button>
        <button class="remove-btn action-btn" onclick="removeItem(${item.id})">Remove</button>
      </div>
    `;
    container.appendChild(li);
  });
}

// FORM SUBMIT NEW FOOD ITEMS
document.getElementById('menuForm').addEventListener('submit', function(event) {
  event.preventDefault(); 
  AddItem();
});

function AddItem() {
  const nameInput = document.getElementById('itemName');
  const name = nameInput.value.trim();

  if (!name) {
    alert("Please enter an item name.");
    return;
  }

  const newItem = {
    id: Date.now(), 
    name: name,
    price: 0.00,
  };

  menuItems.push(newItem);
  nameInput.value = ''; 
  renderMenu(); 
}

function updatePrice(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  const newPrice = prompt(`Enter new price (KES) for ${item.name}:`, item.price);
  if (newPrice !== null) {
    const parsedPrice = parseFloat(newPrice);
    if (!isNaN(parsedPrice) && parsedPrice >= 0) {
      item.price = parsedPrice;
      renderMenu();
    } else {
      alert("Invalid price value entered.");
    }
  }
}

function removeItem(id) {
  if (confirm("Are you sure you want to remove this item?")) {
    menuItems = menuItems.filter(item => item.id !== id);
    renderMenu();
  }
}

renderMenu();
