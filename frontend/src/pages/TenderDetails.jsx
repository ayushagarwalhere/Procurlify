import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const TenderDetails = () => {
  const { tenderId } = useParams(); // Get tender ID from URL
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenderDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tenders")
          .select("*")
          .eq("id", tenderId)
          .single();

        if (error) throw error;

        setTender(data);
      } catch (error) {
        console.error("Failed to fetch tender details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [tenderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Tender not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{tender.title}</h1>
        <span className="text-green-600 font-semibold">{tender.status}</span>
        <p className="text-gray-500 mb-6">{tender.category}</p>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Description</h2>
          <p>{tender.description}</p>
        </div>

        {/* Requirements */}
        {tender.requirements && tender.requirements.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Requirements</h2>
            <ul className="list-disc pl-5">
              {tender.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents */}
        {tender.documents && tender.documents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Documents</h2>
            <ul>
              {tender.documents.map((doc, index) => (
                <li key={index}>
                  <a href={doc.url} className="text-blue-500 underline">
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tender Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Tender Information</h2>
          <ul>
            <li>Budget: {tender.estimated_budget}</li>
            <li>Organization: {tender.organization || "N/A"}</li>
            <li>
              Published:{" "}
              {new Date(tender.bid_start_date).toLocaleDateString()}
            </li>
            <li>
              Closing Date:{" "}
              {new Date(tender.closing_date).toLocaleDateString()}
            </li>
          </ul>
        </div>

        {/* Blockchain Verification */}
        {tender.blockchain_tx_hash && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Blockchain Verification</h2>
            <p>Transaction Hash:</p>
            <p className="text-blue-500 font-mono">
              {tender.blockchain_tx_hash}
            </p>
          </div>
        )}

        {/* Submit Bid */}
        <div className="mt-4">
          <button className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
            Submit Bid
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenderDetails;
