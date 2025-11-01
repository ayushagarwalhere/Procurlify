import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useProStatus = () => {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProStatus = async () => {
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        if (!userResponse?.user?.id) {
          setLoading(false);
          return;
        }

        const userId = userResponse.user.id;

        // Check if user has pro subscription
        // For now, we'll use localStorage as a simple implementation
        // In production, this would check a database table for subscription status
        const proStatus = localStorage.getItem(`pro_${userId}`);
        setIsPro(proStatus === "true");

        // In production, you would fetch from database:
        // const { data } = await supabase
        //   .from('subscriptions')
        //   .select('status')
        //   .eq('user_id', userId)
        //   .eq('plan', 'pro')
        //   .single();
        // setIsPro(data?.status === 'active');
      } catch (error) {
        console.error("Error checking Pro status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkProStatus();
  }, []);

  const upgradeToPro = async (planType = "monthly") => {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse?.user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = userResponse.user.id;

      // Simulate upgrade process
      // In production, this would:
      // 1. Process payment (Stripe, PayPal, etc.)
      // 2. Create subscription record in database
      // 3. Update user's pro status

      // For demo purposes, we'll use localStorage
      localStorage.setItem(`pro_${userId}`, "true");
      setIsPro(true);

      // In production:
      // await supabase.from('subscriptions').insert({
      //   user_id: userId,
      //   plan: 'pro',
      //   plan_type: planType,
      //   status: 'active',
      //   start_date: new Date().toISOString(),
      // });

      alert(`Successfully upgraded to Pro ${planType} plan!`);
    } catch (error) {
      console.error("Error upgrading to Pro:", error);
      alert("Failed to upgrade. Please try again.");
    }
  };

  return { isPro, loading, upgradeToPro };
};

