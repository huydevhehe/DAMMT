-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users (admin users - for authentication)
-- This table will be created automatically by Supabase Auth
-- We'll create a profiles table for additional user info

-- Table: profiles (admin user profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: tracked_users (anonymous users being tracked)
CREATE TABLE public.tracked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_id TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT tracked_users_anonymous_id_check CHECK (length(anonymous_id) > 0)
);

-- Table: pages (pages being tracked)
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT pages_url_check CHECK (length(url) > 0)
);

-- Table: sessions (user sessions)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracked_user_id UUID NOT NULL REFERENCES public.tracked_users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  CONSTRAINT sessions_duration_check CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- Table: event_types (categories of events)
CREATE TABLE public.event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT event_types_name_check CHECK (length(name) > 0),
  CONSTRAINT event_types_category_check CHECK (category IN ('click', 'scroll', 'form', 'navigation', 'custom'))
);

-- Table: events (individual user events)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type_id UUID NOT NULL REFERENCES public.event_types(id),
  page_id UUID REFERENCES public.pages(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  element_id TEXT,
  element_class TEXT,
  element_tag TEXT,
  x_position INTEGER,
  y_position INTEGER,
  scroll_depth INTEGER,
  metadata JSONB,
  CONSTRAINT events_x_position_check CHECK (x_position IS NULL OR x_position >= 0),
  CONSTRAINT events_y_position_check CHECK (y_position IS NULL OR y_position >= 0),
  CONSTRAINT events_scroll_depth_check CHECK (scroll_depth IS NULL OR (scroll_depth >= 0 AND scroll_depth <= 100))
);

-- Table: heatmap_data (aggregated heatmap data)
CREATE TABLE public.heatmap_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  click_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  CONSTRAINT heatmap_data_x_position_check CHECK (x_position >= 0),
  CONSTRAINT heatmap_data_y_position_check CHECK (y_position >= 0),
  CONSTRAINT heatmap_data_click_count_check CHECK (click_count >= 0),
  UNIQUE(page_id, x_position, y_position, date)
);

-- Table: analytics_daily (daily aggregated analytics)
CREATE TABLE public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  unique_visitors INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  avg_session_duration NUMERIC(10,2),
  bounce_rate NUMERIC(5,2),
  CONSTRAINT analytics_daily_date_page_unique UNIQUE(date, page_id),
  CONSTRAINT analytics_daily_unique_visitors_check CHECK (unique_visitors >= 0),
  CONSTRAINT analytics_daily_total_sessions_check CHECK (total_sessions >= 0),
  CONSTRAINT analytics_daily_bounce_rate_check CHECK (bounce_rate IS NULL OR (bounce_rate >= 0 AND bounce_rate <= 100))
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_tracked_user ON public.sessions(tracked_user_id);
CREATE INDEX idx_sessions_start ON public.sessions(session_start);
CREATE INDEX idx_events_session ON public.events(session_id);
CREATE INDEX idx_events_timestamp ON public.events(timestamp);
CREATE INDEX idx_events_page ON public.events(page_id);
CREATE INDEX idx_heatmap_page_date ON public.heatmap_data(page_id, date);
CREATE INDEX idx_analytics_date ON public.analytics_daily(date);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (admin can view their own profile)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tracked_users (public insert, admin select)
CREATE POLICY "Anyone can insert tracked users" ON public.tracked_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all tracked users" ON public.tracked_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for pages (public insert, admin select)
CREATE POLICY "Anyone can insert pages" ON public.pages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all pages" ON public.pages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for sessions (public insert/update, admin select)
CREATE POLICY "Anyone can insert sessions" ON public.sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" ON public.sessions
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view all sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for event_types (admin only)
CREATE POLICY "Admins can manage event types" ON public.event_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for events (public insert, admin select)
CREATE POLICY "Anyone can insert events" ON public.events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for heatmap_data (public insert/update, admin select)
CREATE POLICY "Anyone can insert heatmap data" ON public.heatmap_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update heatmap data" ON public.heatmap_data
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view all heatmap data" ON public.heatmap_data
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- RLS Policies for analytics_daily (admin only)
CREATE POLICY "Admins can view analytics" ON public.analytics_daily
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default event types
INSERT INTO public.event_types (name, category, description) VALUES
  ('page_view', 'navigation', 'User viewed a page'),
  ('click', 'click', 'User clicked an element'),
  ('scroll', 'scroll', 'User scrolled the page'),
  ('form_submit', 'form', 'User submitted a form'),
  ('form_focus', 'form', 'User focused on a form field'),
  ('button_click', 'click', 'User clicked a button'),
  ('link_click', 'click', 'User clicked a link'),
  ('mouse_move', 'custom', 'User moved mouse'),
  ('session_start', 'navigation', 'User started a new session'),
  ('session_end', 'navigation', 'User ended their session');

-- Enable realtime for events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_daily;