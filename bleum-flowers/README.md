# Bleum.Flowers BSD — prototype

Buka `index.html` langsung di browser, atau jalankan `npm start` dari folder ini dan buka http://127.0.0.1:8000. Bundle animasi sudah disertakan sehingga preview tidak membutuhkan build.

Untuk mengubah animasi: `npm ci`, lalu `npm run build`. Efek kelopak memakai JavaScript dan CSS; katalog tetap memakai JavaScript yang sudah ada.

## Serpihan kelopak bunga

`src/category-petals.ts` memasang 56 serpihan kelopak di setiap foto kategori, tersebar sepanjang siklus jatuh agar langsung terlihat ramai. Ukuran 6–18 px dan durasi jatuh 7–14 detik bervariasi. Warna pink, rose, dan peach mengikuti foto. Kelopak berputar dan bergeser mengikuti pointer. Lapisan dekorasi tidak menangkap klik; foto dan tautan produk tetap dapat digunakan.

Animasi berhenti di luar viewport atau ketika tab tersembunyi, serta disembunyikan untuk preferensi reduced motion. Efek air sebelumnya tidak dimuat lagi. Source ThreeUI di `vendor/threeui/` disimpan sebagai referensi historis.

## Mengganti data

- Nomor WhatsApp: konstanta `WHATSAPP_NUMBER` di `js/script.js`. Nomor yang diberikan klien digunakan hanya sebagai nomor prototype; verifikasi sebelum publikasi.
- Produk: array `products` di file yang sama. Seluruh nama, foto, komposisi, dan pengelompokan occasion merupakan contoh. Harga belum tersedia.
- Foto: `assets/images/`. Foto stok hanya untuk inspirasi, termasuk foto kategori artificial dan money bouquet yang bukan dokumentasi produk tersebut.
- Alamat, jam operasional, pin Google Maps, opsi kustomisasi, ketersediaan, dan waktu pengerjaan: DATA REQUIRED.
- Font Google Fonts bersifat opsional; Georgia dan Arial menjadi fallback.

Semua pesanan menuju WhatsApp. Tidak ada keranjang, pembayaran, akun, atau penyimpanan informasi pengunjung. Tombol WhatsApp membuka tab baru; tidak mengirim pesan otomatis.

## Foto inspirasi

Sumber foto stok: Unsplash. ID foto tercatat dalam `assets/images/SOURCES.md`. Ganti dengan foto milik klien sebelum produksi dan pastikan hak penggunaan aset final.
