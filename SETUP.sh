#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  CA Practice Management & Billing Tracker - Setup Guide       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Install Dependencies${NC}"
echo "Running: npm run install:all"
echo ""
npm run install:all

echo ""
echo -e "${YELLOW}Step 2: Configure Environment${NC}"
echo "MongoDB connection string needed in server/.env"
echo "Using default: mongodb://localhost:27017/ca-tracker"
echo ""
cd server
cp .env.example .env
echo -e "${GREEN}✓ Created server/.env from .env.example${NC}"
cd ..

echo ""
echo -e "${YELLOW}Step 3: Seed Database (Optional)${NC}"
echo "To populate database with demo data, run:"
echo "  cd server && npm run seed"
echo ""

echo ""
echo -e "${YELLOW}Step 4: Start Development Servers${NC}"
echo "Running: npm run dev"
echo ""
echo "This will start:"
echo "  - Backend: http://localhost:5000"
echo "  - Frontend: http://localhost:5173"
echo ""
echo -e "${GREEN}✓ Setup complete! Run 'npm run dev' to start.${NC}"
echo ""
