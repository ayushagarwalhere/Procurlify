/**
 * Deployment script for TenderManagement smart contract
 * 
 * Usage:
 * 1. Install dependencies: npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
 * 2. Update hardhat.config.js with your network settings
 * 3. Run: npx hardhat run deploy.js --network <network>
 */

const hre = require("hardhat");

async function main() {
  console.log("Deploying TenderManagement contract...");

  // Get the contract factory
  const TenderManagement = await hre.ethers.getContractFactory("TenderManagement");
  
  // Deploy the contract
  const tenderManagement = await TenderManagement.deploy();

  // Wait for deployment
  await tenderManagement.waitForDeployment();

  const contractAddress = await tenderManagement.getAddress();
  
  console.log("\n✅ TenderManagement deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("\nAdd this to your .env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  
  // Verify contract on Etherscan (optional)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await tenderManagement.waitForDeployment();
    
    console.log("\nVerifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });