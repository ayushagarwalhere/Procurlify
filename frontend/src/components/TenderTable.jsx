import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const TenderTable = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTenders = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("tenders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTenders(data);
      } catch (err) {
        console.error("Error fetching tenders:", err);
        setError("Failed to load tenders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  if (loading) {
    return <div className="text-center py-6">Loading tenders...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-4">Available Tenders</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Title</th>
            <th className="border border-gray-300 px-4 py-2">Category</th>
            <th className="border border-gray-300 px-4 py-2">Budget</th>
            <th className="border border-gray-300 px-4 py-2">Status</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenders.map((tender) => (
            <tr key={tender.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{tender.title}</td>
              <td className="border border-gray-300 px-4 py-2">{tender.category}</td>
              <td className="border border-gray-300 px-4 py-2">{tender.estimated_budget}</td>
              <td className="border border-gray-300 px-4 py-2">{tender.status}</td>
              <td className="border border-gray-300 px-4 py-2">
                <button
                  className="text-blue-500 underline"
                  onClick={() => navigate(`/tender/${tender.id}`)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TenderTable;
