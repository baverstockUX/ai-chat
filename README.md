# AI Chat

An AI-powered chat application built with Next.js, NextAuth, and Google Gemini.

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Google AI API key

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

You need a PostgreSQL database. Choose one of these options:

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb ai-chat
```

Your DATABASE_URL will be: `postgresql://your-username@localhost:5432/ai-chat`

#### Option B: Hosted Database (Recommended)

Use a hosted PostgreSQL provider:
- [Neon](https://neon.tech) - Serverless Postgres (Free tier available)
- [Supabase](https://supabase.com) - Open source Firebase alternative (Free tier)
- [Vercel Postgres](https://vercel.com/storage/postgres) - Vercel-hosted Postgres

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set these required variables:

```bash
# Database connection string from step 2
DATABASE_URL="postgresql://user:password@host:5432/database"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-generated-secret-here"

# Get from https://aistudio.google.com/apikey
GOOGLE_GENERATIVE_AI_API_KEY="your-google-api-key"

# Set to your app URL
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Apply Database Schema

Run migrations to create tables:

```bash
npm run db:migrate
```

Or push schema directly (for development):

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── (auth)/                 # Authentication pages (login, register)
├── api/auth/              # NextAuth API routes
├── layout.tsx             # Root layout
└── page.tsx               # Home page (chat interface)

lib/
├── db/
│   ├── schema.ts          # Database schema (Drizzle ORM)
│   ├── queries.ts         # Database queries
│   └── migrate.ts         # Migration runner
└── auth.ts                # Auth helper functions

components/
└── auth/
    └── auth-form.tsx      # Reusable auth form component
```

## Database Scripts

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply migrations to database
- `npm run db:push` - Push schema changes directly (development only)
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Authentication

This app uses NextAuth v5 with credentials provider:
- Email/password authentication
- Bcrypt password hashing (10 rounds)
- JWT session strategy
- Protected routes via middleware

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth v5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Google Gemini (via AI SDK)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Language**: TypeScript

## License

ISC
