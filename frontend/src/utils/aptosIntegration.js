import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Initialize Aptos client
const config = new AptosConfig({ network: Network.TESTNET }); // Use MAINNET for production
const aptos = new Aptos(config);

/**
 * Transfer APT tokens to contractor's wallet
 * @param {string} senderPrivateKey - Private key of the sender (admin/treasury)
 * @param {string} recipientAddress - Contractor's Aptos wallet address
 * @param {number} amount - Amount in APT to transfer
 * @returns {Promise<object>} Transaction result
 */
export const transferAPT = async (senderPrivateKey, recipientAddress, amount) => {
  try {
    // Convert amount to Octas (1 APT = 100,000,000 Octas)
    const amountInOctas = Math.floor(amount * 100000000);

    // Create account from private key
    const { Account } = await import("@aptos-labs/ts-sdk");
    const sender = Account.fromPrivateKey({ privateKey: senderPrivateKey });

    // Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: sender.accountAddress,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipientAddress, amountInOctas],
      },
    });

    // Sign and submit transaction
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: sender,
      transaction,
    });

    // Wait for transaction confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log("Transfer successful:", executedTransaction);
    return {
      success: true,
      hash: committedTxn.hash,
      transaction: executedTransaction,
    };
  } catch (error) {
    console.error("Error transferring APT:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get Aptos wallet balance
 * @param {string} address - Aptos wallet address
 * @returns {Promise<number>} Balance in APT
 */
export const getWalletBalance = async (address) => {
  try {
    const resources = await aptos.getAccountResources({
      accountAddress: address,
    });

    const coinResource = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );

    if (coinResource) {
      const balance = coinResource.data.coin.value;
      return balance / 100000000; // Convert Octas to APT
    }

    return 0;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
};

/**
 * Validate Aptos wallet address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export const isValidAptosAddress = (address) => {
  try {
    // Aptos addresses are 64 hex characters (with or without 0x prefix)
    const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;
    return /^[0-9a-fA-F]{64}$/.test(cleanAddress);
  } catch (error) {
    return false;
  }
};

/**
 * Listen to blockchain events and trigger Aptos payments
 * This function listens to AllMilestonesCompleted events
 * @param {object} contract - Ethers contract instance
 * @param {string} treasuryPrivateKey - Private key for payment source
 */
export const listenForPaymentEvents = (contract, treasuryPrivateKey) => {
  console.log("Starting Aptos payment listener...");

  // Listen for AllMilestonesCompleted event
  contract.on(
    "AllMilestonesCompleted",
    async (contractId, contractor, totalAmount, event) => {
      console.log("All milestones completed event received:", {
        contractId: contractId.toString(),
        contractor,
        totalAmount: totalAmount.toString(),
      });

      try {
        // Get contract details to fetch Aptos wallet
        const contractDetails = await contract.getContract(contractId);
        const aptosWallet = contractDetails.aptosWalletAddress;

        if (!aptosWallet || aptosWallet === "") {
          console.error("No Aptos wallet address set for this contract");
          return;
        }

        // Convert totalAmount from wei to ETH equivalent in APT
        // Note: You'll need to implement proper conversion based on exchange rates
        const { ethers } = await import("ethers");
        const amountInEth = parseFloat(ethers.formatEther(totalAmount));
        
        // For demo purposes, using 1:1 ratio. In production, use real exchange rate
        const amountInAPT = amountInEth;

        console.log(`Initiating payment of ${amountInAPT} APT to ${aptosWallet}`);

        // Transfer APT
        const result = await transferAPT(
          treasuryPrivateKey,
          aptosWallet,
          amountInAPT
        );

        if (result.success) {
          console.log("Payment successful! Transaction hash:", result.hash);
          // You can emit a custom event or update database here
        } else {
          console.error("Payment failed:", result.error);
        }
      } catch (error) {
        console.error("Error processing payment:", error);
      }
    }
  );

  // Listen for individual milestone payments (optional)
  contract.on(
    "MilestonePaid",
    async (contractId, milestoneId, contractor, amount, aptosWallet, event) => {
      console.log("Milestone paid event:", {
        contractId: contractId.toString(),
        milestoneId: milestoneId.toString(),
        contractor,
        amount: amount.toString(),
        aptosWallet,
      });
    }
  );
};

/**
 * Stop listening to payment events
 * @param {object} contract - Ethers contract instance
 */
export const stopPaymentListener = (contract) => {
  contract.removeAllListeners("AllMilestonesCompleted");
  contract.removeAllListeners("MilestonePaid");
  console.log("Payment listener stopped");
};

/**
 * Manual payment trigger (for testing or manual intervention)
 * @param {string} treasuryPrivateKey - Private key for payment source
 * @param {string} aptosWallet - Recipient's Aptos wallet
 * @param {number} amountInAPT - Amount to transfer in APT
 */
export const triggerManualPayment = async (
  treasuryPrivateKey,
  aptosWallet,
  amountInAPT
) => {
  if (!isValidAptosAddress(aptosWallet)) {
    throw new Error("Invalid Aptos wallet address");
  }

  return await transferAPT(treasuryPrivateKey, aptosWallet, amountInAPT);
};

export default {
  transferAPT,
  getWalletBalance,
  isValidAptosAddress,
  listenForPaymentEvents,
  stopPaymentListener,
  triggerManualPayment,
};
