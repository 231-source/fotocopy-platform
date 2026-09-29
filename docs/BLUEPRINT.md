# Blueprint Platform Usaha Fotokopi Universal

## 1. Tujuan Produk

Platform operasional usaha fotokopi yang dapat digunakan oleh berbagai pelaku usaha secara umum, mulai dari toko kecil, fotokopi sekolah/kampus, digital printing, hingga percetakan kecil dan usaha jasa dokumen.

Tujuan utama:
- Memudahkan pelanggan memesan layanan tanpa akun rumit.
- Memastikan pembayaran terjadi sebelum pekerjaan diproses.
- Membantu operator menangani pesanan dengan workflow yang sederhana.
- Memungkinkan pemilik usaha mengatur toko, layanan, harga, printer, dan laporan secara mandiri.
- Menyediakan desain multi-tenant agar satu aplikasi dapat melayani banyak usaha dalam satu platform.

## 2. Prinsip Utama Sistem

1. Mudah digunakan oleh orang awam.
2. Pembayaran harus terjadi sebelum job diproses.
3. Operator tidak perlu memahami teknis backend, printer, atau database.
4. Semua harga bersumber dari data konfigurasi, bukan hardcode.
5. Tiap usaha memiliki isolasi data yang aman.
6. Sistem harus fokus pada operasional nyata usaha fotokopi, bukan fitur yang berlebihan.
7. Prioritas pengembangan:
   - Kemudahan penggunaan
   - Keamanan
   - Keandalan transaksi
   - Pembayaran sebelum proses
   - Kemudahan operasional printer
   - Fleksibilitas layanan dan harga
   - Multi-tenant
   - Pencatatan transaksi
   - Laporan keuangan
   - Analisis bisnis
   - Fitur tambahan

## 3. Konsep Produk

### 3.1 Sisi Pelanggan
Fungsi utama:
- Pilih toko
- Pilih layanan
- Masukkan detail pekerjaan
- Upload file jika diperlukan
- Lihat estimasi harga
- Bayar
- Dapatkan nomor pesanan
- Lacak status pesanan

### 3.2 Sisi Pelaku Usaha
Fungsi utama:
- Setup toko
- Atur profil usaha
- Atur jam operasional
- Kelola layanan dan harga
- Kelola printer dan komputer
- Menerima order yang sudah dibayar
- Menjalankan operasional print job
- Menangani status ready for pickup dan completion
- Melihat laporan keuangan dan transaksi

### 3.3 Sisi Operator
Fungsi utama:
- Melihat pesanan baru dan yang dibayar
- Membuat pekerjaan di antrean
- Menerima notifikasi printer masalah
- Mengambil hasil print
- Menandai pesanan selesai

## 4. User Flow Utama

### 4.1 Flow Pelanggan
1. Pelanggan membuka halaman toko.
2. Melihat status toko buka/tutup.
3. Memilih layanan.
4. Mengisi detail pesanan.
5. Upload file jika diperlukan.
6. Sistem menghitung total.
7. Pelanggan memilih metode pembayaran.
8. Pembayaran berhasil.
9. Sistem menyiapkan order dan print job.
10. Pelanggan menerima nomor pesanan.
11. Pelanggan memantau status.
12. Setelah selesai, pelanggan mengambil hasil.

### 4.2 Flow Operator
1. Operator login dengan role operator.
2. Dashboard menampilkan:
   - Pesanan baru
   - Sedang diproses
   - Siap diambil
   - Selesai
   - Gagal
3. Operator melihat order yang telah dibayar.
4. Sistem menampilkan job yang siap diproses.
5. Operator mengambil hasil dari printer.
6. Operator menekan "Pesanan Diserahkan".
7. Status order berubah menjadi COMPLETED.

### 4.3 Flow Pemilik
1. Daftar dan menyiapkan toko.
2. Mengisi profil usaha.
3. Menentukan layanan yang tersedia.
4. Mengatur harga.
5. Menyambungkan komputer dan printer.
6. Mengelola pengguna dan role.
7. Meninjau laporan keuangan, transaksi, dan performance.

## 5. Status Order dan Payment

### 5.1 Payment Status
- PENDING
- PAID
- FAILED
- EXPIRED
- REFUNDED

### 5.2 Order Status
- WAITING_PAYMENT
- PAID
- QUEUED
- PROCESSING
- READY_FOR_PICKUP
- COMPLETED
- CANCELLED
- PAYMENT_FAILED

Aturan penting:
- Order tidak bisa diproses sebelum pembayaran valid.
- Print job tidak dibuat sebelum pembayaran PAID.
- Status tidak boleh berpindah secara sembarangan.
- Siklus default:
  WAITING_PAYMENT -> PAID -> QUEUED -> PROCESSING -> READY_FOR_PICKUP -> COMPLETED

## 6. Payment Strategy

Versi awal akan mendukung:
- Cash
- QRIS
- Transfer

Strategi:
- Untuk payment gateway, gunakan webhook untuk validasi pembayaran.
- Untuk pembayaran manual, operator atau admin akan mengonfirmasi status pembayaran.
- Jangan menganggap pembayaran berhasil hanya karena tombol "saya sudah bayar" ditekan.
- Sistem harus mengunci order sebelum pembayaran, sehingga tidak ada print job yang dibuat sebelum validasi berhasil.

## 7. Print Job dan Print Routing

### 7.1 Print Job Status
- QUEUED
- PROCESSING
- COMPLETED
- FAILED
- CANCELLED

### 7.2 Data Print Job
- job_id
- order_id
- file_id
- original_filename
- page_count
- copy_count
- paper_size
- color_mode
- duplex
- assigned_printer_id
- status
- created_at
- processed_at
- completed_at

### 7.3 Routing Printer
Versi sederhana:
- 1 layanan -> 1 printer default
- Contoh:
  - Print A4 warna -> Printer Warna
  - Fotokopi A4 -> Printer Fotokopi
  - Laminasi -> Tidak memakai printer

Untuk toko multi-printer:
- Pemilik dapat memilih printer tujuan per layanan.
- Jika printer offline, job tetap berada di antrean sampai operator memperbaiki masalah atau mengganti printer.

## 8. Local Print Agent

### Tujuan
Menyembunyikan kompleksitas integrasi printer dari operator. Operator tidak perlu memahami command line, API, atau IP printer.

### Arsitektur
Web App -> Backend -> Local Print Agent -> Printer

### Fungsionalitas Local Print Agent
- Register komputer toko
- Detect printer yang terhubung
- Menentukan status online/offline
- Menerima tugas dari backend
- Mengirim status job ke backend
- Melaporkan error sederhana ke operator

### UX sederhana
- Tombol: "Hubungkan Komputer Ini"
- Proses otomatis:
  - Komputer terdeteksi
  - Printer ditemukan
  - Operator memilih printer
  - Tes cetak

### Pesan error yang ramah
- Bukan: ECONNREFUSED 127.0.0.1:3000
- Tetapi: "Komputer belum terhubung ke sistem. Silakan periksa koneksi."

## 9. Multi-Tenant Architecture

Platform ini harus dirancang untuk banyak toko sekaligus.

Setiap entitas bisnis memiliki hubungan dengan store_id.

### Prinsip isolation
- Toko A tidak dapat melihat data Toko B.
- Setiap pengguna hanya dapat mengakses toko yang menjadi haknya.
- Semua order, pelanggan, harga, printer, transaksi, laporan, dan file harus dibatasi store_id.

### Role model
- OWNER: akses penuh ke toko
- ADMIN: mengelola operational settings, transaksi, layanan, pelanggan, printer, inventory
- OPERATOR: fokus pada kegiatan operasional, tidak bisa ubah harga atau akses data keuangan sensitif bila dibatasi

## 10. Database Design

Database relational: PostgreSQL

### Tabel utama
- stores
- users
- roles
- store_users
- customers
- services
- service_categories
- service_prices
- orders
- order_items
- payments
- files
- print_jobs
- printers
- computers
- print_agents
- expenses
- inventory
- inventory_transactions
- notifications
- audit_logs
- store_settings

### Penjelasan inti
#### stores
- id
- name
- slug
- address
- phone
- email
- description
- is_open
- operating_hours
- holiday_days
- whatsapp_enabled
- created_at
- updated_at

#### users
- id
- email
- password_hash
- name
- phone
- role_id
- store_id
- is_active

#### services
- id
- store_id
- category_id
- name
- slug
- description
- unit
- is_active
- requires_file
- requires_printer
- estimated_minutes

#### service_prices
- id
- store_id
- service_id
- price
- effective_from
- effective_to
- is_active

#### orders
- id
- store_id
- order_number
- customer_id
- status
- payment_status
- subtotal
- total
- notes
- created_at
- updated_at

#### order_items
- id
- store_id
- order_id
- service_id
- description
- quantity
- unit_price
- total_price
- file_id

#### payments
- id
- store_id
- order_id
- payment_method
- payment_status
- external_reference
- amount
- paid_at
- confirmed_by

#### print_jobs
- id
- store_id
- order_id
- printer_id
- file_id
- job_number
- status
- page_count
- copy_count
- paper_size
- color_mode
- duplex
- created_at
- processed_at
- completed_at

#### printers
- id
- store_id
- name
- status
- is_online
- is_busy
- last_seen_at
- default_for_service_id

#### computers
- id
- store_id
- name
- is_online
- last_seen_at
- assigned_agent_id

#### expenses
- id
- store_id
- category
- amount
- description
- recorded_by
- recorded_at

## 11. Struktur Folder Monorepo

```text
/fotocopy-platform
  /apps
    /web
    /api
    /print-agent
  /packages
    /database
    /types
    /ui
    /config
    /validation
  /docs
  /tests
  README.md
  .env.example
  .gitignore
```

### Penjelasan
- apps/web: frontend customer dan operator
- apps/api: backend REST API, auth, business logic
- apps/print-agent: agent lokal yang berkomunikasi dengan printer
- packages/database: migration, schema, seeder
- packages/types: shared type definitions
- packages/ui: komponen UI reusable
- packages/config: env config, lint, ts config
- packages/validation: validasi input, domain rules

## 12. Stack Teknologi

### Frontend
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- TypeScript
- Express/NestJS (pilihan yang sederhana dan aman)

### Database
- PostgreSQL

### Realtime
- Socket.IO / WebSocket

### Storage file pelanggan
- Object storage private
- Signed URL atau URL sementara

### Authentication
- JWT atau secure session

### Local Print Agent
- Node.js atau Python

## 13. API Design (Blueprint)

### Core endpoints
#### Auth
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me

#### Store
- POST /api/stores
- GET /api/stores/:id
- PATCH /api/stores/:id

#### Services
- GET /api/stores/:storeId/services
- POST /api/stores/:storeId/services
- PATCH /api/stores/:storeId/services/:id
- DELETE /api/stores/:storeId/services/:id

#### Prices
- GET /api/stores/:storeId/service-prices
- POST /api/stores/:storeId/service-prices
- PATCH /api/stores/:storeId/service-prices/:id

#### Orders
- POST /api/stores/:storeId/orders
- GET /api/stores/:storeId/orders
- GET /api/stores/:storeId/orders/:id
- PATCH /api/stores/:storeId/orders/:id/status

#### Payments
- POST /api/stores/:storeId/orders/:id/payments
- GET /api/stores/:storeId/orders/:id/payments
- POST /api/webhooks/payment

#### Print Jobs
- GET /api/stores/:storeId/print-jobs
- POST /api/stores/:storeId/print-jobs
- PATCH /api/stores/:storeId/print-jobs/:id/status

#### Printers
- GET /api/stores/:storeId/printers
- POST /api/stores/:storeId/printers
- PATCH /api/stores/:storeId/printers/:id

#### Reports
- GET /api/stores/:storeId/reports/summary
- GET /api/stores/:storeId/reports/revenue
- GET /api/stores/:storeId/reports/expense

## 14. Security dan File Safety

### Keamanan wajib
- HTTPS
- Password hashing
- Authentication
- Authorization
- Role-based access
- Tenant isolation
- Input validation
- File validation
- File size limit
- Rate limiting
- Secure headers
- CORS
- SQL injection protection
- XSS protection
- Session/JWT yang aman
- Audit log
- Backup database

### File pelanggan
- Upload file hanya untuk kebutuhan order
- File disimpan di private storage
- Access hanya melalui signed URL atau mekanisme aman
- Validasi extension dan MIME type
- Nama file internal unik
- Batas ukuran file
- Retention policy
- Jangan simpan file selamanya jika tidak diperlukan

## 15. UI/UX Direction

### Desain visual
- Clean
- Simple
- Modern
- Responsive
- Desktop-first
- Touch-friendly

### Bahasa
- Menggunakan bahasa Indonesia untuk seluruh UI operasional.

### Contoh kata yang disarankan
- Gunakan "Pesanan Baru" bukan "Create Order"
- Gunakan "Printer Tidak Terhubung" bukan "Printer Connection Failed"
- Gunakan "Pembayaran Belum Diterima" bukan "Payment Status Pending"

### Layout prioritas
- Dashboard pemilik
- Dashboard operator
- Halaman checkout sederhana pelanggan
- Halaman status order pelanggan
- Pengaturan toko

## 16. Profil Usaha dan Setup Awal

### Setup awal toko
1. Nama usaha
2. Alamat usaha
3. Nomor WhatsApp
4. Jam operasional
5. Pilih layanan yang tersedia
6. Atur harga
7. Hubungkan komputer/printer jika diperlukan

### Profil usaha yang bisa diatur
- Nama usaha
- Logo
- Alamat
- WhatsApp
- Email
- Deskripsi usaha
- Jam operasional
- Hari operasional
- Hari libur
- Status buka/tutup

### Status toko otomatis
- BUKA
- TUTUP

Jika toko tutup, pelanggan tidak dapat membuat pesanan baru kecuali opsi "terima pesanan di luar jam operasional" aktif.

## 17. Layanan dan Harga

### Kategori umum
- PRINTING
- FOTOKOPI
- DOKUMEN
- FINISHING
- LAINNYA

### Properti layanan
- Nama layanan
- Kategori
- Deskripsi
- Harga
- Satuan
- Status aktif/nonaktif
- Estimasi waktu
- Memerlukan file / tidak
- Memerlukan printer / tidak

### Satuan layanan
- Per lembar
- Per halaman
- Per dokumen
- Per file
- Per item
- Per meter
- Per paket

### Aturan harga
- Harga baru berlaku untuk transaksi baru saja.
- Harga transaksi lama tetap sesuai saat transaksi dibuat.
- Harga tidak hardcoded.
- Dapat dibuat fleksibel berdasarkan ukuran, warna, jenis kertas, duplex, jumlah, finishing, dll.

## 18. Dashboard dan Fungsi Operasional

### Dashboard Operator
- Pesanan Baru
- Sedang Diproses
- Siap Diambil
- Selesai
- Gagal

### Dashboard Pemilik
- Hari ini
  - Transaksi
  - Pendapatan
  - Pengeluaran
  - Profit
  - Pesanan aktif
  - Layanan terlaris
- Grafik:
  - Pendapatan harian
  - Pendapatan mingguan
  - Pendapatan bulanan
  - Jumlah transaksi
  - Layanan terlaris
  - Pengeluaran
  - Profit

### Riwayat transaksi
Pencarian berdasarkan:
- Nomor transaksi
- Nama pelanggan
- WhatsApp
- Tanggal
- Layanan
- Status

## 19. Keuangan

### Perhitungan otomatis
- Total penjualan
- Total transaksi
- Total pembayaran
- Total pengeluaran
- Estimasi profit

### Pengeluaran yang bisa dicatat
- Kertas
- Tinta
- Toner
- Listrik
- Sewa
- Maintenance
- Gaji
- ATK
- Biaya lainnya

### Rumus
Profit = Revenue - Expense

## 20. Inventory (Opsional)

Fitur inventory bersifat opsional dan dapat diaktifkan oleh pemilik.

Contoh item inventory:
- Kertas A4
- Kertas F4
- Toner
- Laminasi A4

### Parameter inventory
- Nama barang
- Stok
- Satuan
- Status digunakan atau tidak digunakan
- Harga per item

## 21. Rencana Pengembangan Per Phase

### PHASE 1: Project setup
- Project setup monorepo
- Database foundation
- Multi-tenant architecture
- Authentication
- User roles
- Store registration

### PHASE 2: Store setup
- Profil toko
- Jam operasional
- Kategori layanan
- Layanan
- Harga

### PHASE 3: Customer ordering
- Cart
- Order
- Upload file
- Price calculation

### PHASE 4: Payment
- Payment status
- Payment confirmation
- Order locking sebelum pembayaran

### PHASE 5: Operator dashboard
- Order queue
- Order status
- Order completion

### PHASE 6: Print system
- Print job
- Computer registration
- Printer registration
- Local Print Agent

### PHASE 7: Customer tracking
- Order tracking
- WhatsApp notification jika diperlukan

### PHASE 8: Finance
- Revenue
- Expense
- Profit
- Reports

### PHASE 9: Inventory
- Stock
- Material usage

### PHASE 10: Analytics
- Charts
- Business dashboard

### PHASE 11: Security
- Audit log
- File security
- Backup
- Rate limiting

### PHASE 12: Testing
- Integration testing
- End-to-end testing
- Printer testing
- Payment testing

### PHASE 13: Deployment
- Production configuration
- Monitoring
- Backup
- Documentation

## 22. Prinsip Implementasi yang Harus Dipatuhi

- Jangan membuat seluruh aplikasi sekaligus.
- Setiap phase harus dapat dijalankan dan dites sebelum melanjutkan ke fase berikutnya.
- Fokus pada operasional usaha nyata.
- Hindari fitur yang tidak memberi manfaat langsung.
- Pilih solusi yang paling sederhana, aman, murah, dan mudah dipakai.
- Jangan menambahkan kompleksitas tanpa kebutuhan teknis yang jelas.

## 23. MVP yang Direkomendasikan

Untuk tahap awal, fokus pada:
- Multi-tenant store
- Auth & role
- Store setup
- Service catalog + pricing
- Customer order form
- Payment flow with order lock
- Order dashboard operator
- Print job workflow
- Printer/computer registration
- Basic reporting

Setelah MVP stabil, lanjut ke:
- Inventory
- WhatsApp notification
- Advanced analytics
- Finance report detail
- Audit & security hardening

## 24. Keputusan Teknis Default

Jika tidak ada keputusan final dari tim, pilih solusi paling sederhana:
- React + TypeScript + Tailwind
- Node.js + TypeScript
- PostgreSQL
- REST API
- JWT or secure session
- Private object storage
- Socket.IO untuk update real-time ringan
- Local Print Agent berbasis Node.js
- Monorepo dengan apps dan packages

## 25. Kesimpulan

Blueprint ini menempatkan prioritas utama pada:
- kemudahan penggunaan bagi pelanggan dan operator,
- keamanan data dan file pelanggan,
- jaminan pembayaran sebelum diproses,
- workflow operasional yang konsisten,
- desain multi-tenant yang aman,
- kemampuan ekspansi ke fase berikutnya tanpa membangun ulang sistem.

Inilah fondasi yang akan digunakan untuk memulai PHASE 1. Setelah blueprint ini disetujui, kita akan memulai pembuatan struktur proyek, konfigurasi database, auth, dan tenant isolation secara bertahap.

## 26. File Dokumen

Dokumen blueprint ini dapat dijadikan referensi utama untuk sprint pengembangan awal.

---

Status: Blueprint lengkap disiapkan.

Tahap berikutnya: PHASE 1 - Project setup, database, multi-tenant architecture, authentication, roles, dan store registration.
