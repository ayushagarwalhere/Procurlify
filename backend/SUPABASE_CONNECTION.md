# Connecting Prisma to Supabase

## Status

✅ **Prisma Schema**: Configured for PostgreSQL (Supabase compatible)  
⚠️ **Connection**: Not yet connected - Missing `.env` file with `DATABASE_URL`

## Connection Steps

### 1. Get Your Supabase Database Connection String

You need two connection strings from Supabase:

#### A. Direct Connection (for Prisma migrations - port 5432)
- Go to Supabase Dashboard → Settings → Database
- Find "Connection string" → "URI" tab
- Use the **Direct connection** (port 5432)
- Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
- **Use this for**: `prisma migrate`, `prisma db push`, `prisma db pull`

#### B. Connection Pooling (for application queries - port 6543, recommended)
- Same location: Supabase Dashboard → Settings → Database
- Use the **Connection pooling** connection string (port 6543)
- Format: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
- **Use this for**: Production applications, better for handling many concurrent connections
- **Note**: Connection pooling URL is different - it uses `postgres.[PROJECT]` format

### 2. Create `.env` file

Create a `.env` file in `Procurlify/backend/` with:

#### Option 1: Direct Connection (Required for Prisma CLI - Recommended)

**⚠️ IMPORTANT**: Prisma CLI (`prisma db pull`, `prisma migrate`, etc.) requires the **direct connection** (port 5432), NOT the connection pooling URL (port 6543).

```env
# Direct connection - REQUIRED for Prisma migrations and db operations
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jrzvilanmygbrcapkdpv.supabase.co:5432/postgres?schema=public"
```

**Replace `[YOUR-PASSWORD]`** with your Supabase database password.

**Key points:**
- ✅ Use port **5432** (direct connection)
- ✅ Use host: `db.jrzvilanmygbrcapkdpv.supabase.co`
- ✅ Username: `postgres` (not `postgres.Procurlify`)
- ❌ Do NOT use port 6543 for Prisma CLI operations

#### Option 2: Separate URLs (Advanced - For Production Applications Only)

For production applications, use direct connection for Prisma CLI and pooling for runtime queries:

```env
# Direct connection for Prisma CLI (REQUIRED - port 5432)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jrzvilanmygbrcapkdpv.supabase.co:5432/postgres?schema=public"

# Connection pooling for application runtime queries (port 6543)
# Note: This is ONLY for your application code, NOT for Prisma CLI
# Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
# Example (replace with actual values from Supabase dashboard):
DIRECT_URL="postgresql://postgres.jrzvilanmygbrcapkdpv:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**⚠️ Common Mistakes:**
- ❌ **Wrong**: `postgres.Procurlify` - "Procurlify" is your project name, not the project reference
- ✅ **Correct**: `postgres.jrzvilanmygbrcapkdpv` - Use the actual project reference (project ID)
- ❌ **Wrong**: Using port 6543 for Prisma CLI operations - Will cause "Tenant or user not found"
- ✅ **Correct**: Use port 5432 for all Prisma CLI operations

**Note**: 
- `DATABASE_URL` is used by Prisma CLI - **MUST be direct connection (port 5432)**
- `DIRECT_URL` can be used in your application code for pooling (optional)
- **For Prisma, always use Option 1 (direct connection)**

### 3. Find Your Supabase Password

If you don't know your password:
1. Go to Supabase Dashboard → Project Settings → Database
2. Click "Reset Database Password" if needed
3. Copy the password shown (it's only shown once!)

### 4. Test the Connection

```bash
cd Procurlify/backend
npx prisma db pull
```

This will pull the schema from Supabase and verify the connection.

### 5. Sync Prisma Schema (if needed)

If your database schema differs from Prisma schema:

```bash
# View differences
npx prisma db pull

# Push Prisma schema to database (development only)
npx prisma db push

# Or create a migration (production)
npx prisma migrate dev
```

## Important Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use connection pooling** for production applications
3. **Direct connection** is fine for migrations and development
4. Your Supabase project URL: `https://jrzvilanmygbrcapkdpv.supabase.co`
5. Database host: `db.jrzvilanmygbrcapkdpv.supabase.co`

## Current Database Tables

Your Supabase database already has these tables:
- ✅ `users` - User accounts with roles
- ✅ `tenders` - Government tenders
- ✅ `bids` - Contractor bids
- ✅ `contracts` - Awarded contracts

All tables match your Prisma schema! ✅

