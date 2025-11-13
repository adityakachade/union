#!/bin/bash

# Setup script for backend environment

echo "🔧 Setting up backend environment..."
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Create .env file
cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
# For free PostgreSQL, use Supabase, Neon, or ElephantSQL (see ../DATABASE_SETUP.md)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional - leave empty to skip email notifications)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file and update your database credentials"
echo "   2. For free PostgreSQL database, see: ../DATABASE_SETUP.md"
echo "   3. Run: npm run dev"
echo ""

