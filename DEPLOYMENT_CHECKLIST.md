# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Verification

### Backend Checks
- [x] All dependencies in `requirements.txt` are production-ready
- [x] Environment variables properly configured
- [x] Database connections use connection pooling
- [x] CORS settings allow frontend domain
- [x] Error handling implemented
- [x] Logging configured
- [x] API rate limiting (if needed)
- [x] HTTPS enforced in production

### Frontend Checks
- [x] All dependencies in `package.json` are production-ready
- [x] Environment variables configured (`.env.production`)
- [x] Build process tested (`npm run build`)
- [x] Assets optimized
- [x] Responsive design implemented
- [x] Browser compatibility tested
- [x] Error boundaries in place

### Critical Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# LiveKit
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Google AI
GEMINI_API_KEY=your_gemini_api_key

# BEY Avatar (if using)
BEY_API_KEY=your_bey_api_key
BEY_AVATAR_ID=your_avatar_id

# CORS (Important!)
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-domain.com
VITE_WS_URL=wss://your-backend-domain.com/ws
VITE_LIVEKIT_URL=wss://your-livekit-server.com
```

## 🔧 Known Deployment Issues & Solutions

### 1. **CORS Issues**
**Problem**: Frontend can't connect to backend in production
**Solution**: Update `backend/app/main.py` CORS settings:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Update this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. **WebSocket Connection Failures**
**Problem**: WebSocket connections fail in production
**Solution**: 
- Ensure your hosting supports WebSockets
- Use `wss://` (secure WebSocket) in production
- Check firewall/proxy settings

### 3. **LiveKit Connection Issues**
**Problem**: AI avatar doesn't connect
**Solution**:
- Verify LiveKit server is accessible
- Check HTTPS is enabled (required for camera/mic access)
- Ensure LiveKit credentials are correct
- Test LiveKit connection separately

### 4. **Camera Access Denied (Virtual Try-On)**
**Problem**: Camera doesn't work in production
**Solution**:
- **MUST use HTTPS** - browsers block camera on HTTP
- Add proper permissions in deployment
- Test on actual HTTPS domain

### 5. **Database Connection Pool Exhaustion**
**Problem**: "Too many connections" error
**Solution**: Already implemented in `backend/app/database.py`:
```python
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

### 6. **Static File Serving**
**Problem**: Images/assets not loading
**Solution**:
- Frontend: Build with `npm run build`, serve `dist` folder
- Backend: Ensure static file paths are correct

### 7. **Environment Variable Not Found**
**Problem**: App crashes due to missing env vars
**Solution**: Create `.env.production` files and verify all required vars are set

## 📦 Build Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run build
# Serve the 'dist' folder with nginx/apache/vercel
```

### Agent (LiveKit)
```bash
cd backend/app/agent
python agents.py dev  # For development
python agents.py start  # For production
```

## 🌐 Recommended Hosting

### Frontend
- **Vercel** (Recommended - Easy deployment)
- **Netlify**
- **AWS S3 + CloudFront**
- **Nginx** (Self-hosted)

### Backend
- **AWS EC2** (Full control)
- **Railway** (Easy Python deployment)
- **Render** (Simple deployment)
- **DigitalOcean App Platform**

### Database
- **Supabase** (PostgreSQL with pgvector support)
- **AWS RDS**
- **Neon** (Serverless PostgreSQL)

### LiveKit
- **LiveKit Cloud** (Recommended)
- **Self-hosted LiveKit**

## 🔒 Security Checklist

- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured (not `allow_origins=["*"]`)
- [ ] Database credentials secured
- [ ] API keys rotated regularly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using SQLAlchemy ORM)
- [ ] XSS prevention (React handles this)

## 🧪 Pre-Production Testing

1. **Build Test**
   ```bash
   cd frontend && npm run build
   ```
   Should complete without errors

2. **Backend Health Check**
   ```bash
   curl https://your-backend.com/health
   ```

3. **WebSocket Test**
   - Open browser console
   - Check WebSocket connection in Network tab

4. **Responsive Design Test**
   - Test on mobile device
   - Test on tablet
   - Test on desktop
   - Use Chrome DevTools device emulation

5. **Browser Compatibility**
   - Chrome ✓
   - Firefox ✓
   - Safari ✓
   - Edge ✓

## 🚨 Critical Production Settings

### Backend (`backend/app/main.py`)
```python
# Ensure these are set correctly:
app = FastAPI(
    title="ShadeHub API",
    docs_url="/docs" if os.getenv("ENV") == "development" else None,  # Hide docs in production
    redoc_url=None
)
```

### Frontend Build
Ensure `vite.config.js` has:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable in production
    minify: 'terser',
  }
})
```

## 📊 Monitoring

After deployment, monitor:
- Server CPU/Memory usage
- Database connection count
- API response times
- Error rates
- WebSocket connections
- LiveKit session count

## 🆘 Troubleshooting

### If deployment fails:

1. **Check Logs**
   - Backend: Check server logs
   - Frontend: Check browser console
   - Agent: Check LiveKit agent logs

2. **Verify Environment Variables**
   ```bash
   # Backend
   printenv | grep -E 'DATABASE_URL|GEMINI_API_KEY|LIVEKIT'
   
   # Frontend (check .env.production)
   cat .env.production
   ```

3. **Test Endpoints**
   ```bash
   # Health check
   curl https://your-backend.com/health
   
   # Products endpoint
   curl https://your-backend.com/api/products
   ```

4. **Database Connection**
   ```bash
   # Test database connection
   python backend/check_db.py
   ```

## ✅ Post-Deployment Verification

After deployment, test:
- [ ] Homepage loads correctly
- [ ] Products page shows items
- [ ] Search functionality works
- [ ] Filters work properly
- [ ] Virtual Try-On camera access works
- [ ] AI Agent connects and responds
- [ ] Product details page loads
- [ ] Responsive design on mobile
- [ ] All images load
- [ ] WebSocket connections stable

## 🎉 Ready for Production!

If all checks pass, your application is ready for production deployment!

---

**Last Updated**: 2026-02-11
**Version**: 1.0.0
