# Bleum.Flowers BSD — prototype

Buka `index.html` langsung di browser, atau jalankan `python -m http.server 8000` dari folder ini dan buka http://localhost:8000. Tidak ada build atau dependency JavaScript.

## Mengganti data

- Nomor WhatsApp: konstanta `WHATSAPP_NUMBER` di `js/script.js`. Nomor yang diberikan klien digunakan hanya sebagai nomor prototype; verifikasi sebelum publikasi.
- Produk: array `products` di file yang sama. Seluruh nama, foto, komposisi, dan pengelompokan occasion merupakan contoh. Harga belum tersedia.
- Foto: `assets/images/`. Foto stok hanya untuk inspirasi, termasuk foto kategori artificial dan money bouquet yang bukan dokumentasi produk tersebut.
- Alamat, jam operasional, pin Google Maps, opsi kustomisasi, ketersediaan, dan waktu pengerjaan: DATA REQUIRED.
- Font Google Fonts bersifat opsional; Georgia dan Arial menjadi fallback.

Semua pesanan menuju WhatsApp. Tidak ada keranjang, pembayaran, akun, atau penyimpanan informasi pengunjung. Tombol WhatsApp membuka tab baru; tidak mengirim pesan otomatis.

## Foto inspirasi

Sumber foto stok: Unsplash. ID foto tercatat dalam `assets/images/SOURCES.md`. Ganti dengan foto milik klien sebelum produksi dan pastikan hak penggunaan aset final.
