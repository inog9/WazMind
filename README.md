# 🧠 WazMind

AI-powered log intelligence for automated Wazuh rule generation.

Transform your security logs into production-ready Wazuh detection rules using advanced AI models.

## ✨ Features

- **Smart Upload** - Drag & drop log file uploads (.log, .txt, .json, .csv)
- **Pattern Detection** - Automatically detects IP addresses, timestamps, errors, and security patterns
- **AI Rule Generation** - Powered by Groq AI models for fast, accurate rule generation
- **Edit & Customize** - Review and edit generated rules before deployment
- **Bulk Operations** - Export multiple rules as ZIP files
- **Secure by Default** - XSS protection, input validation, secure file handling
- **Modern UI** - Dark/Light mode, responsive design, minimalist interface
- **Authentication** - Auth0 integration for secure access

## 🎨 UI/UX Features

### Homepage
- **Modern Hero Section** - Clean, minimalist design with gradient effects
- **Feature Highlights** - Key benefits displayed with clear visual hierarchy
- **Smooth Animations** - Subtle transitions and hover effects
- **Responsive Layout** - Optimized for desktop, tablet, and mobile devices

### Main Dashboard
- **File Upload Zone** - Large, intuitive drag-and-drop area with visual feedback
- **File Management** - Clean file cards with metadata (size, upload date)
- **Pattern Detection** - Interactive pattern analysis with expandable insights
- **Job Status Tracking** - Real-time updates with color-coded status indicators
- **Rule Viewer** - Syntax-highlighted XML editor with copy/download options

### Design System
- **Dark/Light Mode** - Seamless theme switching with persistent preference
- **Color Palette** - Blue-black theme with cyan accents for modern look
- **Typography** - Clear, readable fonts with proper hierarchy
- **Icons** - Consistent iconography throughout the interface
- **Spacing** - Generous whitespace for better readability

### User Experience
- **Toast Notifications** - Non-intrusive success/error messages
- **Loading States** - Skeleton loaders and progress indicators
- **Error Handling** - User-friendly error messages with actionable guidance
- **Keyboard Shortcuts** - Power user features for faster navigation
- **Accessibility** - WCAG-compliant design for inclusive access

## 📸 Screenshots

> **Note:** Screenshots will be added soon. For now, you can see the live application at `http://localhost:5173` after setup.

### Homepage
<img width="1440" height="744" alt="F473DD6C-C40C-48AC-8C3A-370D14C438D0" src="https://github.com/user-attachments/assets/2aa42042-49a5-4580-9fd9-102d46bdf454" />
```
- Modern hero section with gradient text
- Feature cards with icons
- Call-to-action buttons
```

### Dashboard
<img width="1438" height="676" alt="7B015782-3678-40C4-9990-635A11024A5D" src="https://github.com/user-attachments/assets/c6c3e217-2730-4333-9e9e-da29cfff14ff" />
```
- File upload zone
- Uploaded files list
- Generation jobs tracker
- Rule viewer panel
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Groq API Key ([Get one here](https://console.groq.com/))
- Auth0 Account ([Sign up here](https://auth0.com/))

### Setup

#### Option 1: Automated Setup (Recommended)

Run the setup script to automate the entire setup process:

```bash
git clone git@github.com:inog9/WazMind.git
cd WazMind
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check prerequisites (Python 3.10+, Node.js 18+)
- ✅ Set up backend (virtual environment, dependencies)
- ✅ Set up frontend (npm dependencies)
- ✅ Create `.env` file from `.env.example`
- ✅ Create necessary directories

After running the script, edit `.env` and add your API keys:
- `GROQ_API_KEY` - Your Groq API key (get from [Groq Console](https://console.groq.com/))
- `VITE_AUTH0_DOMAIN` - Your Auth0 domain
- `VITE_AUTH0_CLIENT_ID` - Your Auth0 client ID

See [AUTH0_SETUP.md](AUTH0_SETUP.md) for detailed Auth0 configuration.

#### Option 2: Manual Setup

1. **Clone the repository:**
   ```bash
   git clone git@github.com:inog9/WazMind.git
   cd WazMind
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration:**
   
   Copy `.env.example` to `.env` in root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in all values:
   - `GROQ_API_KEY` - Your Groq API key (for backend)
   - `VITE_AUTH0_DOMAIN` - Your Auth0 domain (for frontend)
   - `VITE_AUTH0_CLIENT_ID` - Your Auth0 client ID (for frontend)
   - Other values as needed
   
   **Note:** Both backend and frontend will read from the same `.env` file in root directory.
   
   See [AUTH0_SETUP.md](AUTH0_SETUP.md) for detailed Auth0 configuration.

5. **Run the application:**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📖 Documentation

- [Quick Start Guide](QUICKSTART.md) - Get started quickly
- [Development Guide](DEVELOPMENT.md) - Development without Docker
- [Auth0 Setup](AUTH0_SETUP.md) - Authentication configuration
- [Performance Guide](frontend/PERFORMANCE.md) - Frontend performance optimization

## 🏗️ Architecture

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Groq API** - AI model integration
- **SQLite** - Database (can be upgraded to PostgreSQL)

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Auth0** - Authentication
- **Axios** - HTTP client

## 🔒 Security

- XSS protection with input sanitization
- SQL injection prevention (SQLAlchemy ORM)
- Command injection protection
- Security headers (CSP, XSS-Protection, etc.)
- Rate limiting on API endpoints
- File upload validation

## 📦 Project Structure

```
wazmind/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── services/     # External services (Groq)
│   │   ├── utils/        # Utilities
│   │   ├── models.py     # Database models
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   └── utils/        # Utilities
│   └── package.json
└── README.md
```

## 🛠️ Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) - For providing fast AI inference
- [Auth0](https://auth0.com/) - For authentication services
- [Wazuh](https://www.wazuh.com/) - For the security monitoring platform
- [FastAPI](https://fastapi.tiangolo.com/) - For the amazing Python framework
- [React](https://react.dev/) - For the UI framework

