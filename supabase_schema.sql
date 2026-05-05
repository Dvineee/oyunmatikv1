
-- 1. PROFILES (Extends Auth Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT 'animal_1',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ROOMS
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  max_players INT DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 4),
  is_private BOOLEAN DEFAULT false,
  password TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROOM PLAYERS (Junction table)
CREATE TABLE room_players (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- 4. MESSAGES
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BANS
CREATE TABLE bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by UUID REFERENCES profiles(id),
  is_permanent BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Row Level Security (RLS) Basic Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for setup)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Hosts can update their own rooms" ON rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their own rooms" ON rooms FOR DELETE USING (auth.uid() = host_id);

CREATE POLICY "Room players viewable by everyone" ON room_players FOR SELECT USING (true);
CREATE POLICY "Users can join rooms" ON room_players FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can leave rooms" ON room_players FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Messages viewable by room members" ON messages FOR SELECT USING (true); -- Simplified
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Bans viewable by everyone" ON bans FOR SELECT USING (true);
