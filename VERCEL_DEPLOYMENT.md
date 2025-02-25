# Deploying to Vercel with Neon PostgreSQL

This guide provides step-by-step instructions for deploying your Shopify FTP Order Sync app to Vercel with Neon PostgreSQL from the Vercel marketplace.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- Your code pushed to a GitHub repository
- A [Shopify Partner account](https://partners.shopify.com/signup)

## Step 1: Connect Your Repository to Vercel

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Select the repository containing your Shopify app

## Step 2: Configure Project Settings

1. In the project configuration screen:
   - Framework Preset: Select "Remix"
   - Build and Output Settings: Leave as default (they're configured in vercel.json)
   - Root Directory: Leave as default (/)

## Step 3: Set Up Neon PostgreSQL

1. In your project settings, go to the "Integrations" tab
2. Search for "Neon" in the marketplace
3. Click on "Neon" and then "Add Integration"
4. Follow the prompts to create a new Neon project or connect to an existing one
5. Once connected, Neon will provide a `DATABASE_URL` environment variable
6. Vercel will automatically add this environment variable to your project

## Step 4: Add Shopify Environment Variables

Add the following environment variables in the Vercel project settings:

1. `SHOPIFY_API_KEY`: Your Shopify API key from the Partner Dashboard
2. `SHOPIFY_API_SECRET`: Your Shopify API secret from the Partner Dashboard
3. `SHOPIFY_APP_URL`: Your Vercel deployment URL (e.g., https://your-app-name.vercel.app)
4. `SCOPES`: Your Shopify app scopes (e.g., write_orders,read_orders,write_products,read_products)
5. `NODE_ENV`: Set to `production`

## Step 5: Deploy Your App

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. Once deployed, you'll get a URL for your application (e.g., https://your-app-name.vercel.app)

## Step 6: Update Shopify App Configuration

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com/organizations)
2. Navigate to your app
3. Update the App URL to your Vercel deployment URL
4. Update the Allowed redirection URL(s) to include:
   - `https://your-app-name.vercel.app/auth/callback`
   - `https://your-app-name.vercel.app/auth/shopify/callback`
   - `https://your-app-name.vercel.app/api/auth/callback`
5. Save your changes

## Step 7: Test Your Deployment

1. Install your app on a development store
2. Verify that the app loads correctly
3. Test the FTP functionality by creating a test order

## Troubleshooting

### Database Migrations

If you encounter database migration issues:

1. Go to your Vercel project dashboard
2. Navigate to "Deployments" > select your latest deployment
3. Click "Redeploy" with the "Clear cache and redeploy" option

### Environment Variables

If your app isn't connecting to Shopify or the database:

1. Check that all environment variables are correctly set in Vercel
2. Ensure the `SHOPIFY_APP_URL` matches your actual Vercel deployment URL
3. Verify that the Shopify API key and secret are correct

### Logs

To check for errors:

1. Go to your Vercel project dashboard
2. Navigate to "Deployments" > select your latest deployment
3. Click on "Functions" to see the serverless function logs

## Updating Your App

When you push changes to your GitHub repository, Vercel will automatically redeploy your application. Make sure to:

1. Test changes locally before pushing
2. Check the deployment logs for any errors
3. Verify the app works correctly after deployment

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Prisma with Neon](https://neon.tech/docs/guides/prisma)
- [Shopify App Deployment](https://shopify.dev/docs/apps/deployment/web)
