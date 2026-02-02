-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coverage_areas table
CREATE TABLE public.coverage_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius INTEGER NOT NULL DEFAULT 2000,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expanding')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_content table for managing text content
CREATE TABLE public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    content JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_assets table for logos and images
CREATE TABLE public.site_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_key TEXT NOT NULL UNIQUE,
    asset_url TEXT NOT NULL,
    alt_text TEXT,
    asset_type TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('logo', 'image', 'icon')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for coverage_areas (public read, admin write)
CREATE POLICY "Anyone can view coverage areas"
ON public.coverage_areas
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage coverage areas"
ON public.coverage_areas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for site_content (public read, admin write)
CREATE POLICY "Anyone can view site content"
ON public.site_content
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage site content"
ON public.site_content
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for site_assets (public read, admin write)
CREATE POLICY "Anyone can view site assets"
ON public.site_assets
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage site assets"
ON public.site_assets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Storage policies for site-assets bucket
CREATE POLICY "Anyone can view site assets files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

-- Insert default coverage areas
INSERT INTO public.coverage_areas (name, latitude, longitude, radius, status) VALUES
('Harare CBD', -17.8292, 31.0522, 3000, 'active'),
('Borrowdale', -17.7575, 31.0989, 2500, 'active'),
('Avondale', -17.7925, 31.0339, 2000, 'active'),
('Mount Pleasant', -17.7679, 31.0485, 2200, 'active'),
('Eastlea', -17.8194, 31.0783, 1800, 'active'),
('Belvedere', -17.8372, 31.0247, 1500, 'expanding'),
('Highlands', -17.7839, 31.0694, 2000, 'active'),
('Chitungwiza', -18.0127, 31.0755, 4000, 'expanding');

-- Insert default site content
INSERT INTO public.site_content (section_key, title, subtitle, description) VALUES
('hero', 'Fast. Reliable. Connected.', 'High-Speed Internet for Zimbabwe', 'Experience lightning-fast wireless internet with Hextech. We bring reliable connectivity to homes and businesses across Zimbabwe.'),
('about', 'About Hextech', 'Your Trusted Internet Partner', 'Hextech is a leading internet service provider in Zimbabwe, dedicated to delivering high-speed, reliable connectivity to homes and businesses.'),
('contact', 'Get in Touch', 'We''d love to hear from you', 'Have questions about our services? Reach out to us and our team will get back to you promptly.');