# 🚀 Quick Start Guide

## Prerequisites

- Python 3.10+ and Node.js 18+
- Groq API Key (get it from [Groq Console](https://console.groq.com/))
- Auth0 Account (sign up at [auth0.com](https://auth0.com/))

## Setup Steps

1. **Clone and navigate to project:**
   ```bash
   cd wazmind
   ```

2. **Setup Environment Variables:**
   
   Copy `.env.example` to `.env` in root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in all values:
   - `GROQ_API_KEY` - Your Groq API key
   - `VITE_AUTH0_DOMAIN` - Your Auth0 domain
   - `VITE_AUTH0_CLIENT_ID` - Your Auth0 client ID
   
   **Note:** Both backend and frontend read from the same `.env` file.
   
   See [AUTH0_SETUP.md](AUTH0_SETUP.md) for Auth0 configuration.

4. **Install and Run:**
   
   **Backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
   
   **Frontend (new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Usage

1. **Sign In:**
   - Click "Sign In" button on homepage
   - Authenticate with Auth0 (Google, GitHub, or email)

2. **Upload a log file:**
   - Drag & drop or browse to upload log file
   - Supports .log, .txt, .json, and .csv formats
   - File will appear in the list after upload

3. **Generate a rule:**
   - Click "Generate Rule" on the uploaded file
   - Job status will appear in "Generation Jobs" section
   - Wait for completion (status updates automatically)

4. **View and export rule:**
   - Once job is completed, click on the rule
   - Review the generated Wazuh rule XML
   - Edit if needed, then download or copy

## Manual Development (without Docker)

### Setup Backend

1. **Masuk ke direktori backend:**
   ```bash
   cd backend
   ```

2. **Buat virtual environment:**
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

4. **Buat file `.env` di root directory (atau di backend/):**
   ```bash
   # Di root directory (recommended):
   cp .env.example .env
   # Edit .env dan tambahkan GROQ_API_KEY Anda
   
   # Atau di backend/:
   cp ../.env.example backend/.env
   ```

5. **Buat direktori uploads:**
   ```bash
   mkdir -p uploads
   ```

6. **Jalankan backend:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Setup Frontend

1. **Buka terminal baru dan masuk ke direktori frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan frontend:**
   ```bash
   npm run dev
   ```

### Akses Aplikasi

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

📖 **Lihat [DEVELOPMENT.md](DEVELOPMENT.md) untuk panduan lengkap development tanpa Docker.**

## Troubleshooting

- **Pip not found in venv:** Remove/recreate venv then reinstall deps:
  ```bash
  cd backend
  rm -rf venv
  python3 -m venv --upgrade-deps venv
  source venv/bin/activate
  python -m pip install -r requirements.txt
  ```
- **Node ERR_MODULE_NOT_FOUND (vite cli):** Reinstall frontend deps:
  ```bash
  cd frontend
  rm -rf node_modules
  npm install
  ```
- **API Key Error:** Make sure `GROQ_API_KEY` is set correctly in `.env`
- **Port already in use:** Change ports in `docker-compose.yml`
- **Database errors:** Delete `backend/data/app.db` and restart

