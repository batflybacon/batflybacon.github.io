-- Add name field to bar_nights table
ALTER TABLE public.bar_nights 
ADD COLUMN name TEXT NOT NULL DEFAULT 'Bar-Abend';