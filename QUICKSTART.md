# 🚀 Quick Start Guide

## Prerequisites

- Docker & Docker Compose installed
- Groq API Key (get it from [Groq Console](https://console.groq.com/))

## Setup Steps

1. **Clone and navigate to project:**
   ```bash
   cd wazmind
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and add your Groq API key:**
   ```bash
   GROQ_API_KEY=your-actual-api-key-here
   GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
   ```

4. **Start the application:**
   ```bash
   docker-compose up --build
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Usage

1. **Upload a log file:**
   - Go to "Upload Log" tab
   - Select a log file (.log, .txt, .json, or .csv)
   - Click "Upload File"

2. **Generate a rule:**
   - After upload, click "Generate Rule" on the uploaded file
   - Go to "Jobs" tab to see the generation status
   - Wait for the job to complete (status will update automatically)

3. **View and export rule:**
   - Once job is completed, click "View Rule"
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

- **API Key Error:** Make sure `GROQ_API_KEY` is set correctly in `.env`
- **Port already in use:** Change ports in `docker-compose.yml`
- **Database errors:** Delete `backend/data/app.db` and restart

