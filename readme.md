# 🍰 Junaya Pre-Order System

Sistem pre-order online dengan fitur login dan database cloud (Firebase) yang bisa diakses dari HP dan laptop.

## ✨ Fitur Utama

- ✅ **Login & Register** - Setiap user punya akun sendiri
- ☁️ **Cloud Database** - Data tersimpan di Firebase (gratis)
- 📱 **Multi-Device** - Akses dari HP, laptop, tablet
- 🔄 **Real-time Sync** - Data langsung update di semua perangkat
- ⚡ **Quick Code** - Input cepat dengan kode (CTMS1, MTM2, dll)
- 💰 **Auto Calculate** - Harga otomatis terisi
- 📊 **Statistics** - Laporan lengkap per size, payment, produk
- 📤 **Export Excel** - Download data ke CSV/Excel
- 🗑️ **Delete Order** - Hapus order dengan konfirmasi
- 🎨 **Apple-Style Design** - Modern dan profesional

## 🚀 Cara Setup

### 1. Setup Firebase (Database Gratis)

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik **"Add Project"** atau **"Create a project"**
3. Beri nama project (misalnya: "junaya-orders")
4. Ikuti wizard setup sampai selesai
5. Di dashboard project, klik **"Web"** icon (</>) untuk add web app
6. Beri nama app, klik **"Register app"**
7. Copy semua data **Firebase Configuration** yang muncul
8. Buka file **`script.js`** di folder project ini
9. Cari bagian `firebaseConfig` (baris 12-19) dan ganti dengan config kamu:

```javascript
const firebaseConfig = {
    apiKey: "AIza...", // dari Firebase Console
    authDomain: "junaya-orders.firebaseapp.com",
    databaseURL: "https://junaya-orders-default-rtdb.firebaseio.com",
    projectId: "junaya-orders",
    storageBucket: "junaya-orders.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

10. Di Firebase Console, buka **"Realtime Database"** dari menu kiri
11. Klik **"Create Database"**
12. Pilih lokasi server (pilih yang terdekat, misalnya Asia Southeast)
13. Pilih **"Start in test mode"** untuk development (nanti bisa diubah)
14. Klik **"Enable"**

15. Di Firebase Console, buka **"Authentication"** dari menu kiri
16. Klik **"Get Started"**
17. Pilih **"Email/Password"** dari tab "Sign-in method"
18. **Enable** Email/Password
19. Klik **"Save"**

### 2. Deploy ke Netlify

#### Cara 1: Drag & Drop (Paling Mudah)

1. Buka [Netlify](https://www.netlify.com)
2. Login atau Register (gratis)
3. Di dashboard, ada area **"Drag and drop your site folder here"**
4. Drag folder project kamu (yang berisi index.html, script.js, styles.css) ke area tersebut
5. Tunggu upload selesai
6. Netlify akan kasih URL gratis (misalnya: `https://junaya-orders-abc123.netlify.app`)
7. Done! Bisa langsung diakses dari HP/laptop

#### Cara 2: Via GitHub (Recommended untuk Update Mudah)

1. Upload folder project ke GitHub repository baru
2. Di Netlify, klik **"New site from Git"**
3. Pilih **GitHub** dan authorize Netlify
4. Pilih repository project kamu
5. Klik **"Deploy site"**
6. Netlify akan auto-deploy setiap kali kamu push ke GitHub

### 3. Custom Domain (Optional)

Di Netlify:
1. Klik **"Domain settings"**
2. Klik **"Add custom domain"**
3. Masukkan domain kamu (misalnya: order.junaya.com)
4. Ikuti instruksi untuk pointing DNS

## 📱 Cara Pakai

### Pertama Kali:

1. Buka website di browser (dari HP atau laptop)
2. Klik **"Buat Akun Baru"**
3. Isi Nama, Email, Password
4. Klik **"Daftar Sekarang"**
5. Login dengan akun yang baru dibuat

### Input Order:

**Metode 1 - Quick Code (Cepat):**
```
Ketik di field "Quick Code":
- CTMS1 → Classic Tiramisu Small x1
- MTM2 → Matcha Missu Medium x2
- CTS5 → Classic Tiramisu Small x5
```

**Metode 2 - Manual:**
1. Pilih produk dari dropdown
2. Pilih size (otomatis terisi tapi bisa diubah)
3. Masukkan quantity
4. Harga otomatis muncul
5. Pilih payment method
6. Pilih status
7. Klik **"Tambah Order"**

### Akses dari Device Lain:

1. Buka URL website yang sama
2. Login dengan email & password yang sama
3. Semua data akan muncul otomatis!

## 🔐 Keamanan

- Setiap user hanya bisa lihat data ordernya sendiri
- Password di-encrypt oleh Firebase
- Data tersimpan aman di cloud
- Bisa logout kapan saja

## 💡 Tips

1. **Bookmark URL** di HP untuk akses cepat
2. **Add to Home Screen** di HP (seperti install app):
   - Android: Chrome → Menu (⋮) → "Add to Home screen"
   - iOS: Safari → Share → "Add to Home Screen"
3. **Export data rutin** untuk backup
4. **Gunakan Quick Code** untuk input lebih cepat

## 🛠️ Troubleshooting

### "Firebase configuration needed"
- Pastikan sudah update `firebaseConfig` di `script.js`
- Pastikan Firebase project sudah aktif

### "Login failed"
- Pastikan Authentication sudah di-enable di Firebase
- Periksa email & password sudah benar
- Password minimal 6 karakter

### "Data tidak sync"
- Periksa koneksi internet
- Pastikan Realtime Database sudah di-enable di Firebase
- Cek di Firebase Console apakah data masuk

### Website tidak bisa dibuka
- Pastikan deploy di Netlify berhasil
- Cek URL sudah benar
- Coba clear cache browser

## 📂 Struktur File

```
junaya-preorder/
├── index.html          # File HTML utama
├── styles.css          # Semua styling (1021 baris)
├── script.js           # Logic & Firebase (878+ baris)
└── README.md           # Panduan ini
```

## 🎯 Kode Produk

| Kode | Produk | Size | Harga |
|------|--------|------|-------|
| CTM  | Classic Tiramisu | Medium | Rp 38.000 |
| CTS  | Classic Tiramisu | Small | Rp 25.000 |
| MTM  | Matcha Missu | Medium | Rp 40.000 |
| MTS  | Matcha Missu | Small | Rp 28.000 |

## 🆘 Support

Jika ada pertanyaan atau masalah:
1. Cek README ini dulu
2. Cek Firebase Console untuk error log
3. Cek Netlify dashboard untuk deployment status

## 📄 License

Free to use for Junaya business.

---

**Made with ❤️ for Junaya Pre-Order System**