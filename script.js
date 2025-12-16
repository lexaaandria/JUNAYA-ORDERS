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
    clearFilter: document.getElementById('clearFilter'),
    
    // Button Elements
    exportBtn: document.getElementById('exportBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    
    // Modal Elements
    deleteModal: document.getElementById('deleteModal'),
    confirmDelete: document.getElementById('confirmDelete'),
    cancelDelete: document.getElementById('cancelDelete'),
    
    // Date/Time Elements
    currentDate: document.getElementById('currentDate'),
    currentTime: document.getElementById('currentTime')
};

// ========================================
// === Initialization ===
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    checkAuthState();
});

function initializeFirebase() {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        database = firebase.database();
        console.log('🔥 Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showNotification('⚠️ Firebase configuration needed. Please update firebaseConfig in script.js', 'error');
    }
}

function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showMainApp();
            loadUserOrders();
        } else {
            showLoginScreen();
        }
    });
}

// ========================================
// === Screen Management ===
// ========================================

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

function showMainApp() {
    elements.loginScreen.style.display = 'none';
    elements.registerScreen.style.display = 'none';
    elements.mainApp.style.display = 'block';
    
    // Update user info
    elements.userName.textContent = currentUser.displayName || 'User';
    elements.userEmail.textContent = currentUser.email;
}

// ========================================
// === Authentication Functions ===
// ========================================

async function handleLogin() {
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!email || !password) {
        showNotification('❌ Please fill all fields', 'error');
        return;
    }
    
    elements.btnLogin.disabled = true;
    elements.btnLogin.innerHTML = '<span class="loading-spinner"></span> Logging in...';
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('✅ Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification(`❌ Login failed: ${error.message}`, 'error');
    } finally {
        elements.btnLogin.disabled = false;
        elements.btnLogin.innerHTML = '<span>🔐</span> Login';
    }
}

async function handleRegister() {
    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    
    if (!name || !email || !password) {
        showNotification('❌ Please fill all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('❌ Password must be at least 6 characters', 'error');
        return;
    }
    
    elements.btnRegister.disabled = true;
    elements.btnRegister.innerHTML = '<span class="loading-spinner"></span> Creating account...';
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        showNotification('✅ Account created successfully!', 'success');
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(`❌ Registration failed: ${error.message}`, 'error');
    } finally {
        elements.btnRegister.disabled = false;
        elements.btnRegister.innerHTML = '<span>✨</span> Daftar Sekarang';
    }
}

async function handleLogout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    try {
        await auth.signOut();
        orders = [];
        showNotification('👋 Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('❌ Logout failed', 'error');
    }
}

// ========================================
// === Firebase Database Functions ===
// ========================================

function loadUserOrders() {
    if (!currentUser) return;
    
    ordersRef = database.ref(`users/${currentUser.uid}/orders`);
    
    // Listen for changes
    ordersRef.on('value', (snapshot) => {
        const data = snapshot.val();
        orders = data ? Object.values(data) : [];
        renderOrders();
        updateAllStatistics();
        updateSyncStatus('synced');
    });
}

async function saveOrderToFirebase(order) {
    if (!currentUser || !ordersRef) return;
    
    updateSyncStatus('syncing');
    
    try {
        await ordersRef.child(order.id.toString()).set(order);
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Save error:', error);
        showNotification('❌ Failed to save order', 'error');
        updateSyncStatus('error');
    }
}

async function deleteOrderFromFirebase(orderId) {
    if (!currentUser || !ordersRef) return;
    
    updateSyncStatus('syncing');
    
    try {
        await ordersRef.child(orderId.toString()).remove();
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('❌ Failed to delete order', 'error');
        updateSyncStatus('error');
    }
}

async function clearAllOrdersFromFirebase() {
    if (!currentUser || !ordersRef) return;
    
    updateSyncStatus('syncing');
    
    try {
        await ordersRef.remove();
        orders = [];
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Clear all error:', error);
        showNotification('❌ Failed to clear orders', 'error');
        updateSyncStatus('error');
    }
}

function updateSyncStatus(status) {
    const syncStatus = elements.syncStatus;
    
    if (status === 'syncing') {
        syncStatus.classList.add('syncing');
        syncStatus.innerHTML = '<span class="sync-icon">⏳</span><span>Syncing...</span>';
    } else if (status === 'synced') {
        syncStatus.classList.remove('syncing');
        syncStatus.innerHTML = '<span class="sync-icon">☁️</span><span>Data tersinkronisasi</span>';
    } else if (status === 'error') {
        syncStatus.classList.add('syncing');
        syncStatus.innerHTML = '<span class="sync-icon">⚠️</span><span>Sync error</span>';
    }
}

// ========================================
// === Event Listeners Setup ===
// ========================================

function setupEventListeners() {
    // Auth Listeners
    elements.btnLogin.addEventListener('click', handleLogin);
    elements.btnRegister.addEventListener('click', handleRegister);
    elements.btnLogout.addEventListener('click', handleLogout);
    elements.btnShowRegister.addEventListener('click', showRegisterScreen);
    elements.btnShowLogin.addEventListener('click', showLoginScreen);
    
    // Enter key for login
    elements.loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    elements.loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Enter key for register
    elements.registerPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
    
    // Form Submission
    elements.form.addEventListener('submit', handleFormSubmit);
    
    // Quick Code Input
    elements.quickCode.addEventListener('input', handleQuickCodeInput);
    elements.quickCode.addEventListener('blur', parseQuickCode);
    
    // Product Code Change
    elements.productCode.addEventListener('change', handleProductCodeChange);
    
    // Size Change
    elements.size.addEventListener('change', updatePriceAndTotal);
    
    // Quantity Change
    elements.quantity.addEventListener('input', updateTotal);
    
    // Filter Inputs
    elements.searchInput.addEventListener('input', applyFilters);
    elements.filterStatus.addEventListener('change', applyFilters);
    elements.filterPayment.addEventListener('change', applyFilters);
    elements.clearFilter.addEventListener('click', clearFilters);
    
    // Export Button
    elements.exportBtn.addEventListener('click', exportToExcel);
    
    // Clear All Button
    elements.clearAllBtn.addEventListener('click', confirmClearAll);
    
    // Modal Actions
    elements.confirmDelete.addEventListener('click', deleteOrder);
    elements.cancelDelete.addEventListener('click', closeDeleteModal);
    
    // Click outside modal to close
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            closeDeleteModal();
        }
    });
}

// ========================================
// === Date and Time Functions ===
// ========================================

function updateDateTime() {
    const now = new Date();
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateStr = now.toLocaleDateString('id-ID', dateOptions);
    elements.currentDate.textContent = dateStr;
    
    const timeStr = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    elements.currentTime.textContent = timeStr;
}

function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    return `${date} ${time}`;
}

// ========================================
// === Quick Code Parser ===
// ========================================

function handleQuickCodeInput(e) {
    const value = e.target.value.trim().toUpperCase();
    if (value.length > 0) {
        e.target.style.borderColor = '#FF9500';
    } else {
        e.target.style.borderColor = '';
    }
}

function parseQuickCode() {
    const quickCodeValue = elements.quickCode.value.trim().toUpperCase();
    
    if (!quickCodeValue) return;
    
    console.log('Parsing Quick Code:', quickCodeValue);
    
    let productCode = '';
    let size = '';
    let quantity = 1;
    
    const pattern1 = /^(CTM|CTS|MTM|MTS)([SM])(\d+)?$/;
    const pattern2 = /^(CTM|CTS|MTM|MTS)(\d+)?$/;
    
    let match = quickCodeValue.match(pattern1);
    
    if (match) {
        productCode = match[1];
        const sizeChar = match[2];
        size = sizeChar === 'S' ? 'Small' : 'Medium';
        quantity = match[3] ? parseInt(match[3]) : 1;
    } else {
        match = quickCodeValue.match(pattern2);
        if (match) {
            productCode = match[1];
            quantity = match[2] ? parseInt(match[2]) : 1;
            size = productCode.endsWith('S') ? 'Small' : 'Medium';
        }
    }
    
    if (productCode && PRODUCTS[productCode]) {
        elements.productCode.value = productCode;
        handleProductCodeChange();
        
        if (size) {
            elements.size.value = size;
            updatePriceAndTotal();
        }
        
        if (quantity) {
            elements.quantity.value = quantity;
            updateTotal();
        }
        
        elements.quickCode.style.borderColor = '#34C759';
        setTimeout(() => {
            elements.quickCode.style.borderColor = '';
        }, 2000);
        
        showNotification(`✅ Quick Code Parsed: ${PRODUCTS[productCode].name} ${size} x${quantity}`, 'success');
    } else if (quickCodeValue) {
        elements.quickCode.style.borderColor = '#FF3B30';
        showNotification('❌ Invalid Quick Code Format', 'error');
        setTimeout(() => {
            elements.quickCode.style.borderColor = '';
        }, 2000);
    }
}

// ========================================
// === Product Selection Handlers ===
// ========================================

function handleProductCodeChange() {
    const productCode = elements.productCode.value;
    
    if (!productCode) {
        elements.productName.value = '';
        elements.size.value = '';
        elements.price.value = '';
        elements.total.value = '';
        return;
    }
    
    const product = PRODUCTS[productCode];
    if (product) {
        elements.productName.value = product.name;
        elements.size.value = product.size;
        updatePriceAndTotal();
    }
}

function updatePriceAndTotal() {
    const productCode = elements.productCode.value;
    const size = elements.size.value;
    
    if (!productCode || !size) {
        elements.price.value = '';
        elements.total.value = '';
        return;
    }
    
    let matchingProduct = null;
    for (const [code, product] of Object.entries(PRODUCTS)) {
        if (code.startsWith(productCode.substring(0, 2)) && product.size === size) {
            matchingProduct = product;
            break;
        }
    }
    
    if (matchingProduct) {
        elements.price.value = formatCurrency(matchingProduct.price);
        updateTotal();
    }
}

function updateTotal() {
    const priceText = elements.price.value.replace(/[^\d]/g, '');
    const price = parseInt(priceText) || 0;
    const quantity = parseInt(elements.quantity.value) || 1;
    
    const total = price * quantity;
    elements.total.value = formatCurrency(total);
}

// ========================================
// === Form Submission ===
// ========================================

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: Date.now(),
        date: getCurrentDateTime(),
        customerName: elements.customerName.value.trim(),
        productCode: elements.productCode.value,
        productName: elements.productName.value,
        size: elements.size.value,
        quantity: parseInt(elements.quantity.value),
        price: parseInt(elements.price.value.replace(/[^\d]/g, '')),
        total: parseInt(elements.total.value.replace(/[^\d]/g, '')),
        paymentMethod: elements.paymentMethod.value,
        status: elements.status.value
    };
    
    if (!formData.customerName || !formData.productCode || !formData.size || 
        !formData.quantity || !formData.price || !formData.paymentMethod) {
        showNotification('❌ Please fill all required fields', 'error');
        return;
    }
    
    await saveOrderToFirebase(formData);
    
    elements.form.reset();
    elements.productName.value = '';
    elements.price.value = '';
    elements.total.value = '';
    elements.quickCode.value = '';
    
    showNotification(`✅ Order added successfully for ${formData.customerName}`, 'success');
    
    document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// === Render Orders ===
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
        <td>${rowNumber}</td>
        <td>${order.date}</td>
        <td><strong>${order.customerName}</strong></td>
        <td><span class="code-badge">${order.productCode}</span></td>
        <td>${order.productName}</td>
        <td><span class="size-badge">${order.size}</span></td>
        <td><strong>${order.quantity}</strong></td>
        <td>${formatCurrency(order.price)}</td>
        <td><strong>${formatCurrency(order.total)}</strong></td>
        <td><span class="payment-badge">${order.paymentMethod}</span></td>
        <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
        <td>
            <button class="btn-delete" onclick="confirmDelete(${order.id})">
                🗑️ Delete
            </button>
        </td>
    `;
    
    return tr;
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
    
    elements.grandTotalPrice.textContent = formatCurrency(priceSmall + priceMedium);
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
    const classic = orders.filter(o => o.productName === 'Classic Tiramisu').reduce((sum, o) => sum + o.quantity, 0);
    elements.totalClassic.textContent = classic;
    
    const matcha = orders.filter(o => o.productName === 'Matcha Missu').reduce((sum, o) => sum + o.quantity, 0);
    elements.totalMatcha.textContent = matcha;
}

// ========================================
// === Filter Functions ===
// ========================================

function applyFilters() {
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
    deleteTargetId = orderId;
    elements.deleteModal.classList.add('active');
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
    elements.deleteModal.classList.remove('active');
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
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#34C759' : type === 'error' ? '#FF3B30' : '#007AFF'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .code-badge {
        background: rgba(0, 122, 255, 0.1);
        color: #007AFF;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
    }
    .size-badge {
        background: rgba(175, 82, 222, 0.1);
        color: #AF52DE;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
    }
    .payment-badge {
        background: rgba(52, 199, 89, 0.1);
        color: #34C759;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

// Make confirmDelete globally accessible
window.confirmDelete = confirmDelete;

console.log('🚀 Junaya Pre-Order System with Firebase - Ready!');