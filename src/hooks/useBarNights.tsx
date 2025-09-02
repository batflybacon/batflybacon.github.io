import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
}

export interface BarNight {
  id: string;
  total_amount: number;
  date: string;
  created_by: string;
  participants: Profile[];
  payments: { payer_id: string; amount: number; payer: Profile }[];
  individual_items: {
    id: string;
    description: string;
    amount: number;
    participants: Profile[];
  }[];
}

export interface UserBalance {
  user: Profile;
  balance: number;
}

export function useBarNights() {
  const [barNights, setBarNights] = useState<BarNight[]>([]);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchBarNights = async () => {
    try {
      setLoading(true);
      
      // Fetch bar nights with all related data
      const { data: nights, error: nightsError } = await supabase
        .from('bar_nights')
        .select(`
          *,
          bar_night_participants (
            participant_id,
            share_amount,
            profiles (*)
          ),
          bar_night_payments (
            payer_id,
            amount,
            profiles (*)
          ),
          individual_items (
            id,
            description,
            amount,
            individual_item_participants (
              participant_id,
              share_amount,
              profiles (*)
            )
          )
        `)
        .order('date', { ascending: false });

      if (nightsError) throw nightsError;

      const formattedNights: BarNight[] = (nights || []).map(night => ({
        id: night.id,
        total_amount: Number(night.total_amount),
        date: night.date,
        created_by: night.created_by,
        participants: night.bar_night_participants?.map((p: any) => p.profiles) || [],
        payments: night.bar_night_payments?.map((p: any) => ({
          payer_id: p.payer_id,
          amount: Number(p.amount),
          payer: p.profiles
        })) || [],
        individual_items: night.individual_items?.map((item: any) => ({
          id: item.id,
          description: item.description,
          amount: Number(item.amount),
          participants: item.individual_item_participants?.map((p: any) => p.profiles) || []
        })) || []
      }));

      setBarNights(formattedNights);
      calculateBalances(formattedNights);
    } catch (error) {
      console.error('Error fetching bar nights:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalances = (nights: BarNight[]) => {
    const balanceMap = new Map<string, number>();
    
    // Initialize all users with 0 balance
    profiles.forEach(profile => {
      balanceMap.set(profile.user_id, 0);
    });

    nights.forEach(night => {
      const participantCount = night.participants.length;
      if (participantCount === 0) return;

      // Calculate base share per participant
      const baseSharePerPerson = night.total_amount / participantCount;

      // Each participant owes their base share
      night.participants.forEach(participant => {
        const currentBalance = balanceMap.get(participant.user_id) || 0;
        balanceMap.set(participant.user_id, currentBalance - baseSharePerPerson);
      });

      // Add payments (what people actually paid)
      night.payments.forEach(payment => {
        const currentBalance = balanceMap.get(payment.payer_id) || 0;
        balanceMap.set(payment.payer_id, currentBalance + payment.amount);
      });

      // Handle individual items
      night.individual_items.forEach(item => {
        const itemParticipantCount = item.participants.length;
        if (itemParticipantCount === 0) return;

        const sharePerPerson = item.amount / itemParticipantCount;
        
        // Each participant of this item owes their share
        item.participants.forEach(participant => {
          const currentBalance = balanceMap.get(participant.user_id) || 0;
          balanceMap.set(participant.user_id, currentBalance - sharePerPerson);
        });
      });
    });

    const balances: UserBalance[] = profiles.map(profile => ({
      user: profile,
      balance: balanceMap.get(profile.user_id) || 0
    }));

    setUserBalances(balances);
  };

  const createBarNight = async (data: any) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Create bar night
      const { data: newNight, error: nightError } = await supabase
        .from('bar_nights')
        .insert({
          total_amount: data.totalAmount,
          date: new Date(data.date).toISOString().split('T')[0],
          created_by: user.id
        })
        .select()
        .single();

      if (nightError) throw nightError;

      const barNightId = newNight.id;
      const participantCount = data.participants.length;
      const sharePerPerson = data.totalAmount / participantCount;

      // Add participants
      const participantInserts = data.participants.map((participantId: string) => ({
        bar_night_id: barNightId,
        participant_id: participantId,
        share_amount: sharePerPerson
      }));

      const { error: participantsError } = await supabase
        .from('bar_night_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      // Add payments
      if (Object.keys(data.paidBy).length > 0) {
        const paymentInserts = Object.entries(data.paidBy).map(([userId, amount]) => ({
          bar_night_id: barNightId,
          payer_id: userId,
          amount: amount as number
        }));

        const { error: paymentsError } = await supabase
          .from('bar_night_payments')
          .insert(paymentInserts);

        if (paymentsError) throw paymentsError;
      }

      // Add individual items
      if (data.individualItems && data.individualItems.length > 0) {
        for (const item of data.individualItems) {
          const { data: newItem, error: itemError } = await supabase
            .from('individual_items')
            .insert({
              bar_night_id: barNightId,
              description: item.description,
              amount: item.amount
            })
            .select()
            .single();

          if (itemError) throw itemError;

          const itemSharePerPerson = item.amount / item.participants.length;
          const itemParticipantInserts = item.participants.map((participantId: string) => ({
            individual_item_id: newItem.id,
            participant_id: participantId,
            share_amount: itemSharePerPerson
          }));

          const { error: itemParticipantsError } = await supabase
            .from('individual_item_participants')
            .insert(itemParticipantInserts);

          if (itemParticipantsError) throw itemParticipantsError;
        }
      }

      await fetchBarNights();
      return { error: null };
    } catch (error) {
      console.error('Error creating bar night:', error);
      return { error };
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchBarNights();
    }
  }, [profiles]);

  return {
    barNights,
    userBalances,
    profiles,
    loading,
    createBarNight,
    refetch: fetchBarNights
  };
}