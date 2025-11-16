# Contributing to WazMind

Thank you for your interest in contributing to WazMind! 🎉

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/inog9/WazMind/issues)
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Python version, Node version)

### Suggesting Features

1. Check existing [Issues](https://github.com/inog9/WazMind/issues) and [Discussions](https://github.com/inog9/WazMind/discussions)
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes:**
   ```bash
   # Backend tests
   cd backend
   pytest
   
   # Frontend tests (if applicable)
   cd frontend
   npm test
   ```

5. **Commit your changes:**
   ```bash
   git commit -m "feat: Add your feature description"
   ```
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request:**
   - Provide a clear description
   - Reference related issues
   - Add screenshots if UI changes

## Development Setup

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup instructions.

### Quick Start

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/WazMind.git
   cd WazMind
   ```

2. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Install dependencies:
   ```bash
   # Backend
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. Run development servers:
   ```bash
   # Terminal 1: Backend
   cd backend
   uvicorn app.main:app --reload
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

## Code Style

### Python (Backend)

- Follow PEP 8
- Use type hints where possible
- Maximum line length: 100 characters
- Use `black` or `autopep8` for formatting (optional)

### JavaScript/React (Frontend)

- Use ES6+ features
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable names

## Project Structure

```
WazMind/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── services/     # External service clients
│   │   ├── utils/         # Utility functions
│   │   └── main.py        # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   └── utils/        # Utility functions
│   └── package.json
└── README.md
```

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for meaningful test coverage

## Questions?

Feel free to:
- Open a [Discussion](https://github.com/inog9/WazMind/discussions)
- Ask in an issue
- Contact maintainers

Thank you for contributing! 🙏

