import { useEffect, useState } from 'react';
import { useContract } from '../hooks/useContract';
import { supabase } from '../lib/supabase';

/**
 * Background component that automatically closes tenders after bidEndTime
 * Place this in your main App.jsx or admin dashboard
 */
const TenderAutoCloser = () => {
  const { 
    canCloseTender, 
    closeTenderAndAwardLowestBid, 
    isInitialized 
  } = useContract();
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    const checkAndCloseTenders = async () => {
      if (processing) return;

      try {
        setProcessing(true);

        // Get all open tenders from Supabase
        const { data: tenders, error } = await supabase
          .from('tenders')
          .select('*')
          .eq('status', 'open')
          .not('blockchain_tender_id', 'is', null);

        if (error) {
          console.error('Error fetching tenders:', error);
          return;
        }

        if (!tenders || tenders.length === 0) return;

        console.log(`Checking ${tenders.length} open tenders for auto-close...`);

        // Check each tender
        for (const tender of tenders) {
          try {
            // Check if tender can be closed
            const { canClose, reason } = await canCloseTender(tender.blockchain_tender_id);

            if (canClose) {
              console.log(`Auto-closing tender ${tender.id} (${tender.title})...`);

              // Set contract dates (start now, end in 90 days)
              const startDate = new Date();
              const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

              // Close and award tender
              const receipt = await closeTenderAndAwardLowestBid(
                tender.blockchain_tender_id,
                startDate,
                endDate
              );

              console.log(`✅ Tender ${tender.id} closed successfully!`, receipt.hash);

              // Update Supabase status
              await supabase
                .from('tenders')
                .update({ 
                  status: 'awarded',
                  updated_at: new Date().toISOString()
                })
                .eq('id', tender.id);

            } else {
              console.log(`Tender ${tender.id} cannot be closed yet: ${reason}`);
            }
          } catch (error) {
            console.error(`Error processing tender ${tender.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in auto-closer:', error);
      } finally {
        setProcessing(false);
      }
    };

    // Check immediately
    checkAndCloseTenders();

    // Then check every 5 minutes
    const interval = setInterval(checkAndCloseTenders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isInitialized, canCloseTender, closeTenderAndAwardLowestBid, processing]);

  // This component doesn't render anything
  return null;
};

export default TenderAutoCloser;
