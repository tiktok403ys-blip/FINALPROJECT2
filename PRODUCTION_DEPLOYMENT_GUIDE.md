# 🚀 Production Deployment Guide

## Overview
This guide covers the production deployment of the GuruSingapore casino review platform with enhanced security measures.

## 🔒 Security Features Implemented

### 1. **Route Protection**
- ✅ **Public `/admin` access blocked** - Returns 404 for unauthorized users
- ✅ **Admin subdomain protection** - Only authenticated admin users can access
- ✅ **Role-based access control** - Admin and Super Admin roles enforced
- ✅ **Middleware security** - Comprehensive request validation

### 2. **Authentication & Authorization**
- ✅ **Supabase Auth integration** - Secure user authentication
- ✅ **Admin role validation** - Uses `admin_users` table for role verification
- ✅ **PIN system** - Additional security layer for admin access
- ✅ **Session management** - Secure session handling

### 3. **UI Security**
- ✅ **Admin button visibility** - Only shown to authenticated admin users
- ✅ **Protected routes** - Client-side route protection
- ✅ **Role-based rendering** - UI elements based on user permissions

## 🌐 Environment Configuration

### Required Environment Variables
```bash
# Admin Configuration
ADMIN_SUBDOMAIN=sg44admin.gurusingapore.com
NEXT_PUBLIC_SITE_DOMAIN=gurusingapore.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security Configuration
NODE_ENV=production
```

### Environment Validation
```bash
# Run security validation
npm run security:validate

# Or use the alias
npm run security:check
```

## 🚀 Deployment Steps

### Pre-Deployment Checklist
1. ✅ **Environment variables** configured
2. ✅ **Security validation** passed
3. ✅ **Database migrations** applied
4. ✅ **Admin users** created and verified
5. ✅ **SSL certificates** installed

### Deployment Commands
```bash
# 1. Install dependencies
npm install

# 2. Run security validation
npm run security:validate

# 3. Build production version
npm run build:production

# 4. Start production server
npm run start:production
```

### Alternative: Combined Check
```bash
# Run all checks and build
npm run deploy:check
```

## 🛡️ Security Testing

### Manual Security Tests
1. **Public Access Test**
   - Try accessing `/admin` from public browser
   - Should return 404 Not Found

2. **Unauthorized User Test**
   - Login with non-admin user
   - Try accessing admin routes
   - Should be blocked

3. **Admin Access Test**
   - Login with admin credentials
   - Access admin subdomain
   - Should work normally

### Automated Security Validation
```bash
# Run comprehensive security check
npm run security:validate
```

## 🔍 Monitoring & Logging

### Security Events Logged
- Unauthorized access attempts
- Admin route access
- Authentication failures
- Role validation errors

### Log Locations
- **Application logs**: Console and file logs
- **Security logs**: Middleware and auth logs
- **Database logs**: Supabase audit logs

## 🚨 Incident Response

### Security Breach Response
1. **Immediate Actions**
   - Block suspicious IP addresses
   - Review access logs
   - Check for unauthorized changes

2. **Investigation**
   - Analyze security logs
   - Review user permissions
   - Check for data breaches

3. **Recovery**
   - Reset compromised accounts
   - Update security measures
   - Notify stakeholders

## 📋 Maintenance

### Regular Security Updates
- **Weekly**: Review access logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Annually**: Penetration testing

### Security Monitoring
- Monitor failed login attempts
- Track admin access patterns
- Review role changes
- Monitor PIN system usage

## 🔧 Troubleshooting

### Common Issues

#### 1. Admin Button Not Visible
```bash
# Check admin role in database
SELECT * FROM admin_users WHERE user_id = 'user_uuid';
```

#### 2. 404 on Admin Routes
```bash
# Verify middleware configuration
# Check environment variables
npm run security:validate
```

#### 3. PIN System Issues
```bash
# Check PIN status API
curl /api/admin/pin-status
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev
```

## 📞 Support

### Security Issues
- **Critical**: Immediate response required
- **High**: Response within 4 hours
- **Medium**: Response within 24 hours
- **Low**: Response within 72 hours

### Contact Information
- **Security Team**: security@gurusingapore.com
- **Admin Support**: admin@gurusingapore.com
- **Emergency**: +65-XXXX-XXXX

## ✅ Post-Deployment Verification

### Security Checklist
- [ ] All admin routes return 404 for unauthorized users
- [ ] Admin button only visible to admin users
- [ ] PIN system working correctly
- [ ] Logging and monitoring active
- [ ] Environment variables secure
- [ ] SSL certificates valid
- [ ] Database connections secure

### Performance Checklist
- [ ] Page load times acceptable
- [ ] Admin panel responsive
- [ ] Database queries optimized
- [ ] CDN configured properly

## 🎯 Success Metrics

### Security Metrics
- **Zero unauthorized admin access**
- **100% route protection coverage**
- **Real-time security monitoring**
- **Comprehensive audit logging**

### Performance Metrics
- **Admin panel load time < 2s**
- **API response time < 500ms**
- **99.9% uptime**
- **Zero security incidents**

---

## 🚀 Ready for Production!

Your application is now secured and ready for production deployment. Run the security validation script before deploying to ensure all measures are in place.

```bash
npm run security:validate
```

**Remember**: Security is an ongoing process. Regularly review and update security measures to maintain protection against evolving threats.

