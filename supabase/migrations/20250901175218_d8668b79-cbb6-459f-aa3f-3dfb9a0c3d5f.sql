-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bar_nights table
CREATE TABLE public.bar_nights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bar_night_participants table (many-to-many)
CREATE TABLE public.bar_night_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_night_id UUID NOT NULL REFERENCES public.bar_nights(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bar_night_id, participant_id)
);

-- Create bar_night_payments table
CREATE TABLE public.bar_night_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_night_id UUID NOT NULL REFERENCES public.bar_nights(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create individual_items table
CREATE TABLE public.individual_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_night_id UUID NOT NULL REFERENCES public.bar_nights(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create individual_item_participants table
CREATE TABLE public.individual_item_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_item_id UUID NOT NULL REFERENCES public.individual_items(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(individual_item_id, participant_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_nights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_night_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_night_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_item_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for bar_nights
CREATE POLICY "Authenticated users can view all bar nights" 
ON public.bar_nights 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create bar nights" 
ON public.bar_nights 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update bar nights they created" 
ON public.bar_nights 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete bar nights they created" 
ON public.bar_nights 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Create policies for bar_night_participants
CREATE POLICY "Authenticated users can view all participants" 
ON public.bar_night_participants 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create participants" 
ON public.bar_night_participants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update participants" 
ON public.bar_night_participants 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete participants" 
ON public.bar_night_participants 
FOR DELETE 
TO authenticated
USING (true);

-- Create policies for bar_night_payments
CREATE POLICY "Authenticated users can view all payments" 
ON public.bar_night_payments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create payments" 
ON public.bar_night_payments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments" 
ON public.bar_night_payments 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete payments" 
ON public.bar_night_payments 
FOR DELETE 
TO authenticated
USING (true);

-- Create policies for individual_items
CREATE POLICY "Authenticated users can view all individual items" 
ON public.individual_items 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create individual items" 
ON public.individual_items 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update individual items" 
ON public.individual_items 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete individual items" 
ON public.individual_items 
FOR DELETE 
TO authenticated
USING (true);

-- Create policies for individual_item_participants
CREATE POLICY "Authenticated users can view all individual item participants" 
ON public.individual_item_participants 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create individual item participants" 
ON public.individual_item_participants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update individual item participants" 
ON public.individual_item_participants 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete individual item participants" 
ON public.individual_item_participants 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bar_nights_updated_at
BEFORE UPDATE ON public.bar_nights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();