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
      
      // Fetch bar nights first
      const { data: nights, error: nightsError } = await supabase
        .from('bar_nights')
        .select('*')
        .order('date', { ascending: false });

      if (nightsError) throw nightsError;

      if (!nights || nights.length === 0) {
        setBarNights([]);
        calculateBalances([]);
        return;
      }

      // Fetch all related data for each bar night
      const formattedNights: BarNight[] = await Promise.all(
        nights.map(async (night) => {
          // Fetch participants - Join with profiles using user_id
          const { data: participantData } = await supabase
            .from('bar_night_participants')
            .select(`
              participant_id,
              share_amount
            `)
            .eq('bar_night_id', night.id);

          // Get profile data for participants
          let participants: Profile[] = [];
          if (participantData && participantData.length > 0) {
            const participantIds = participantData.map(p => p.participant_id);
            const { data: participantProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('user_id', participantIds);
            
            participants = participantProfiles || [];
          }

          // Fetch payments
          const { data: paymentData } = await supabase
            .from('bar_night_payments')
            .select(`
              payer_id,
              amount
            `)
            .eq('bar_night_id', night.id);

          // Get profile data for payers
          let payments: { payer_id: string; amount: number; payer: Profile }[] = [];
          if (paymentData && paymentData.length > 0) {
            const payerIds = paymentData.map(p => p.payer_id);
            const { data: payerProfiles } = await supabase
              .from('profiles')
              .select('*')
              .in('user_id', payerIds);

            payments = paymentData.map(payment => {
              const payer = (payerProfiles || []).find(profile => profile.user_id === payment.payer_id);
              return {
                payer_id: payment.payer_id,
                amount: Number(payment.amount),
                payer: payer || { id: '', user_id: payment.payer_id, display_name: 'Unknown', email: '' }
              };
            });
          }

          // Fetch individual items
          const { data: items } = await supabase
            .from('individual_items')
            .select('*')
            .eq('bar_night_id', night.id);

          // Fetch item participants for each item
          const individualItemsWithParticipants = await Promise.all(
            (items || []).map(async (item) => {
              const { data: itemParticipantData } = await supabase
                .from('individual_item_participants')
                .select(`
                  participant_id,
                  share_amount
                `)
                .eq('individual_item_id', item.id);

              // Get profile data for item participants
              let itemParticipants: Profile[] = [];
              if (itemParticipantData && itemParticipantData.length > 0) {
                const itemParticipantIds = itemParticipantData.map(p => p.participant_id);
                const { data: itemParticipantProfiles } = await supabase
                  .from('profiles')
                  .select('*')
                  .in('user_id', itemParticipantIds);
                
                itemParticipants = itemParticipantProfiles || [];
              }

              return {
                id: item.id,
                description: item.description,
                amount: Number(item.amount),
                participants: itemParticipants
              };
            })
          );

          return {
            id: night.id,
            total_amount: Number(night.total_amount),
            date: night.date,
            created_by: night.created_by,
            participants: participants,
            payments: payments,
            individual_items: individualItemsWithParticipants
          };
        })
      );

      console.log('Formatted nights:', formattedNights);
      setBarNights(formattedNights);
      calculateBalances(formattedNights);
    } catch (error) {
      console.error('Error fetching bar nights:', error);
      setBarNights([]);
      calculateBalances([]);
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

    console.log('Calculated balances:', balances);
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

  const updateBarNight = async (data: any) => {
    if (!user) return;

    try {
      // Update bar night
      const { error: nightError } = await supabase
        .from('bar_nights')
        .update({
          total_amount: data.totalAmount,
        })
        .eq('id', data.id);

      if (nightError) throw nightError;

      // Delete existing participants, payments, and individual items
      await Promise.all([
        supabase.from('bar_night_participants').delete().eq('bar_night_id', data.id),
        supabase.from('bar_night_payments').delete().eq('bar_night_id', data.id),
        supabase.from('individual_item_participants').delete().in('individual_item_id', 
          await supabase.from('individual_items').select('id').eq('bar_night_id', data.id).then(res => res.data?.map(item => item.id) || [])
        ),
        supabase.from('individual_items').delete().eq('bar_night_id', data.id)
      ]);

      const participantCount = data.participants.length;
      const sharePerPerson = data.totalAmount / participantCount;

      // Add new participants
      const participantInserts = data.participants.map((participantId: string) => ({
        bar_night_id: data.id,
        participant_id: participantId,
        share_amount: sharePerPerson
      }));

      const { error: participantsError } = await supabase
        .from('bar_night_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      // Add new payments
      if (Object.keys(data.paidBy).length > 0) {
        const paymentInserts = Object.entries(data.paidBy).map(([userId, amount]) => ({
          bar_night_id: data.id,
          payer_id: userId,
          amount: amount as number
        }));

        const { error: paymentsError } = await supabase
          .from('bar_night_payments')
          .insert(paymentInserts);

        if (paymentsError) throw paymentsError;
      }

      // Add new individual items
      if (data.individualItems && data.individualItems.length > 0) {
        for (const item of data.individualItems) {
          const { data: newItem, error: itemError } = await supabase
            .from('individual_items')
            .insert({
              bar_night_id: data.id,
              description: item.description,
              amount: item.amount
            })
            .select()
            .single();

          if (itemError) throw itemError;

          const itemParticipantCount = item.participants.length;
          const itemSharePerPerson = item.amount / itemParticipantCount;

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
    } catch (error) {
      console.error('Error updating bar night:', error);
      throw error;
    }
  };

  return {
    barNights,
    userBalances,
    profiles,
    loading,
    createBarNight,
    updateBarNight,
    refetch: fetchBarNights
  };
}
