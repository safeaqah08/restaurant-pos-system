/* =========================================
   1. STATE & VARIABLES
   ========================================= */
let menuItems = [];
let cart = [];
let currentCategory = 'Miscellaneous'; // "Memory" for the tabs

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const categoryButtons = document.querySelectorAll('.cat-btn');
const searchInput = document.getElementById('searchInput');

/* =========================================
   2. EVENT LISTENERS
   ========================================= */

// Search Logic
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();

    if (searchTerm.length > 0) {
        // A. If typing, search EVERYTHING (Global Override)
        searchAllMenus(searchTerm);
    } else {
        // B. If deleted, go back to the SAVED category
        fetchMenu(currentCategory);
    }
});

// Category Click Logic
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // UI: Remove active class from all, add to clicked
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // MEMORY: Save the clicked category
        currentCategory = btn.dataset.cat;
        
        // Fetch new data
        fetchMenu(currentCategory);
    });
});

/* =========================================
   3. API & DATA FUNCTIONS
   ========================================= */

// Fetch by Category
async function fetchMenu(category) {
    menuGrid.innerHTML = '<div class="loading">Loading delicious food...</div>';
    
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
        const data = await response.json();
        processAndRender(data.meals);
    } catch (error) {
        menuGrid.innerHTML = '<div class="error">Failed to load menu.</div>';
    }
}

// Global Search
async function searchAllMenus(term) {
    menuGrid.innerHTML = '<div class="loading">Searching...</div>';

    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`);
        const data = await response.json();
        
        if (data.meals) {
            processAndRender(data.meals);
        } else {
            menuGrid.innerHTML = '<div class="empty-state">No food found matching that name.</div>';
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

// HELPER: Adds fake prices/stock to API data (Prevents code duplication)
function processAndRender(meals) {
    if (!meals) return;

    menuItems = meals.map(item => ({
        id: item.idMeal,
        name: item.strMeal,
        image: item.strMealThumb,
        price: (Math.floor(Math.random() * (65 - 15 + 1) + 15)), // Random Price RM 15-65
        stock: Math.floor(Math.random() * 20) + 1
    }));

    renderMenu(menuItems);
}

/* =========================================
   4. RENDERING (UI)
   ========================================= */

function renderMenu(items) {
    menuGrid.innerHTML = items.map(item => `
        <div class="food-card">
            <div class="img-wrapper">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <div class="badge">Available: ${item.stock}</div>
            </div>
            <div class="food-info">
                <h4>${item.name}</h4>
                <div class="price-row">
                    <span class="price">RM ${item.price.toFixed(2)}</span>
                    <button class="add-btn" onclick="addToCart('${item.id}')">
                        <i class="ph ph-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCartUI() {
    // Generate HTML for cart items
    const cartHTML = cart.length === 0 ? 
        '<div class="empty-state">No items yet</div>' : 
        cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="">
                <div class="cart-details">
                    <h5>${item.name}</h5>
                    <div class="qty-controls">
                        <span class="price">RM ${(item.price * item.qty).toFixed(2)}</span>
                        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
                    </div>
                </div>
            </div>
        `).join('');

    // Calculate Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;

    // Update Desktop Sidebar
    const desktopList = document.getElementById('cartList');
    if(desktopList) desktopList.innerHTML = cartHTML;
    
    // Safely update elements only if they exist
    const subEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totEl = document.getElementById('total');
    if(subEl) subEl.innerText = `RM ${subtotal.toFixed(2)}`;
    if(taxEl) taxEl.innerText = `RM ${tax.toFixed(2)}`;
    if(totEl) totEl.innerText = `RM ${total.toFixed(2)}`;

    // Update Mobile Badge
    const countEl = document.getElementById('cartCount');
    if(countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0);

    // Update Mobile Modal Content
    const mobileBody = document.getElementById('mobileCartBody');
    if (mobileBody) {
        mobileBody.innerHTML = `
            <div class="cart-items" style="max-height: none;">${cartHTML}</div>
            
            <div class="payment-summary">
                <h3 class="mobile-summary-title">Payment Summary</h3>
                
                <div class="row">
                    <span>Subtotal</span> 
                    <span>RM ${subtotal.toFixed(2)}</span>
                </div>
                
                <div class="row">
                    <span>Tax (6%)</span> 
                    <span>RM ${tax.toFixed(2)}</span>
                </div>

                <div class="row total">
                    <span>Total</span> 
                    <strong>RM ${total.toFixed(2)}</strong>
                </div>
                
                <button class="checkout-btn">Checkout Now</button>
            </div>
        `;
    }
}

/* =========================================
   5. CART LOGIC
   ========================================= */

function addToCart(id) {
    const item = menuItems.find(i => i.id === id);
    const existingItem = cart.find(c => c.id === id);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    updateCartUI();
}

function changeQty(id, change) {
    const item = cart.find(c => c.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            cart = cart.filter(c => c.id !== id);
        }
    }
    updateCartUI();
}

/* =========================================
   6. UTILITIES & MOBILE
   ========================================= */

function updateTableNumber(change) {
    const numberElement = document.getElementById('tableNumber');
    let currentNumber = parseInt(numberElement.innerText);
    let newNumber = currentNumber + change;
    if (newNumber < 1) return;
    numberElement.innerText = newNumber;
}

function toggleMobileCart() {
    const modal = document.getElementById('mobileCartOverlay');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

/* =========================================
   7. INITIALIZATION
   ========================================= */

// Start the app by loading the default category
fetchMenu(currentCategory);