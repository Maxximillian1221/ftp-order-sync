# Setting Up the Database Schema Using Vercel CLI

This guide provides step-by-step instructions for setting up your database schema on Neon PostgreSQL using the Vercel CLI after deployment.

## Prerequisites

- [Node.js](https://nodejs.org/) installed on your local machine
- [Vercel CLI](https://vercel.com/docs/cli) installed globally
- Your app deployed to Vercel with Neon PostgreSQL integration

## Step 1: Install Vercel CLI

If you haven't already installed the Vercel CLI, you can do so with npm:

```bash
npm install -g vercel
```

## Step 2: Log in to Vercel

Authenticate with your Vercel account:

```bash
vercel login
```

Follow the prompts to complete the authentication process.

## Step 3: Link to Your Vercel Project

Navigate to your project directory in the terminal and link it to your Vercel project:

```bash
cd /path/to/your/project
vercel link
```

Follow the prompts to select your project from the list.

## Step 4: Pull Environment Variables

Pull the environment variables from your Vercel project, including the `DATABASE_URL` for Neon PostgreSQL:

```bash
vercel env pull .env
```

This will create a `.env` file in your project directory with all the environment variables from your Vercel project.

## Step 5: Run Prisma Migrations

Now you can run the Prisma migrations to set up your database schema:

```bash
npx prisma migrate deploy
```

This command will:
1. Connect to your Neon PostgreSQL database using the `DATABASE_URL` from the `.env` file
2. Apply all the migrations in your `prisma/migrations` directory
3. Set up the database schema according to your Prisma schema

## Step 6: Verify the Database Schema

You can verify that the database schema was set up correctly by using the Prisma Studio tool:

```bash
npx prisma studio
```

This will open a web interface where you can browse your database schema and data.

## Troubleshooting

### Connection Issues

If you encounter connection issues, check that:
- The `DATABASE_URL` in your `.env` file is correct
- Your IP address is allowed to connect to the Neon PostgreSQL database
- The database server is running

### Migration Errors

If you encounter migration errors:
1. Check the error message for specific issues
2. Ensure that the `provider` in `prisma/migrations/migration_lock.toml` is set to `"postgresql"`
3. Try running `npx prisma migrate reset` (this will delete all data in your database)

### Permission Issues

If you encounter permission issues:
1. Ensure that the database user in your connection string has the necessary permissions
2. Check if you need to create the database first (some providers require this)

## Next Steps

After successfully setting up your database schema:
1. Test your application to ensure it can connect to the database
2. Set up any initial data your application needs
3. Monitor your application logs for any database-related issues
