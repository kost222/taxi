# Taxi App - Production Deployment Guide

## Overview

This is a production-ready React-based taxi booking application that can be deployed on any server and configured to work with your own backend infrastructure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Building for Production](#building-for-production)
5. [Deployment Options](#deployment-options)
6. [Backend Integration](#backend-integration)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

## Prerequisites

### System Requirements
- **Node.js**: Version 16.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Web Server**: Nginx, Apache, or similar for serving static files
- **SSL Certificate**: Required for production deployment
- **Domain**: Properly configured domain pointing to your server

### Services You'll Need
1. **Map Service**: Either OpenRouteService or HERE Maps account
2. **Payment Gateway**: YooKassa account (optional)
3. **WhatsApp Bot**: For notifications (optional)
4. **Backend Server**: Your own taxi backend API

## Initial Setup

### 1. Download and Extract
```bash
# Extract the taxi-master.zip to your desired location
unzip taxi-master.zip
cd taxi-master
```

### 2. Install Dependencies
```bash
# Install all required packages
npm install

# Verify installation
npm run type-check
```

## Configuration

### 1. Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your specific settings:

```bash
# ==================================
# SERVER CONFIGURATION
# ==================================
REACT_APP_SERVER_BASE_URL=https://your-taxi-backend.com

# Optional: Direct API URL (will use SERVER_BASE_URL/api/v1 if not set)
REACT_APP_API_URL=https://your-api.example.com

# ==================================
# MAP SERVICES (Choose one)
# ==================================
# Get free token from: https://openrouteservice.org/
REACT_APP_ORS_TOKEN=your_openrouteservice_token_here

# Alternative: HERE Maps API Key
# Get from: https://developer.here.com/
REACT_APP_HERE_API_KEY=your_here_api_key_here

# ==================================
# PAYMENT PROCESSING (Optional)
# ==================================
REACT_APP_YOOKASSA_SHOP_ID=your_yookassa_shop_id
REACT_APP_YOOKASSA_SECRET_KEY=your_yookassa_secret_key

# ==================================
# WHATSAPP INTEGRATION (Optional)
# ==================================
REACT_APP_WHATSAPP_BOT_URL=https://your-whatsapp-bot.com
REACT_APP_WHATSAPP_BOT_KEY=your_whatsapp_bot_key

# ==================================
# APPLICATION SETTINGS
# ==================================
REACT_APP_DEBUG_MODE=false
REACT_APP_DEFAULT_LANGUAGE=2
REACT_APP_DEFAULT_CURRENCY=USD
REACT_APP_ENABLE_REALTIME=true
```

### 2. Application Data Configuration

The app uses a `data.js` file for configuration. You can customize:

**Location**: `public/data.js`

Key settings to modify:
- **Currency**: Change `currency_of_the_service` value
- **Language**: Update `the_language_of_the_service`
- **Location**: Set `geo_default` to your city coordinates
- **Car Classes**: Customize available vehicle types
- **Pricing**: Adjust base rates and formulas

Example customization:
```javascript
// In public/data.js
"currency_of_the_service": { "value": "EUR" },
"the_language_of_the_service": { "value": "2" }, // 1=Russian, 2=English
"geo_default": { "value": "48.8566,2.3522" }, // Paris coordinates
"customer_price": { "value": "Y" },
```

## Building for Production

### 1. Production Build
```bash
# Clean previous builds
npm run clean

# Create production build
npm run build:production

# Verify build
ls -la build/
```

### 2. Build Verification
The `build/` directory should contain:
- `index.html` - Main application entry
- `static/` - Compiled CSS, JS, and assets
- `data.js` - Configuration file
- Other static assets

### 3. Pre-deployment Checklist
```bash
# Run linting
npm run lint

# Check TypeScript
npm run type-check

# Test build locally (optional)
npx serve -s build -l 3000
```

## Deployment Options

### Option 1: Traditional Web Server (Nginx)

#### 1. Upload Files
```bash
# Upload build contents to your web server
scp -r build/* user@your-server.com:/var/www/your-domain.com/
```

#### 2. Nginx Configuration
Create `/etc/nginx/sites-available/your-domain.com`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    root /var/www/your-domain.com;
    index index.html;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass https://your-backend-api.com/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Enable and Restart
```bash
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Static Hosting (Netlify/Vercel)

#### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build:production`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Configure environment variables in Vercel dashboard

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM nginx:alpine

# Copy build files
COPY build/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t taxi-app .
docker run -p 80:80 taxi-app
```

## Backend Integration

### API Requirements

Your backend must provide these endpoints:

#### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
GET  /api/v1/auth/profile
```

#### Orders
```
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/:id
PUT    /api/v1/orders/:id
DELETE /api/v1/orders/:id
```

#### Drivers
```
GET /api/v1/drivers
GET /api/v1/drivers/:id
```

#### Maps & Routing
```
POST /api/v1/routes/calculate
GET  /api/v1/places/search
```

### API Response Format

All API responses should follow this structure:
```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "errors": [] // Only if success is false
}
```

### WebSocket Integration (Optional)

For real-time features, implement WebSocket endpoints:
- `/ws/orders` - Order updates
- `/ws/drivers` - Driver location updates
- `/ws/chat` - In-app messaging

## Security Considerations

### 1. Environment Variables
- **NEVER** commit `.env` files to version control
- Use different keys for development and production
- Rotate API keys regularly

### 2. HTTPS Only
- Always use SSL certificates in production
- Redirect all HTTP traffic to HTTPS
- Use HSTS headers

### 3. API Security
- Implement proper authentication
- Use CORS restrictions
- Rate limit API requests
- Validate all inputs

### 4. Content Security Policy
Add to your HTML head:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
```

## Troubleshooting

### Build Issues

**Problem**: "Module not found" errors
```bash
# Solution: Clear cache and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
```

**Problem**: TypeScript errors
```bash
# Solution: Run type check and fix issues
npm run type-check
```

### Runtime Issues

**Problem**: White screen after deployment
1. Check browser console for errors
2. Verify all environment variables are set
3. Check if `data.js` is accessible
4. Ensure proper routing configuration

**Problem**: Map not loading
1. Verify API keys in environment variables
2. Check if the map service is accessible
3. Review browser network tab for API errors

**Problem**: API calls failing
1. Check CORS configuration on backend
2. Verify API endpoints are correct
3. Test API endpoints directly with curl/Postman

### Performance Issues

**Problem**: Slow loading
1. Enable gzip compression on web server
2. Set proper cache headers for static assets
3. Use a CDN for static files
4. Optimize images and reduce bundle size

## Maintenance

### Regular Tasks

#### Weekly
- Monitor error logs
- Check application performance
- Verify SSL certificate status

#### Monthly
- Update dependencies (after testing)
- Review and rotate API keys
- Backup configuration files

#### Quarterly
- Security audit
- Performance optimization review
- Update documentation

### Monitoring

Set up monitoring for:
- **Application errors** - Use Sentry or similar
- **Performance metrics** - Google Analytics, etc.
- **Server health** - CPU, memory, disk usage
- **SSL certificate expiration**

### Updates

When updating the application:

1. **Backup current version**
```bash
cp -r /var/www/your-domain.com /var/www/your-domain.com.backup
```

2. **Test updates locally first**
```bash
npm install
npm run build:production
npm run lint
npm run type-check
```

3. **Deploy during low traffic periods**

4. **Monitor for issues after deployment**

## Support

### Documentation
- Check this DEPLOYMENT.md for common issues
- Review code comments in critical files
- Check environment variable descriptions in `.env.example`

### Getting Help
If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console and network logs
3. Test API endpoints independently
4. Verify all configuration files are properly set

### Configuration Files Reference

**Key files to understand:**
- `src/config.ts` - Application configuration logic
- `src/constants.ts` - Application constants
- `public/data.js` - Static configuration data
- `.env` - Environment variables
- `package.json` - Build scripts and dependencies

---

## Production Checklist

Before going live, ensure:

- [ ] All environment variables configured
- [ ] SSL certificate installed and working
- [ ] Backend API endpoints tested and working
- [ ] Map service API keys valid and working
- [ ] Payment gateway configured (if used)
- [ ] Error monitoring setup
- [ ] Regular backups configured
- [ ] Domain properly configured
- [ ] Web server security headers enabled
- [ ] Application tested on different devices/browsers

**Your taxi application is now ready for production!**

For additional support or questions about the codebase, refer to the inline code documentation and this deployment guide.