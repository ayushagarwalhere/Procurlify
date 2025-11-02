/**
 * Auto-Close Tenders Script
 * 
 * This script automatically closes tenders after bidEndTime and awards to lowest bidder
 * Run this as a cron job or scheduled task
 * 
 * Usage:
 *   node scripts/autoCloseTenders.js
 * 
 * Cron (every 5 minutes):
 *   */

const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // Admin wallet private key
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Contract ABI (minimal - only what we need)
const CONTRACT_ABI = [
  "function canCloseTender(uint256 _tenderId) view returns (bool canClose, string memory reason)",
  "function closeTenderAndAwardLowestBid(uint256 _tenderId, uint256 _startDate, uint256 _endDate)",
  "function getLowestBid(uint256 _tenderId) view returns (uint256 lowestBidId, uint256 lowestBidAmount, address contractor)",
  "event TenderClosedAndAwarded(uint256 indexed tenderId, uint256 indexed winningBidId, address indexed contractor, uint256 bidAmount)"
];

// Initialize
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function autoCloseTenders() {
  console.log('='.repeat(60));
  console.log('Auto-Close Tenders Script Started');
  console.log('Time:', new Date().toISOString());
  console.log('='.repeat(60));

  try {
    // Fetch all open tenders from Supabase
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', 'open')
      .not('blockchain_tender_id', 'is', null);

    if (error) {
      console.error('❌ Error fetching tenders:', error);
      return;
    }

    if (!tenders || tenders.length === 0) {
      console.log('ℹ️  No open tenders found');
      return;
    }

    console.log(`📋 Found ${tenders.length} open tender(s)`);
    console.log('');

    let closedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each tender
    for (const tender of tenders) {
      console.log(`\n🔍 Checking Tender #${tender.id}: "${tender.title}"`);
      console.log(`   Blockchain ID: ${tender.blockchain_tender_id}`);
      console.log(`   Bid End Time: ${tender.bid_end_date || tender.closing_date}`);

      try {
        // Check if tender can be closed
        const [canClose, reason] = await contract.canCloseTender(tender.blockchain_tender_id);

        if (!canClose) {
          console.log(`   ⏳ Cannot close yet: ${reason}`);
          skippedCount++;
          continue;
        }

        // Get lowest bid info
        const [lowestBidId, lowestBidAmount, contractor] = await contract.getLowestBid(tender.blockchain_tender_id);

        if (lowestBidId.toString() === '0') {
          console.log(`   ⚠️  No valid bids found`);
          skippedCount++;
          continue;
        }

        console.log(`   🏆 Lowest Bid: ${ethers.formatEther(lowestBidAmount)} ETH`);
        console.log(`   👷 Contractor: ${contractor}`);
        console.log(`   🔄 Closing tender and awarding...`);

        // Set contract dates (start now, end in 90 days)
        const startDate = Math.floor(Date.now() / 1000);
        const endDate = startDate + (90 * 24 * 60 * 60);

        // Close and award tender
        const tx = await contract.closeTenderAndAwardLowestBid(
          tender.blockchain_tender_id,
          startDate,
          endDate,
          {
            gasLimit: 500000 // Set appropriate gas limit
          }
        );

        console.log(`   📤 Transaction sent: ${tx.hash}`);
        console.log(`   ⏳ Waiting for confirmation...`);

        const receipt = await tx.wait();

        console.log(`   ✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
        console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);

        // Update Supabase
        const { error: updateError } = await supabase
          .from('tenders')
          .update({
            status: 'awarded',
            updated_at: new Date().toISOString()
          })
          .eq('id', tender.id);

        if (updateError) {
          console.log(`   ⚠️  Warning: Failed to update Supabase:`, updateError);
        } else {
          console.log(`   💾 Database updated`);
        }

        closedCount++;
        console.log(`   🎉 Tender #${tender.id} successfully closed and awarded!`);

      } catch (error) {
        console.error(`   ❌ Error processing tender #${tender.id}:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  ✅ Closed: ${closedCount}`);
    console.log(`  ⏳ Skipped: ${skippedCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
autoCloseTenders()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
