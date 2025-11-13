# 🛠️ Development Guide (Without Docker)

Panduan lengkap untuk menjalankan WazMind tanpa Docker untuk development lokal.

## Prerequisites

### Backend
- Python 3.10 atau lebih tinggi
- pip (Python package manager)

### Frontend
- Node.js 18 atau lebih tinggi
- npm atau yarn

## Setup Backend

1. **Masuk ke direktori backend:**
   ```bash
   cd backend
   ```

2. **Buat virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Linux/Mac
   # atau
   venv\Scripts\activate  # Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables:**
   
   Buat file `.env` di **root directory** (recommended) atau di `backend/`:
   ```bash
   # Option 1: Di root directory (recommended)
   cd ..  # Kembali ke root wazmind/
   cp .env.example .env
   # Edit .env dan tambahkan GEMINI_API_KEY Anda
   
   # Option 2: Di backend directory
   cat > .env << EOF
   GEMINI_API_KEY=your-gemini-api-key-here
   DATABASE_URL=sqlite:///./app.db
   UPLOAD_DIR=./uploads
   SECRET_KEY=supersecret
   MAX_UPLOAD_SIZE_MB=10
   ALLOWED_ORIGINS=http://localhost:5173
   EOF
   ```
   
   Backend akan otomatis mencari `.env` di root directory terlebih dahulu, kemudian di `backend/` jika tidak ditemukan.

5. **Buat direktori uploads:**
   ```bash
   mkdir -p uploads
   ```

6. **Jalankan backend:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   Backend akan berjalan di: http://localhost:8000
   API docs: http://localhost:8000/docs

## Setup Frontend

1. **Buka terminal baru dan masuk ke direktori frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables (optional):**
   
   Buat file `.env` di direktori `frontend/` jika ingin custom API URL:
   ```bash
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

   Default sudah menggunakan `http://localhost:8000` di `vite.config.js`.

4. **Jalankan frontend:**
   ```bash
   npm run dev
   ```

   Frontend akan berjalan di: http://localhost:5173

## Troubleshooting

### Backend Issues

1. **Module not found:**
   ```bash
   # Pastikan virtual environment aktif
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Port 8000 sudah digunakan:**
   ```bash
   # Gunakan port lain
   uvicorn app.main:app --reload --port 8001
   ```

3. **Database error:**
   ```bash
   # Hapus database lama
   rm app.db
   # Restart server (database akan dibuat otomatis)
   ```

4. **Gemini API Error:**
   - Pastikan `GEMINI_API_KEY` sudah diisi di `.env`
   - Pastikan API key valid dan memiliki quota

### Frontend Issues

1. **Port 5173 sudah digunakan:**
   ```bash
   # Vite akan otomatis menggunakan port berikutnya
   # Atau edit vite.config.js untuk port custom
   ```

2. **Cannot connect to backend:**
   - Pastikan backend sudah running di port 8000
   - Check `VITE_API_URL` di `.env` atau `vite.config.js`
   - Check CORS settings di backend

3. **Module not found:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Development Workflow

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Browser:**
   - Buka http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## File Structure untuk Development

```
wazmind/
├── backend/
│   ├── app/
│   ├── uploads/          # File uploads (auto-created)
│   ├── app.db            # SQLite database (auto-created)
│   ├── .env              # Environment variables
│   ├── venv/             # Virtual environment
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── node_modules/     # Dependencies
│   ├── .env              # Frontend env (optional)
│   └── package.json
└── .env.example
```

## Hot Reload

- **Backend**: Menggunakan `--reload` flag, akan auto-restart saat file Python berubah
- **Frontend**: Vite secara default sudah hot-reload, perubahan akan langsung terlihat di browser

## Testing API

Setelah backend running, test dengan:

```bash
# Health check
curl http://localhost:8000/health

# List files
curl http://localhost:8000/api/upload

# List jobs
curl http://localhost:8000/api/jobs
```

Atau buka http://localhost:8000/docs untuk interactive API documentation.

