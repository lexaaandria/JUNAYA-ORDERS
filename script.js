// ========================================
// Junaya Pre-Order System - JavaScript with Firebase
// Real-time Cloud Database Integration
// ========================================

// === Firebase Configuration ===
// IMPORTANT: Ganti dengan Firebase config kamu sendiri dari https://console.firebase.google.com
const firebaseConfig = {
    apiKey: "AIzaSyC61nyjf_UGfiyRGOWXkqUsAgTuJgiR_bo",
    authDomain: "junaya-web.firebaseapp.com",
    databaseURL: "https://junaya-web-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "junaya-web",
    storageBucket: "junaya-web.firebasestorage.app",
    messagingSenderId: "642483043314",
    appId: "1:642483043314:web:98753efb3c77d8967f896b"
};

// Initialize Firebase
let app, auth, database;
let currentUser = null;
let ordersRef = null;

// === Product Database ===
const PRODUCTS = {
    'CTM': { name: 'Classic Tiramisu', size: 'Medium', price: 38000 },
    'CTS': { name: 'Classic Tiramisu', size: 'Small', price: 25000 },
    'MTM': { name: 'Matcha Missu', size: 'Medium', price: 40000 },
    'MTS': { name: 'Matcha Missu', size: 'Small', price: 28000 }
};

// === Global State ===
let orders = [];
let deleteTargetId = null;
let editTargetId = null;
let filteredOrders = [];

// === DOM Elements ===
const elements = {
    // Screens
    loginScreen: document.getElementById('loginScreen'),
    registerScreen: document.getElementById('registerScreen'),
    mainApp: document.getElementById('mainApp'),
    
    // Login Elements
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    btnLogin: document.getElementById('btnLogin'),
    btnShowRegister: document.getElementById('btnShowRegister'),
    
    // Register Elements
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    btnRegister: document.getElementById('btnRegister'),
    btnShowLogin: document.getElementById('btnShowLogin'),
    
    // User Info
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    btnLogout: document.getElementById('btnLogout'),
    syncStatus: document.getElementById('syncStatus'),
    
    // Form Elements
    form: document.getElementById('orderForm'),
    customerName: document.getElementById('customerName'),
    quickCode: document.getElementById('quickCode'),
    productCode: document.getElementById('productCode'),
    productName: document.getElementById('productName'),
    size: document.getElementById('size'),
    quantity: document.getElementById('quantity'),
    price: document.getElementById('price'),
    total: document.getElementById('total'),
    paymentMethod: document.getElementById('paymentMethod'),
    status: document.getElementById('status'),
    
    // Table Elements
    ordersTableBody: document.getElementById('ordersTableBody'),
    
    // Summary Elements
    totalOrders: document.getElementById('totalOrders'),
    grandTotal: document.getElementById('grandTotal'),
    pendingOrders: document.getElementById('pendingOrders'),
    completedOrders: document.getElementById('completedOrders'),
    
    // Statistics Elements
    totalQtySmall: document.getElementById('totalQtySmall'),
    totalQtyMedium: document.getElementById('totalQtyMedium'),
    totalQtyAll: document.getElementById('totalQtyAll'),
    totalPriceSmall: document.getElementById('totalPriceSmall'),
    totalPriceMedium: document.getElementById('totalPriceMedium'),
    grandTotalPrice: document.getElementById('grandTotalPrice'),
    totalTransfer: document.getElementById('totalTransfer'),
    totalCash: document.getElementById('totalCash'),
    totalEWallet: document.getElementById('totalEWallet'),
    totalClassic: document.getElementById('totalClassic'),
    totalMatcha: document.getElementById('totalMatcha'),
    
    // Filter Elements
    searchInput: document.getElementById('searchInput'),
    filterStatus: document.getElementById('filterStatus'),
    filterPayment: document.getElementById('filterPayment'),
    clearFilterBtn: document.getElementById('clearFilter'),
    
    // Action Buttons
    exportBtn: document.getElementById('exportBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    
    // Modals
    deleteModal: document.getElementById('deleteModal'),
    cancelDelete: document.getElementById('cancelDelete'),
    confirmDelete: document.getElementById('confirmDelete'),
    
    // Date & Time
    currentDate: document.getElementById('currentDate'),
    currentTime: document.getElementById('currentTime')
};

// ========================================
// === Firebase Functions ===
// ========================================

async function initializeFirebase() {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        database = firebase.database();
        
        // Listen for auth state changes
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                showMainApp();
                setupRealtimeListener();
            } else {
                currentUser = null;
                showLoginScreen();
            }
        });
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showNotification('❌ Error connecting to database', 'error');
    }
}

function setupRealtimeListener() {
    if (!currentUser) return;
    
    ordersRef = database.ref(`users/${currentUser.uid}/orders`);
    
    ordersRef.on('value', (snapshot) => {
        const data = snapshot.val();
        orders = data ? Object.values(data) : [];
        renderOrders();
        updateAllStatistics();
        updateSyncStatus(true);
    });
}

function updateSyncStatus(synced) {
    if (synced) {
        elements.syncStatus.innerHTML = '<span class="sync-icon">☁️</span><span>Data tersinkronisasi</span>';
        elements.syncStatus.style.color = 'var(--accent-green)';
    } else {
        elements.syncStatus.innerHTML = '<span class="sync-icon">⏳</span><span>Menyinkronkan...</span>';
        elements.syncStatus.style.color = 'var(--accent-orange)';
    }
}

async function saveOrderToFirebase(order) {
    if (!currentUser) return;
    
    updateSyncStatus(false);
    try {
        await database.ref(`users/${currentUser.uid}/orders/${order.id}`).set(order);
        updateSyncStatus(true);
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('❌ Error saving order', 'error');
        updateSyncStatus(true);
    }
}

async function deleteOrderFromFirebase(orderId) {
    if (!currentUser) return;
    
    updateSyncStatus(false);
    try {
        await database.ref(`users/${currentUser.uid}/orders/${orderId}`).remove();
        updateSyncStatus(true);
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('❌ Error deleting order', 'error');
        updateSyncStatus(true);
    }
}

async function clearAllOrdersFromFirebase() {
    if (!currentUser) return;
    
    updateSyncStatus(false);
    try {
        await database.ref(`users/${currentUser.uid}/orders`).remove();
        updateSyncStatus(true);
    } catch (error) {
        console.error('Error clearing orders:', error);
        showNotification('❌ Error clearing orders', 'error');
        updateSyncStatus(true);
    }
}

// ========================================
// === Authentication Functions ===
// ========================================

async function handleLogin(e) {
    e.preventDefault();
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!email || !password) {
        showNotification('⚠️ Please fill in all fields', 'warning');
        return;
    }
    
    try {
        elements.btnLogin.disabled = true;
        elements.btnLogin.textContent = 'Logging in...';
        
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('✅ Login successful!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        let message = 'Login failed';
        
        if (error.code === 'auth/user-not-found') {
            message = '❌ User not found';
        } else if (error.code === 'auth/wrong-password') {
            message = '❌ Wrong password';
        } else if (error.code === 'auth/invalid-email') {
            message = '❌ Invalid email';
        }
        
        showNotification(message, 'error');
    } finally {
        elements.btnLogin.disabled = false;
        elements.btnLogin.innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 1V8M8 8V15M8 8H15M8 8H1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Login</span>';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    
    if (!name || !email || !password) {
        showNotification('⚠️ Please fill in all fields', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showNotification('⚠️ Password must be at least 6 characters', 'warning');
        return;
    }
    
    try {
        elements.btnRegister.disabled = true;
        elements.btnRegister.textContent = 'Creating account...';
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        
        showNotification('✅ Account created successfully!', 'success');
        
    } catch (error) {
        console.error('Registration error:', error);
        let message = 'Registration failed';
        
        if (error.code === 'auth/email-already-in-use') {
            message = '❌ Email already in use';
        } else if (error.code === 'auth/invalid-email') {
            message = '❌ Invalid email';
        } else if (error.code === 'auth/weak-password') {
            message = '❌ Password is too weak';
        }
        
        showNotification(message, 'error');
    } finally {
        elements.btnRegister.disabled = false;
        elements.btnRegister.innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 3V8M8 8V13M8 8H13M8 8H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span>Daftar Sekarang</span>';
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showNotification('👋 Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('❌ Error logging out', 'error');
    }
}

function showMainApp() {
    elements.loginScreen.style.display = 'none';
    elements.registerScreen.style.display = 'none';
    elements.mainApp.style.display = 'block';
    
    if (currentUser) {
        elements.userName.textContent = currentUser.displayName || 'User';
        elements.userEmail.textContent = currentUser.email;
    }
}

function showLoginScreen() {
    elements.loginScreen.style.display = 'flex';
    elements.registerScreen.style.display = 'none';
    elements.mainApp.style.display = 'none';
}

function showRegisterScreen() {
    elements.loginScreen.style.display = 'none';
    elements.registerScreen.style.display = 'flex';
    elements.mainApp.style.display = 'none';
}

// ========================================
// === Order Form Functions ===
// ========================================

function handleQuickCode() {
    const code = elements.quickCode.value.toUpperCase();
    const product = PRODUCTS[code];
    
    if (product) {
        elements.productCode.value = code;
        elements.productName.value = product.name;
        elements.size.value = product.size;
        elements.price.value = product.price;
        calculateTotal();
    } else {
        elements.productCode.value = '';
        elements.productName.value = '';
        elements.size.value = '';
        elements.price.value = '';
        elements.total.value = '';
    }
}

function handleProductCodeChange() {
    const code = elements.productCode.value.toUpperCase();
    elements.quickCode.value = code;
    const product = PRODUCTS[code];
    
    if (product) {
        elements.productName.value = product.name;
        elements.size.value = product.size;
        elements.price.value = product.price;
        calculateTotal();
    }
}

function calculateTotal() {
    const quantity = parseInt(elements.quantity.value) || 0;
    const price = parseInt(elements.price.value) || 0;
    const total = quantity * price;
    elements.total.value = total;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const customerName = elements.customerName.value.trim();
    const productCode = elements.productCode.value.trim().toUpperCase();
    const productName = elements.productName.value.trim();
    const size = elements.size.value;
    const quantity = parseInt(elements.quantity.value);
    const price = parseInt(elements.price.value);
    const total = parseInt(elements.total.value);
    const paymentMethod = elements.paymentMethod.value;
    const status = elements.status.value;
    
    if (!customerName || !productCode || !productName || !size || !quantity || !price) {
        showNotification('⚠️ Please fill in all required fields', 'warning');
        return;
    }
    
    const order = {
        id: editTargetId || Date.now(),
        date: new Date().toLocaleDateString('id-ID'),
        customerName,
        productCode,
        productName,
        size,
        quantity,
        price,
        total,
        paymentMethod,
        status,
        timestamp: Date.now()
    };
    
    await saveOrderToFirebase(order);
    
    if (editTargetId) {
        showNotification(`✅ Order for ${customerName} updated successfully`, 'success');
        editTargetId = null;
        elements.form.querySelector('button[type="submit"]').innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 3V8M8 8V13M8 8H13M8 8H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Tambah Order';
    } else {
        showNotification(`✅ Order for ${customerName} added successfully`, 'success');
    }
    
    elements.form.reset();
    elements.quickCode.value = '';
    scrollToTable();
}

function scrollToTable() {
    document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// === Render Orders with Action Menu ===
// ========================================

function renderOrders() {
    const tbody = elements.ordersTableBody;
    tbody.innerHTML = '';
    
    const ordersToRender = filteredOrders.length > 0 ? filteredOrders : orders;
    
    if (ordersToRender.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="12">
                    <div class="empty-message">
                        <span class="empty-icon">📦</span>
                        <p>Belum ada order. Tambahkan order pertama Anda!</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    ordersToRender.forEach((order, index) => {
        const row = createOrderRow(order, index + 1);
        tbody.appendChild(row);
    });
}

function createOrderRow(order, rowNumber) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', order.id);
    
    tr.innerHTML = `
        <td style="text-align: center;">${rowNumber}</td>
        <td>${order.date}</td>
        <td><strong>${order.customerName}</strong></td>
        <td style="text-align: center;"><span class="code-badge">${order.productCode}</span></td>
        <td>${order.productName}</td>
        <td style="text-align: center;"><span class="size-badge">${order.size}</span></td>
        <td style="text-align: center;"><strong>${order.quantity}</strong></td>
        <td style="text-align: right;" class="price-cell">${formatCurrency(order.price)}</td>
        <td style="text-align: right;" class="price-cell"><strong>${formatCurrency(order.total)}</strong></td>
        <td style="text-align: center;"><span class="payment-badge">${order.paymentMethod}</span></td>
        <td style="text-align: center;"><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
        <td style="text-align: center;">
            <div class="action-menu-container">
                <button class="action-menu-btn" onclick="toggleActionMenu(event, ${order.id})">⋮</button>
                <div class="action-menu-dropdown" id="menu-${order.id}">
                    <button class="action-menu-item" onclick="editOrder(${order.id})">
                        <span>✏️</span>
                        <span>Edit</span>
                    </button>
                    <button class="action-menu-item delete" onclick="confirmDelete(${order.id})">
                        <span>🗑️</span>
                        <span>Hapus</span>
                    </button>
                </div>
            </div>
        </td>
    `;
    
    return tr;
}

// ========================================
// === Action Menu Functions ===
// ========================================

function toggleActionMenu(event, orderId) {
    event.stopPropagation();
    
    // Close all other menus
    document.querySelectorAll('.action-menu-dropdown').forEach(menu => {
        if (menu.id !== `menu-${orderId}`) {
            menu.classList.remove('show');
        }
    });
    
    // Toggle current menu
    const menu = document.getElementById(`menu-${orderId}`);
    menu.classList.toggle('show');
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.action-menu-container')) {
        document.querySelectorAll('.action-menu-dropdown').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Close menu
    document.getElementById(`menu-${orderId}`).classList.remove('show');
    
    // Fill form with order data
    elements.customerName.value = order.customerName;
    elements.quickCode.value = order.productCode;
    elements.productCode.value = order.productCode;
    elements.productName.value = order.productName;
    elements.size.value = order.size;
    elements.quantity.value = order.quantity;
    elements.price.value = order.price;
    elements.total.value = order.total;
    elements.paymentMethod.value = order.paymentMethod;
    elements.status.value = order.status;
    
    // Set edit mode
    editTargetId = orderId;
    elements.form.querySelector('button[type="submit"]').innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21V13H7V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 3V8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Update Order';
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    showNotification('✏️ Edit mode activated', 'info');
}

// ========================================
// === Statistics Update ===
// ========================================

function updateAllStatistics() {
    updateSummaryCards();
    updateQuantityStats();
    updatePriceStats();
    updatePaymentStats();
    updateProductStats();
}

function updateSummaryCards() {
    elements.totalOrders.textContent = orders.length;
    
    const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);
    elements.grandTotal.textContent = formatCurrency(grandTotal);
    
    const pending = orders.filter(o => o.status === 'Pending').length;
    elements.pendingOrders.textContent = pending;
    
    const completed = orders.filter(o => o.status === 'Completed').length;
    elements.completedOrders.textContent = completed;
}

function updateQuantityStats() {
    const qtySmall = orders.filter(o => o.size === 'Small').reduce((sum, o) => sum + o.quantity, 0);
    elements.totalQtySmall.textContent = qtySmall;
    
    const qtyMedium = orders.filter(o => o.size === 'Medium').reduce((sum, o) => sum + o.quantity, 0);
    elements.totalQtyMedium.textContent = qtyMedium;
    
    elements.totalQtyAll.textContent = qtySmall + qtyMedium;
}

function updatePriceStats() {
    const priceSmall = orders.filter(o => o.size === 'Small').reduce((sum, o) => sum + o.total, 0);
    elements.totalPriceSmall.textContent = formatCurrency(priceSmall);
    
    const priceMedium = orders.filter(o => o.size === 'Medium').reduce((sum, o) => sum + o.total, 0);
    elements.totalPriceMedium.textContent = formatCurrency(priceMedium);
    
    const grandTotal = priceSmall + priceMedium;
    elements.grandTotalPrice.textContent = formatCurrency(grandTotal);
}

function updatePaymentStats() {
    const transfer = orders.filter(o => o.paymentMethod === 'Transfer').reduce((sum, o) => sum + o.total, 0);
    elements.totalTransfer.textContent = formatCurrency(transfer);
    
    const cash = orders.filter(o => o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.total, 0);
    elements.totalCash.textContent = formatCurrency(cash);
    
    const ewallet = orders.filter(o => o.paymentMethod === 'E-Wallet').reduce((sum, o) => sum + o.total, 0);
    elements.totalEWallet.textContent = formatCurrency(ewallet);
}

function updateProductStats() {
    const classic = orders.filter(o => o.productName.includes('Classic')).reduce((sum, o) => sum + o.quantity, 0);
    elements.totalClassic.textContent = classic;
    
    const matcha = orders.filter(o => o.productName.includes('Matcha')).reduce((sum, o) => sum + o.quantity, 0);
    elements.totalMatcha.textContent = matcha;
}

// ========================================
// === Filter & Search Functions ===
// ========================================

function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const statusFilter = elements.filterStatus.value;
    const paymentFilter = elements.filterPayment.value;
    
    filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.productCode.toLowerCase().includes(searchTerm) ||
            order.productName.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesPayment = !paymentFilter || order.paymentMethod === paymentFilter;
        
        return matchesSearch && matchesStatus && matchesPayment;
    });
    
    renderOrders();
}

function clearFilters() {
    elements.searchInput.value = '';
    elements.filterStatus.value = '';
    elements.filterPayment.value = '';
    filteredOrders = [];
    renderOrders();
    showNotification('🔄 Filters cleared', 'info');
}

// ========================================
// === Delete Functions ===
// ========================================

function confirmDelete(orderId) {
    // Close menu
    document.getElementById(`menu-${orderId}`).classList.remove('show');
    
    deleteTargetId = orderId;
    elements.deleteModal.classList.add('show');
}

async function deleteOrder() {
    if (deleteTargetId === null) return;
    
    const order = orders.find(o => o.id === deleteTargetId);
    if (order) {
        await deleteOrderFromFirebase(deleteTargetId);
        showNotification(`🗑️ Order for ${order.customerName} deleted`, 'success');
    }
    
    closeDeleteModal();
}

function closeDeleteModal() {
    elements.deleteModal.classList.remove('show');
    deleteTargetId = null;
}

async function confirmClearAll() {
    if (orders.length === 0) {
        showNotification('ℹ️ No orders to clear', 'info');
        return;
    }
    
    const confirmed = confirm(
        `⚠️ Are you sure you want to delete ALL ${orders.length} orders?\n\nThis action cannot be undone!`
    );
    
    if (confirmed) {
        await clearAllOrdersFromFirebase();
        showNotification('🗑️ All orders cleared', 'success');
    }
}

// ========================================
// === Export to Excel ===
// ========================================

function exportToExcel() {
    if (orders.length === 0) {
        showNotification('ℹ️ No orders to export', 'info');
        return;
    }
    
    let csv = 'No,Tanggal,Nama Pelanggan,Kode Produk,Nama Produk,Size,Quantity,Harga,Total,Payment Method,Status\n';
    
    orders.forEach((order, index) => {
        csv += `${index + 1},"${order.date}","${order.customerName}","${order.productCode}","${order.productName}","${order.size}",${order.quantity},${order.price},${order.total},"${order.paymentMethod}","${order.status}"\n`;
    });
    
    csv += '\n\n=== STATISTIK ===\n';
    csv += `Total Orders,${orders.length}\n`;
    csv += `Total Quantity Small,${orders.filter(o => o.size === 'Small').reduce((s, o) => s + o.quantity, 0)}\n`;
    csv += `Total Quantity Medium,${orders.filter(o => o.size === 'Medium').reduce((s, o) => s + o.quantity, 0)}\n`;
    csv += `Grand Total,${orders.reduce((s, o) => s + o.total, 0)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const filename = `Junaya_PreOrder_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`✅ Exported ${orders.length} orders to ${filename}`, 'success');
}

// ========================================
// === Utility Functions ===
// ========================================

function formatCurrency(amount) {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 16px 24px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 600;
        z-index: 10001;
        animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-out 2.7s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function updateDateTime() {
    const now = new Date();
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    elements.currentDate.textContent = now.toLocaleDateString('id-ID', dateOptions);
    
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    elements.currentTime.textContent = now.toLocaleTimeString('id-ID', timeOptions);
}

// ========================================
// === Event Listeners ===
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    initializeFirebase();
    
    // Update date and time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Sticky table header scroll effect
    const tableContainer = document.querySelector('.table-container');
    const tableSection = document.querySelector('.table-section');
    
    if (tableContainer && tableSection) {
        tableContainer.addEventListener('scroll', function() {
            if (this.scrollTop > 0) {
                tableSection.classList.add('scrolled');
            } else {
                tableSection.classList.remove('scrolled');
            }
        });
    }
    
    // Auth event listeners
    elements.btnLogin.addEventListener('click', handleLogin);
    elements.btnRegister.addEventListener('click', handleRegister);
    elements.btnShowRegister.addEventListener('click', showRegisterScreen);
    elements.btnShowLogin.addEventListener('click', showLoginScreen);
    elements.btnLogout.addEventListener('click', handleLogout);
    
    // Form event listeners
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.quickCode.addEventListener('input', handleQuickCode);
    elements.productCode.addEventListener('change', handleProductCodeChange);
    elements.quantity.addEventListener('input', calculateTotal);
    elements.price.addEventListener('input', calculateTotal);
    
    // Filter event listeners
    elements.searchInput.addEventListener('input', handleSearch);
    elements.filterStatus.addEventListener('change', handleSearch);
    elements.filterPayment.addEventListener('change', handleSearch);
    elements.clearFilterBtn.addEventListener('click', clearFilters);
    
    // Action button listeners
    elements.exportBtn.addEventListener('click', exportToExcel);
    elements.clearAllBtn.addEventListener('click', confirmClearAll);
    
    // Modal listeners
    elements.cancelDelete.addEventListener('click', closeDeleteModal);
    elements.confirmDelete.addEventListener('click', deleteOrder);
    
    // Close modal on outside click
    elements.deleteModal.addEventListener('click', function(e) {
        if (e.target === elements.deleteModal) {
            closeDeleteModal();
        }
    });
});
