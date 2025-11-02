import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useWallet } from "../../../hooks/useWallet";
import { useContract } from "../../../hooks/useContract";

const SubmitBid = () => {
  const navigate = useNavigate();
  const { tenderId } = useParams();
  const { account, isConnected, connectWallet } = useWallet();
  const { submitBid: submitBidOnChain, isInitialized } = useContract();

  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [experience, setExperience] = useState("");
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchTender = async () => {
      try {
        const { data, error: tenderError } = await supabase
          .from("tenders")
          .select("*")
          .eq("id", tenderId)
          .single();

        if (tenderError) throw tenderError;
        setTender(data);

        // Check if user already submitted a bid
        const { data: userResponse } = await supabase.auth.getUser();
        if (userResponse?.user?.id) {
          const { data: existingBid } = await supabase
            .from("bids")
            .select("id")
            .eq("tender_id", tenderId)
            .eq("contractor_id", userResponse.user.id)
            .single();

          if (existingBid) {
            setError("You have already submitted a bid for this tender.");
          }
        }

        // Fetch user details to pre-fill form
        if (userResponse?.user?.id) {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", userResponse.user.id)
            .single();

          if (userData) {
            setCompanyName(userData.firm_name || "");
            setContactEmail(userData.email || "");
            setGstNumber(userData.gst_number || "");
          }
        }
      } catch (err) {
        console.error("Error fetching tender:", err);
        setError("Failed to load tender details");
      } finally {
        setLoading(false);
      }
    };

    if (tenderId) {
      fetchTender();
    }
  }, [tenderId]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocuments((prev) => [...prev, ...files]);
  };

  const removeDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadDocumentsToSupabase = async () => {
    if (documents.length === 0) return [];

    const { data: userResponse } = await supabase.auth.getUser();
    if (!userResponse?.user?.id) throw new Error("User not authenticated");

    const uploadedFiles = [];

    for (const file of documents) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userResponse.user.id}/${tenderId}/${Date.now()}_${
        file.name
      }`;

      const { data, error: uploadError } = await supabase.storage
        .from("bid-documents")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("bid-documents")
        .getPublicUrl(fileName);

      uploadedFiles.push({
        name: file.name,
        url: urlData.publicUrl,
        path: fileName,
      });
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    // Validation
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!isInitialized) {
      setError("Smart contract not initialized. Please check your connection.");
      return;
    }

    if (
      !bidAmount ||
      !proposal ||
      !companyName ||
      !contactEmail ||
      !contactPhone
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (parseFloat(bidAmount) <= 0) {
      setError("Bid amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    setStatus("Step 1/4: Uploading documents...");

    try {
      // Step 1: Upload documents
      let documentUrls = [];
      if (documents.length > 0) {
        documentUrls = await uploadDocumentsToSupabase();
        setStatus("Step 2/4: Submitting bid to blockchain...");
      } else {
        setStatus("Step 2/4: Submitting bid to blockchain...");
      }

      // Step 2: Get current user
      const { data: userResponse, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userResponse?.user?.id) {
        throw new Error("You must be logged in to submit a bid.");
      }

      // Create proposal text with all details
      const fullProposal = JSON.stringify({
        proposal: proposal,
        companyName: companyName,
        contactPerson: contactPerson,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        gstNumber: gstNumber,
        address: address,
        experience: experience,
        documents: documentUrls,
      });

      // Step 3: Submit bid on blockchain
      let blockchainTxHash = null;
      if (tender.blockchain_tender_id && isInitialized) {
        try {
          console.log("=== Blockchain Bid Submission ===");
          console.log("Tender Blockchain ID:", tender.blockchain_tender_id);
          console.log("Bid Amount:", bidAmount);
          console.log("Proposal:", fullProposal);
          console.log("Contract Initialized:", isInitialized);
          console.log("Wallet Connected:", isConnected);
          console.log("Account:", account);
          
          setStatus("Step 2/4: Approving transaction in MetaMask...");
          const blockchainReceipt = await submitBidOnChain(
            tender.blockchain_tender_id,
            bidAmount,
            fullProposal
          );

          console.log("✅ Blockchain receipt:", blockchainReceipt);

          if (blockchainReceipt && blockchainReceipt.hash) {
            blockchainTxHash = blockchainReceipt.hash;
            console.log("✅ Blockchain TX Hash:", blockchainTxHash);
            setStatus("Step 3/4: Saving bid details to database...");
          } else {
            console.warn("⚠️ Blockchain transaction failed, saving to database only");
            setStatus(
              "Step 3/4: Saving bid details to database (blockchain submission skipped)..."
            );
          }
        } catch (blockchainError) {
          console.error("❌ Blockchain submission error:", blockchainError);
          console.error("Error code:", blockchainError.code);
          console.error("Error message:", blockchainError.message);
          console.error("Error reason:", blockchainError.reason);
          
          // Show user-friendly error
          let errorMessage = "Blockchain submission failed: ";
          if (blockchainError.reason) {
            errorMessage += blockchainError.reason;
          } else if (blockchainError.message) {
            errorMessage += blockchainError.message;
          } else {
            errorMessage += "Unknown error";
          }
          
          alert(errorMessage + "\n\nYour bid will be saved to database only. Please contact admin.");
          
          // Continue with database submission even if blockchain fails
          setStatus(
            "Step 3/4: Saving bid details to database (blockchain submission skipped)..."
          );
        }
      } else {
        // No blockchain tender ID or contract not initialized
        console.warn("⚠️ Blockchain submission skipped:");
        console.warn("- blockchain_tender_id:", tender.blockchain_tender_id);
        console.warn("- isInitialized:", isInitialized);
        
        if (!tender.blockchain_tender_id) {
          setStatus(
            "Step 2/4: Saving bid to database (blockchain not available for this tender)..."
          );
        } else {
          setStatus(
            "Step 2/4: Saving bid to database (blockchain connection not available)..."
          );
        }
      }

      // Step 4: Save bid to Supabase database
      const bidData = {
        tender_id: tenderId,
        contractor_id: userResponse.user.id,
        bid_amount: parseFloat(bidAmount),
        proposal: fullProposal,
        status: "submitted",
        blockchain_tx_hash: blockchainTxHash,
      };

      const { data: bidRecord, error: bidError } = await supabase
        .from("bids")
        .insert([bidData])
        .select()
        .single();

      if (bidError) {
        console.error("Database error:", bidError);

        const isDuplicate =
          bidError?.code === "23505" ||
          (typeof bidError?.details === "string" &&
            /already exists|duplicate key|unique constraint/i.test(
              bidError.details
            )) ||
          (typeof bidError?.message === "string" &&
            /already exists|duplicate key|unique constraint/i.test(
              bidError.message
            )) ||
          bidError?.status === 409;

        if (isDuplicate) {
          // Throw a friendly, user-facing message that will be caught below
          throw new Error("You have already submitted a bid for this tender.");
        }
        throw new Error(
          "Failed to save bid to database. Transaction was successful on blockchain."
        );
      }

      setStatus("✅ Bid submitted successfully!");

      // Wait a moment to show success message
      setTimeout(() => {
        navigate("/dashboard/contractor/bids");
      }, 2000);
    } catch (err) {
      console.error("Error submitting bid:", err);
      setError(err.message || "Failed to submit bid. Please try again.");
      setStatus("");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="p-8 bg-black min-h-screen flex items-center justify-center">
        <div className="text-white">Loading tender details...</div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="p-8 bg-black min-h-screen flex items-center justify-center">
        <div className="text-white">Tender not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/dashboard/contractor/tenders")}
          className="text-white/60 hover:text-white mb-4 text-sm"
        >
          ← Back to All Tenders
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Submit Bid</h1>
        <p className="text-white/60">
          Fill in the details to submit your bid for this tender
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Tender Details */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 sticky top-8">
            <h2 className="text-xl font-bold text-white mb-4">
              Tender Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm">Title</label>
                <p className="text-white font-medium">{tender.title}</p>
              </div>

              <div>
                <label className="text-white/60 text-sm">Category</label>
                <p className="text-white font-medium">
                  {tender.category || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-white/60 text-sm">
                  Estimated Budget
                </label>
                <p className="text-white font-medium">
                  {formatCurrency(tender.estimated_budget)}
                </p>
              </div>

              <div>
                <label className="text-white/60 text-sm">Deadline</label>
                <p className="text-white font-medium">
                  {formatDate(tender.bid_end_date || tender.closing_date)}
                </p>
              </div>

              <div>
                <label className="text-white/60 text-sm">Status</label>
                <p className="text-white font-medium capitalize">
                  {tender.status?.toLowerCase() || "N/A"}
                </p>
              </div>

              {tender.description && (
                <div>
                  <label className="text-white/60 text-sm">Description</label>
                  <p className="text-white text-sm mt-1">
                    {tender.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Bid Form */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {status && (
              <div className="mb-6 p-4 bg-blue-600/20 border border-blue-600/50 rounded-lg text-blue-200">
                {status}
              </div>
            )}

            {tender && !tender.blockchain_tender_id && (
              <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg text-yellow-200">
                <p className="font-medium">
                  ⚠️ Note: This tender is not on blockchain yet.
                </p>
                <p className="text-sm mt-1">
                  Your bid will be saved to the database. Blockchain submission
                  will be skipped.
                </p>
              </div>
            )}

            {!isConnected && tender.blockchain_tender_id && (
              <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-600/50 rounded-lg text-yellow-200">
                <p className="mb-2">
                  Please connect your wallet to submit a bid (required for
                  blockchain submission)
                </p>
                <button
                  onClick={connectWallet}
                  className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            {!isConnected && !tender.blockchain_tender_id && (
              <div className="mb-6 p-4 bg-blue-600/20 border border-blue-600/50 rounded-lg text-blue-200">
                <p className="mb-2">
                  Wallet connection is optional for this tender (blockchain not
                  available)
                </p>
                <p className="text-sm">
                  You can still submit your bid to the database.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bid Amount */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Bid Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter your bid amount"
                  className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                  required
                />
                {tender.estimated_budget && (
                  <p className="text-white/60 text-sm mt-1">
                    Estimated Budget: {formatCurrency(tender.estimated_budget)}
                  </p>
                )}
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Company/Firm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company name"
                    className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="GSTIN"
                    className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Name of contact person"
                    className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                  required
                />
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Company Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete company address"
                  rows={3}
                  className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white resize-none"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Relevant Experience
                </label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Describe your relevant experience for this project"
                  rows={4}
                  className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white resize-none"
                />
              </div>

              {/* Proposal */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Proposal/Technical Details{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  placeholder="Describe your approach, methodology, timeline, and technical details for this project..."
                  rows={6}
                  className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white resize-none"
                  required
                />
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Upload Documents
                </label>
                <p className="text-white/60 text-sm mb-2">
                  Upload necessary documents (Company registration,
                  Certificates, Previous work samples, etc.)
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-4 py-3 border border-white/20 bg-white/5 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-white/90"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />

                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <span className="text-white text-sm">{doc.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/contractor/tenders")}
                  className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 font-medium transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (tender.blockchain_tender_id &&
                      !isConnected &&
                      isInitialized)
                  }
                  className="flex-1 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting Bid..." : "Submit Bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitBid;
