# ✅ **Google Analytics Setup Checklist untuk GuruSingapore**

## 🎯 **Pre-Setup Preparation**

### **Data yang Perlu Disiapkan:**
- [ ] Domain: `gurusingapore.com`
- [ ] Vercel project ready
- [ ] Environment variables access
- [ ] Business objective decided

## 📋 **Setup Steps**

### **Step 1: Google Analytics Account**
```javascript
🔗 Visit: analytics.google.com
🔑 Sign in with Google Account
📊 Click "Create Account"

Account Details:
- Account name: GuruSingapore
- Account data sharing: Choose preferences
- Click "Next"
```

### **Step 2: Property Setup**
```javascript
Property Details:
- Property name: GuruSingapore Casino Reviews
- Time zone: Asia/Singapore (UTC+8)
- Currency: Singapore Dollar (SGD)
- Click "Next"

Business Details:
- Industry: Gambling & Casinos
- Business size: Choose appropriate
- Click "Create"
```

### **Step 3: Business Objective** ⭐
```javascript
SELECT THIS OPTION:
[✅] View user engagement & retention
     Learn how people explore the products or services...

Why: Best for casino review site to understand user behavior
```

### **Step 4: Data Stream Setup**
```javascript
Platform: Web

Website Details:
- Website URL: https://gurusingapore.com
- Stream name: GuruSingapore Production
- Click "Create Stream"
```

### **Step 5: Data Collection Settings**
```javascript
✅ Enhanced measurement (enable all)
✅ Google signals
✅ Device and browser data
✅ Geolocation data

Privacy Settings:
✅ IP anonymization: ON
✅ Ad personalization: OFF (safer for casino)
```

### **Step 6: Get Measurement ID**
```javascript
📍 Location: Admin → Data Streams → Web Stream
📋 Copy: Measurement ID (G-XXXXXXXXXX)
💾 Save: G-XXXXXXXXXX for Vercel setup
```

## 🚀 **Vercel Configuration**

### **Step 7: Environment Variables**
```javascript
Vercel Dashboard:
1. Project: GuruSingapore
2. Settings → Environment Variables
3. Add New:

Name: NEXT_PUBLIC_GA_ID
Value: G-XXXXXXXXXX
Environments: Production, Preview, Development
```

### **Step 8: Deploy**
```javascript
1. Save environment variable
2. Click "Redeploy"
3. Wait for deployment complete
```

## 🔍 **Verification**

### **Step 9: Test Setup**
```javascript
Browser Console Check:
1. Open: https://gurusingapore.com
2. F12 → Console tab
3. Should see: ✅ Google Analytics loaded successfully

GA Dashboard Check:
1. analytics.google.com → Reports → Realtime
2. Should see active users within 30 seconds
```

## 📊 **Post-Setup Configuration**

### **Step 10: Goals Setup**
```javascript
GA Dashboard → Admin → Goals → Create Goal

Goal 1: Casino Engagement
- Category: Casino
- Action: view
- Label: casino_page_view

Goal 2: Search Usage
- Category: Search
- Action: performed
- Label: casino_search

Goal 3: Review Interaction
- Category: Review
- Action: submit
- Label: user_review
```

### **Step 11: Custom Events**
```javascript
Events to track:
- Mobile interactions (swipe, touch)
- Casino filter usage
- Bonus info views
- PWA installations
```

## 🎉 **Success Indicators**

### **What to Look For:**
```javascript
✅ GA Dashboard: Active users showing
✅ Browser Console: No GA errors
✅ Vercel Logs: Successful deployment
✅ Network Tab: GA requests to google-analytics.com
```

### **First Insights (24-48 hours):**
```javascript
- User demographics
- Traffic sources
- Popular pages
- Mobile usage patterns
```

## 🚨 **Troubleshooting**

### **If No Data Appears:**
```javascript
1. Check Measurement ID format: G-XXXXXXXXXX
2. Verify environment variable in Vercel
3. Check browser console for errors
4. Wait 24-48 hours for data processing
```

### **If GA Script Errors:**
```javascript
1. Check NEXT_PUBLIC_GA_ID value
2. Verify domain in GA property
3. Check Content Security Policy
4. Clear browser cache
```

## 📞 **Support**

**Need Help?**
- GA Setup Issues: Google Analytics Help
- Vercel Issues: Vercel Support
- Code Issues: Check console errors

---

**🎯 Summary:**
1. Pilih "View user engagement & retention"
2. Complete setup → Get G-XXXXXXXXXX
3. Add to Vercel → Redeploy
4. Verify in GA dashboard
5. Start analyzing insights!

**Estimated Time: 10-15 minutes**
