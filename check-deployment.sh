#!/bin/bash

# Mock Interview Assistant - Deployment Check Script
echo "🔍 Running deployment readiness checks..."
echo ""

errors=0

# Check 1: Git repository
if [ -d .git ]; then
    echo "✅ Git repository initialized"
else
    echo "❌ Git repository not found. Run: git init"
    errors=$((errors+1))
fi

# Check 2: .env file exists
if [ -f .env ]; then
    echo "✅ .env file exists"
    if grep -q "your_groq_api_key_here" .env; then
        echo "⚠️  WARNING: .env still has placeholder API key"
    fi
else
    echo "❌ .env file missing"
    errors=$((errors+1))
fi

# Check 3: Procfile
if [ -f Procfile ]; then
    echo "✅ Procfile exists"
else
    echo "❌ Procfile missing"
    errors=$((errors+1))
fi

# Check 4: runtime.txt
if [ -f runtime.txt ]; then
    echo "✅ runtime.txt exists"
else
    echo "❌ runtime.txt missing"
    errors=$((errors+1))
fi

# Check 5: Requirements file
if [ -f requirements.txt ]; then
    echo "✅ requirements.txt exists"
    if grep -q "gunicorn" requirements.txt; then
        echo "✅ gunicorn found in requirements"
    else
        echo "⚠️  WARNING: gunicorn not found in requirements.txt"
    fi
else
    echo "❌ requirements.txt missing"
    errors=$((errors+1))
fi

# Check 6: Frontend .env.production
if [ -f mock-interview-assistant/.env.production ]; then
    echo "✅ Frontend .env.production exists"
    if grep -q "your-backend-url" mock-interview-assistant/.env.production; then
        echo "⚠️  WARNING: Update backend URL in .env.production"
    fi
else
    echo "⚠️  Frontend .env.production missing (create after backend deployment)"
fi

# Check 7: Node modules
if [ -d mock-interview-assistant/node_modules ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed. Run: cd mock-interview-assistant && npm install"
fi

# Check 8: Python packages
if [ -d venv ]; then
    source venv/bin/activate
    if python -c "import flask" 2>/dev/null; then
        echo "✅ Backend dependencies installed"
    else
        echo "⚠️  Backend dependencies not installed. Run: pip install -r requirements.txt"
    fi
    deactivate
else
    echo "⚠️  Virtual environment not found"
fi

echo ""
echo "================================"
if [ $errors -eq 0 ]; then
    echo "✅ All critical checks passed!"
    echo "📚 Read DEPLOYMENT.md for deployment instructions"
else
    echo "❌ Found $errors error(s). Please fix them before deploying."
fi
echo "================================"
