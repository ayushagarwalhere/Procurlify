// Aptos Payment Utility - Simplified Version
// Matches the simplified Move contract: tender_payment::payment_system::pay_contractor

const MODULE_ADDRESS = import.meta.env.VITE_APTOS_MODULE_ADDRESS || "0x1";

/**
 * Connect to Petra wallet
 */
export const connectAptosWallet = async () => {
  try {
    if (!window.aptos) {
      throw new Error("Petra wallet not installed. Please install from https://petra.app/");
    }

    const response = await window.aptos.connect();
    console.log("✅ Connected to Petra wallet:", response);
    
    return {
      address: response.address,
      publicKey: response.publicKey,
    };
  } catch (error) {
    console.error("❌ Error connecting to Petra wallet:", error);
    throw error;
  }
};

/**
 * Disconnect from Petra wallet
 */
export const disconnectAptosWallet = async () => {
  try {
    if (window.aptos) {
      await window.aptos.disconnect();
      console.log("✅ Disconnected from Petra wallet");
    }
  } catch (error) {
    console.error("❌ Error disconnecting from Petra wallet:", error);
    throw error;
  }
};

/**
 * Get account balance in APT
 */
export const getAptosBalance = async (address) => {
  try {
    if (!window.aptos) {
      throw new Error("Petra wallet not installed");
    }

    // Use Petra's built-in method to get balance
    const account = await window.aptos.account();
    
    // Fetch resources from the network
    const response = await fetch(
      `https://fullnode.devnet.aptoslabs.com/v1/accounts/${address}/resources`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch account resources");
    }
    
    const resources = await response.json();
    const accountResource = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );
    
    if (accountResource) {
      const balance = accountResource.data.coin.value;
      // Convert from Octas to APT (1 APT = 100,000,000 Octas)
      return parseInt(balance) / 100000000;
    }
    
    return 0;
  } catch (error) {
    console.error("❌ Error getting balance:", error);
    return 0;
  }
};

/**
 * Pay contractor - Simple direct payment
 * @param {string} contractorAddress - Contractor's Aptos wallet address
 * @param {number} amountAPT - Amount in APT (will be converted to Octas)
 * @returns {Promise} Transaction response
 */
export const payContractor = async (contractorAddress, amountAPT) => {
  try {
    if (!window.aptos) {
      throw new Error("Petra wallet not installed");
    }

    // Convert APT to Octas (1 APT = 100,000,000 Octas)
    const amountOctas = Math.floor(amountAPT * 100000000);

    console.log("💰 Initiating payment:");
    console.log("  To:", contractorAddress);
    console.log("  Amount:", amountAPT, "APT");
    console.log("  Amount (Octas):", amountOctas);

    const payload = {
      type: "entry_function_payload",
      function: `${MODULE_ADDRESS}::payment_system::pay_contractor`,
      type_arguments: [],
      arguments: [
        contractorAddress,
        amountOctas.toString(),
      ],
    };

    console.log("📤 Sending transaction payload:", payload);
    
    const response = await window.aptos.signAndSubmitTransaction(payload);
    console.log("✅ Transaction submitted:", response);
    
    // Wait for transaction confirmation
    console.log("⏳ Waiting for transaction confirmation...");
    await waitForTransaction(response.hash);
    
    console.log("🎉 Payment successful!");
    return response;
  } catch (error) {
    console.error("❌ Error paying contractor:", error);
    throw error;
  }
};

/**
 * Wait for transaction to be confirmed
 */
const waitForTransaction = async (txHash) => {
  const maxAttempts = 20;
  const delayMs = 1000;
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `https://fullnode.devnet.aptoslabs.com/v1/transactions/by_hash/${txHash}`
      );
      
      if (response.ok) {
        const tx = await response.json();
        if (tx.success) {
          console.log("✅ Transaction confirmed:", tx);
          return tx;
        } else {
          throw new Error("Transaction failed: " + JSON.stringify(tx));
        }
      }
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw error;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error("Transaction confirmation timeout");
};

/**
 * Check if Petra wallet is installed
 */
export const isPetraInstalled = () => {
  return typeof window.aptos !== "undefined";
};

/**
 * Get connected wallet address
 */
export const getConnectedWallet = async () => {
  try {
    if (!window.aptos) {
      return null;
    }

    const account = await window.aptos.account();
    return account.address;
  } catch (error) {
    console.error("❌ Error getting connected wallet:", error);
    return null;
  }
};

/**
 * Convert APT to Octas
 */
export const aptToOctas = (apt) => {
  return Math.floor(apt * 100000000);
};

/**
 * Convert Octas to APT
 */
export const octasToApt = (octas) => {
  return parseInt(octas) / 100000000;
};
