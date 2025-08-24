# Google Analytics Setup for GuruSingapore

## Required Environment Variables

To enable Google Analytics tracking, you need to set up the following environment variable:

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## How to Get Your Google Analytics Measurement ID

1. **Go to Google Analytics**:
   - Visit [Google Analytics](https://analytics.google.com/)
   - Sign in with your Google account

2. **Create a Property** (if you don't have one):
   - Click "Create Property"
   - Choose "Web" as the platform
   - Enter your website details:
     - Property name: "GuruSingapore"
     - Website URL: `https://yourdomain.com`
     - Industry: "Gambling & Casinos" or "Online Communities"
     - Reporting Time Zone: Your timezone

3. **Get Measurement ID**:
   - After creating the property, go to "Admin" (bottom left)
   - Under "Property" column, click "Data Streams"
   - Click on your web data stream
   - Copy the "Measurement ID" (format: G-XXXXXXXXXX)

4. **Set Environment Variable**:
   ```bash
   # In your .env.local file (for development)
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

   # Or in your deployment platform (Vercel, Netlify, etc.)
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

## Testing Google Analytics

After setting up the measurement ID:

1. **Development**: The analytics will work in production builds only
2. **Production**: Visit your deployed site and check browser console for "Google Analytics loaded successfully"
3. **Verification**:
   - Open browser developer tools
   - Go to Network tab
   - Look for requests to `googletagmanager.com` and `google-analytics.com`
   - Check Console for any GA-related messages

## Troubleshooting

### "Google Analytics not loaded" Error
- Ensure `NEXT_PUBLIC_GA_ID` is set correctly
- Check that the measurement ID format is `G-XXXXXXXXXX`
- Verify the GA script loads in Network tab

### CSP Violations
- The middleware is configured to allow GA connections
- If you see CSP errors, check the middleware configuration

### Analytics Events Not Tracking
- Ensure the GA script loads before tracking events
- Check browser console for any GA errors
- Verify events are being sent in Network tab

## Privacy & Compliance

The current setup includes:
- ✅ IP Anonymization enabled
- ✅ Ad features disabled
- ✅ Cookie consent integration ready
- ✅ GDPR compliance ready

## Next Steps

After setting up GA:
1. Configure your GA property settings
2. Set up conversion goals
3. Create custom dashboards
4. Set up alerts for important metrics
