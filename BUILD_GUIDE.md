# Fixnado Platform - Build & Deployment Guide

This guide explains how to build and run the Fixnado platform (front-end, back-end, and database).

## ✅ Build Status

All components have been successfully built and configured:

- ✅ PostgreSQL Database (v17 with PostGIS)
- ✅ Backend API (Node.js/Express)
- ✅ Frontend (React/Vite)

## 🗄️ Database Setup

### PostgreSQL with PostGIS

The database has been installed and configured with:

- **Database Name**: `fixnado`
- **User**: `fixnado_service`
- **Password**: `fixnado_dev_password_1234567890`
- **Extensions**: pgcrypto, uuid-ossp, postgis, postgis_topology

### Managing PostgreSQL

```bash
# Start PostgreSQL
sudo service postgresql start

# Stop PostgreSQL
sudo service postgresql stop

# Check status
sudo service postgresql status

# Connect to database
PGPASSWORD=fixnado_dev_password_1234567890 psql -h localhost -U fixnado_service -d fixnado
```

## 🔧 Backend API

### Build

The backend has been built successfully:

```bash
cd backend-nodejs
npm run build
```

Build output is in `backend-nodejs/dist/`

### Configuration

Environment variables are configured in `backend-nodejs/.env`:

- Database connection settings
- JWT secret for authentication
- Feature flags (Secrets Manager disabled for local dev)

### Running

```bash
# Development mode (with auto-reload)
cd backend-nodejs
npm run dev

# Production mode
cd backend-nodejs
npm start
```

The API runs on **http://localhost:4000**

### Key Endpoints

- `GET /health` - Health check
- `GET /api/*` - API routes

## 🎨 Frontend Application

### Build

The frontend has been built successfully:

```bash
cd frontend-reactjs
npm run build
```

Build output is in `frontend-reactjs/dist/`

### Running

```bash
# Development mode (with hot reload)
cd frontend-reactjs
npm run dev

# Preview production build
cd frontend-reactjs
npm run preview
```

The frontend runs on **http://localhost:3000**

### Build Artifacts

The production build includes:
- Optimized JavaScript bundles
- CSS assets with TailwindCSS
- Code-split chunks for better performance
- Compressed assets (gzip)

Total bundle size: ~2.8 MB (before gzip)

## 🚀 Quick Start

### Option 1: Using the Startup Script

```bash
chmod +x start-services.sh
./start-services.sh
```

This script will:
1. Start PostgreSQL
2. Start the backend API
3. Start the frontend dev server
4. Display service URLs and process IDs

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend-nodejs
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend-reactjs
npm run dev
```

### Option 3: Using Docker Compose (if Docker is available)

A `docker-compose.yml` file has been created for future use when Docker is available:

```bash
docker compose up
```

This will start:
- PostgreSQL container
- Backend container
- Frontend container

## 📦 Dependencies

### Backend

- Node.js >= 20.11.1
- Express 5.1.0
- Sequelize 6.37.7
- PostgreSQL (pg) 8.13.1
- JWT, bcrypt, helmet, cors
- Various AWS SDK packages

**Installed packages**: 773

### Frontend

- React 18.3.1
- Vite 6.0.11
- TailwindCSS 3.4.18
- React Router 6.30.1
- Axios, Framer Motion, MapLibre GL

**Installed packages**: 567

## 🔍 Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Check PostgreSQL is running:
   ```bash
   sudo service postgresql status
   ```

2. Verify database exists:
   ```bash
   sudo -u postgres psql -c "\l" | grep fixnado
   ```

3. Test connection:
   ```bash
   PGPASSWORD=fixnado_dev_password_1234567890 psql -h localhost -U fixnado_service -d fixnado -c "SELECT 1;"
   ```

### Port Already in Use

If ports 3000 or 4000 are already in use:

**Backend:**
Edit `backend-nodejs/.env` and change `PORT=4000` to another port

**Frontend:**
Run with custom port: `npm run dev -- --port 3001`

### Missing Dependencies

If you encounter missing dependencies:

```bash
cd backend-nodejs && npm install
cd ../frontend-reactjs && npm install
```

## 📝 Environment Files

### Backend (.env)

Located at `backend-nodejs/.env`:
- Database credentials
- JWT secret
- Feature flags
- AWS configuration (disabled for local dev)

### Frontend

Environment variables can be set in `frontend-reactjs/.env`:
```bash
VITE_API_URL=http://localhost:4000
```

## 🧪 Testing

### Backend Tests

```bash
cd backend-nodejs
npm test
```

### Frontend Tests

```bash
cd frontend-reactjs
npm test
```

## 📊 Build Information

### Backend Build Output

- Source files copied to `dist/src/`
- SQL scripts copied to `dist/sql/`
- Dependencies listed in `dist/package.json`
- Production-ready build

### Frontend Build Output

- Optimized bundles with code splitting
- CSS extracted and minified
- Gzip-compressed assets
- Static assets in `dist/assets/`
- Entry point: `dist/index.html`

## 🔐 Security Notes

**⚠️ Important:** The current configuration uses development credentials:

- Database password: `fixnado_dev_password_1234567890`
- JWT secret: `dev_jwt_secret_change_in_production_min_32_chars_required`

**These MUST be changed before deploying to production!**

For production:
1. Enable AWS Secrets Manager (`SECRETS_MANAGER_ENABLED=true`)
2. Use strong, randomly generated secrets
3. Enable database SSL/TLS
4. Configure proper CORS settings
5. Enable HTTPS

## 📖 Additional Documentation

- Backend API documentation: `backend-nodejs/README.md`
- Frontend documentation: `frontend-reactjs/README.md`
- Architecture overview: `docs/architecture/platform-architecture.md`
- Deployment guide: `docs/ops/environment-promotion-checklist.md`

## 🎯 Next Steps

1. **Start the services** using the startup script or manually
2. **Access the application** at http://localhost:3000
3. **Review the API** at http://localhost:4000
4. **Check the logs** for any errors or warnings
5. **Run tests** to ensure everything works correctly
6. **Configure production secrets** when ready to deploy

## 💡 Tips

- Use `npm run dev` for development (auto-reload enabled)
- Use `npm run build` for production builds
- Monitor logs in `/tmp/backend.log` and `/tmp/frontend.log`
- Database tables will be created automatically by Sequelize models on first run
- The backend validates PostGIS extensions on startup

## 📞 Support

For issues or questions:
- Check the logs: `/tmp/backend.log` and `/tmp/frontend.log`
- Review documentation in `docs/` directory
- Check the README files in each component directory
