# 🔐 Auth0 Setup Guide for WazMind

This guide explains how to set up Auth0 authentication for the WazMind application. Auth0 provides a flexible, enterprise-ready authentication solution that supports multiple identity providers.

## Prerequisites

- An Auth0 account (sign up at [auth0.com](https://auth0.com) - free tier available)
- Access to the Auth0 Dashboard

## Quick Setup (Using Provided Credentials)

If you already have Auth0 credentials, simply create a `.env` file in the `frontend/` directory:

```env
cc
```

Then restart your development server.

## Manual Setup Steps

### 1. Create an Auth0 Application

1. **Go to Auth0 Dashboard:**
   - Navigate to [manage.auth0.com](https://manage.auth0.com/)
   - Log in with your Auth0 account

2. **Create a New Application:**
   - In the left sidebar, go to **Applications** > **Applications**
   - Click **Create Application**
   - **Name:** `WazMind` (or any descriptive name)
   - **Application Type:** Select **Single Page Web Applications**
   - Click **Create**

### 2. Configure Application Settings

1. **Go to Settings tab** of your newly created application

2. **Configure Allowed Callback URLs:**
   - Add: `http://localhost:5173` (for development)
   - Add: `http://localhost:5173/*` (for all routes)
   - For production, add your production URL: `https://yourdomain.com`

3. **Configure Allowed Logout URLs:**
   - Add: `http://localhost:5173` (for development)
   - For production, add your production URL: `https://yourdomain.com`

4. **Configure Allowed Web Origins:**
   - Add: `http://localhost:5173` (for development)
   - For production, add your production URL: `https://yourdomain.com`

5. **Scroll down and click "Save Changes"**

### 3. Get Your Credentials

1. **Copy Domain:**
   - In the Settings tab, find **Domain**
   - Copy the value (e.g., `dev-xxxxx.us.auth0.com`)

2. **Copy Client ID:**
   - In the Settings tab, find **Client ID**
   - Copy the value

### 4. Configure WazMind Frontend

1. **Create a `.env` file in the `frontend/` directory:**
   ```bash
   cd frontend
   touch .env
   ```

2. **Add your Auth0 credentials to `.env`:**
   ```env
   VITE_AUTH0_DOMAIN=your-domain.us.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   ```

   Replace `your-domain.us.auth0.com` and `your-client-id` with the values you copied from Auth0 Dashboard.

3. **Restart the Frontend Development Server:**
   ```bash
   npm run dev
   ```

## Configure Identity Providers (Optional)

Auth0 supports multiple identity providers. You can enable:

- **Google** - Enable in Auth0 Dashboard > Authentication > Social
- **GitHub** - Enable in Auth0 Dashboard > Authentication > Social
- **Facebook** - Enable in Auth0 Dashboard > Authentication > Social
- **Email/Password** - Enabled by default

To enable a provider:
1. Go to **Authentication** > **Social** in Auth0 Dashboard
2. Click on the provider you want to enable
3. Follow the setup instructions
4. Users will see these options in the login screen

## Testing Authentication

1. Start your frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:5173`

3. Click **Log In** button

4. You should be redirected to Auth0's Universal Login page

5. Sign up or log in with your preferred method

6. After successful authentication, you'll be redirected back to WazMind

## Troubleshooting

### "Auth0 Setup Required" message appears

- Check that `.env` file exists in `frontend/` directory
- Verify that `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` are set correctly
- Restart the development server after creating/updating `.env`

### Redirect URI mismatch error

- Ensure `http://localhost:5173` is added to **Allowed Callback URLs** in Auth0 Dashboard
- Check that the URL in your browser matches exactly (including `http://` vs `https://`)

### CORS errors

- Add `http://localhost:5173` to **Allowed Web Origins** in Auth0 Dashboard
- Ensure you've saved changes in Auth0 Dashboard

### Users can't log in

- Check Auth0 Dashboard > Users to see if user accounts exist
- Verify that the identity provider (Google, GitHub, etc.) is properly configured
- Check browser console for error messages

## Production Deployment

For production deployment:

1. **Update Auth0 Application Settings:**
   - Add production URLs to **Allowed Callback URLs**
   - Add production URLs to **Allowed Logout URLs**
   - Add production URLs to **Allowed Web Origins**

2. **Update Environment Variables:**
   - Set `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` in your production environment
   - Never commit `.env` file to version control

3. **Build and Deploy:**
   ```bash
   npm run build
   ```

## Security Best Practices

- ✅ Never commit `.env` file to version control
- ✅ Use different Auth0 applications for development and production
- ✅ Regularly rotate Client Secrets (if using confidential clients)
- ✅ Enable MFA (Multi-Factor Authentication) in Auth0 Dashboard
- ✅ Configure rate limiting in Auth0 Dashboard
- ✅ Monitor authentication logs in Auth0 Dashboard

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 React SDK](https://github.com/auth0/auth0-react)
- [Auth0 Quickstarts](https://auth0.com/docs/quickstarts)
- [Auth0 Community](https://community.auth0.com/)

