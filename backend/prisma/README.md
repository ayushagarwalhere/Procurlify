# Prisma Schema for Procurlify

This directory contains the Prisma schema that defines all database models for the Procurlify tender management system.

## Setup

1. Install Prisma CLI:
```bash
npm install -D prisma
npm install @prisma/client
```

2. Set your database URL in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/procurlify?schema=public"
```

For Supabase:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

3. Generate Prisma Client:
```bash
npx prisma generate
```

4. (Optional) Push schema to database:
```bash
npx prisma db push
```

## Models Overview

### User Model
Stores all user accounts with three roles:
- **ADMIN**: Government/Admin Portal users
  - Fields: `orgName`, `designation`
- **CONTRACTOR**: Contractor Portal users
  - Fields: `firmName`, `gstNumber`, `bankAccountName`, `bankAccountNumber`, `bankIfscCode`, `bankName`, `bankBranch`
- **PUBLIC**: View Portal users
  - Basic fields only: `name`, `email`, `walletAddress` (optional)

### Tender Model
Government/Admin created tenders with:
- **Timeline tracking**: `createdAt`, `bidStartDate`, `bidEndDate`
- **Allotment tracking**: `isAllotted`, `allottedAt`, `allottedTo`
- **Status**: DRAFT, OPEN, CLOSED, AWARDED, CANCELLED
- **Budget**: `estimatedBudget`

### Bid Model
Contractor bids on tenders:
- One bid per contractor per tender (enforced by unique constraint)
- Status: SUBMITTED, ACCEPTED, REJECTED, WITHDRAWN
- Contains `bidAmount` and `proposal`

### Contract Model
Awarded contracts:
- Links to a specific bid
- Tracks contract lifecycle with status: ACTIVE, COMPLETED, TERMINATED
- Contains contract value, start date, and end date

## Key Features

1. **Role-based Fields**: User model includes role-specific fields (nullable for non-applicable roles)
2. **Bid Timeline Separation**: `bidStartDate` (when bidding opens) separate from `bidEndDate` (when it closes)
3. **Allotment Tracking**: `isAllotted` flag and `allottedAt`/`allottedTo` fields track which tenders have been allotted
4. **Blockchain Integration**: All models include `blockchainTxHash` for blockchain transaction tracking
5. **Cascading Deletes**: Proper cascade deletes for maintaining referential integrity

## Querying Examples

### Get all unallotted tenders:
```typescript
const unallottedTenders = await prisma.tender.findMany({
  where: {
    isAllotted: false,
    status: 'OPEN'
  }
})
```

### Get all tenders created by an admin:
```typescript
const adminTenders = await prisma.tender.findMany({
  where: {
    createdBy: adminId
  },
  include: {
    bids: true,
    contracts: true
  }
})
```

### Get tenders with active bidding:
```typescript
const activeBiddingTenders = await prisma.tender.findMany({
  where: {
    status: 'OPEN',
    bidStartDate: { lte: new Date() },
    bidEndDate: { gte: new Date() }
  }
})
```

## Syncing with Supabase

If you're using Supabase, you can sync this schema by:
1. Exporting the schema to SQL migrations
2. Running migrations in Supabase

Or use Supabase's migration system with the SQL equivalent of this Prisma schema.

