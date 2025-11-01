# Deployment Guide

## 🔥 Quick Deploy

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 2. Deploy Smart Contract
```bash
cd backend/contracts
npm install
npx hardhat node          # Terminal 1
npx hardhat run deploy.js --network localhost  # Terminal 2
```

### 3. Update Environment
In `frontend/.env` add:
```env
VITE_CONTRACT_ADDRESS=0x... # From deployment
VITE_SUPABASE_URL=https://jrzvilanmygbrcapkdpv.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

### 4. Backend Setup
```bash
cd backend
npm install
# Create .env with DATABASE_URL
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.jrzvilanmygbrcapkdpv.supabase.co:5432/postgres?schema=public&sslmode=require"
npx prisma generate
```

### 5. Use CreateTender!
1. Login as Admin
2. Click "Create New Tender"
3. Fill form → Approve MetaMask transaction
4. Done! Tender is on blockchain + database

## 📋 What You Have

✅ **Smart Contract**: Full tender management on Ethereum  
✅ **Database**: Supabase with all tables  
✅ **Frontend**: Admin, Contractor, Public portals  
✅ **Wallet Integration**: MetaMask  
✅ **Authentication**: Supabase Auth

## 🎯 Create Tender Flow

1. Admin fills form with:
   - Title, description
   - Category (0-4)
   - Budget in ETH
   - Bid start/end dates
2. Clicks "Create Tender on Blockchain"
3. MetaMask pops up → Admin approves
4. Smart contract deployed on-chain
5. Tender saved to Supabase database
6. Success! Return to dashboard

