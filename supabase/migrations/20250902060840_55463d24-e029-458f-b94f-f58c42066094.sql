-- Add proper foreign key constraints that were missing
ALTER TABLE bar_night_participants ADD CONSTRAINT bar_night_participants_bar_night_id_fkey 
FOREIGN KEY (bar_night_id) REFERENCES bar_nights(id) ON DELETE CASCADE;

ALTER TABLE bar_night_participants ADD CONSTRAINT bar_night_participants_participant_id_fkey 
FOREIGN KEY (participant_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE bar_night_payments ADD CONSTRAINT bar_night_payments_bar_night_id_fkey 
FOREIGN KEY (bar_night_id) REFERENCES bar_nights(id) ON DELETE CASCADE;

ALTER TABLE bar_night_payments ADD CONSTRAINT bar_night_payments_payer_id_fkey 
FOREIGN KEY (payer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE individual_items ADD CONSTRAINT individual_items_bar_night_id_fkey 
FOREIGN KEY (bar_night_id) REFERENCES bar_nights(id) ON DELETE CASCADE;

ALTER TABLE individual_item_participants ADD CONSTRAINT individual_item_participants_individual_item_id_fkey 
FOREIGN KEY (individual_item_id) REFERENCES individual_items(id) ON DELETE CASCADE;

ALTER TABLE individual_item_participants ADD CONSTRAINT individual_item_participants_participant_id_fkey 
FOREIGN KEY (participant_id) REFERENCES profiles(user_id) ON DELETE CASCADE;