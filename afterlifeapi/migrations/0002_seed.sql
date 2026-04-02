-- Seed data for testing

-- Users
INSERT INTO users (id, name, email, password_hash, phone, gender, age, credits) VALUES
  ('user-1', 'hizuki', 'hizuki@afterlife.run', 'seed:nologin', '010-1234-5678', 'male', 30, 100),
  ('user-2', 'mina', 'mina@afterlife.run', 'seed:nologin', '010-2345-6789', 'female', 25, 50),
  ('user-3', 'taro', 'taro@afterlife.run', 'seed:nologin', '010-3456-7890', 'male', 35, 200);

-- User interests
INSERT INTO user_interests (user_id, interest) VALUES
  ('user-1', 'AI'),
  ('user-1', 'Music'),
  ('user-2', 'Art'),
  ('user-2', 'Travel'),
  ('user-3', 'Tech'),
  ('user-3', 'Gaming');

-- Clones
INSERT INTO clones (id, name, username, avatar_url, cover_image_url, type, category, description, visibility, learning_progress, created_by) VALUES
  ('clone-1', 'grandfather', '@grandfather', '', '', '멤로우', 'Daily & Emotional Care', 'How was your day? Feel free to share anything on your mind.', 'public', 65, 'user-1'),
  ('clone-2', 'grandmother', '@grandmother', '', '', '멤로우', 'Daily & Emotional Care', 'My dear, never lose your smile. Grandma is always cheering for you.', 'public', 42, 'user-1'),
  ('clone-3', 'sungjae', '@sungjae_lee', '', '', '친구', 'Entertainment & Hobby', 'Hey! Lets make today a great day together.', 'public', 80, 'user-2'),
  ('clone-4', 'mentor_kim', '@mentor_kim', '', '', '멘토', 'Career & Education', 'What are your goals for this week? Lets plan together.', 'private', 30, 'user-3');

-- Clone interests
INSERT INTO clone_interests (clone_id, interest) VALUES
  ('clone-1', 'Daily Chat'),
  ('clone-1', 'Emotional Care'),
  ('clone-1', 'Life Advice'),
  ('clone-2', 'Emotional Care'),
  ('clone-2', 'Memories'),
  ('clone-3', 'Entertainment'),
  ('clone-3', 'Humor'),
  ('clone-4', 'Career'),
  ('clone-4', 'Education');

-- Feeds
INSERT INTO feeds (id, clone_id, image_url, title, description, main_category, likes_count, comments_count) VALUES
  ('feed-1', 'clone-1', '', 'Grandfather', 'How was your day? Feel free to share anything on your mind.', 'Daily & Emotional Care', 12400, 842),
  ('feed-2', 'clone-2', '', 'Grandmother', 'My dear, never lose your smile. Grandma is always cheering for you.', 'Daily & Emotional Care', 8700, 523),
  ('feed-3', 'clone-3', '', 'Sungjae Lee', 'Hey! Lets make today a great day together.', 'Entertainment & Hobby', 15200, 1204);

-- Messages (session-based chat)
INSERT INTO messages (id, session_id, clone_id, user_id, sender_type, text, input_type) VALUES
  ('msg-1', 'session-1', 'clone-1', 'user-1', 'user', 'Grandpa, I miss you so much.', 'text'),
  ('msg-2', 'session-1', 'clone-1', 'user-1', 'clone', 'I miss you too. Tell me, how have you been lately?', 'text'),
  ('msg-3', 'session-1', 'clone-1', 'user-1', 'user', 'Work has been tough, but Im hanging in there.', 'voice'),
  ('msg-4', 'session-1', 'clone-1', 'user-1', 'clone', 'Thats my grandchild. Tough times dont last, tough people do.', 'text'),
  ('msg-5', 'session-2', 'clone-2', 'user-1', 'user', 'Grandma, I made your kimchi recipe today!', 'text'),
  ('msg-6', 'session-2', 'clone-2', 'user-1', 'clone', 'Oh my! Did you add the right amount of fish sauce? That is the secret.', 'text'),
  ('msg-7', 'session-3', 'clone-3', 'user-2', 'user', 'Hey, want to watch a movie tonight?', 'text'),
  ('msg-8', 'session-3', 'clone-3', 'user-2', 'clone', 'Sure! How about a comedy? I could use some laughs.', 'text');

-- Gifts
INSERT INTO gifts (id, name, emoji, price) VALUES
  ('gift-1', 'Coffee', 'coffee', 10),
  ('gift-2', 'Flower', 'flower', 20),
  ('gift-3', 'Heart', 'heart', 5),
  ('gift-4', 'Star', 'star', 50),
  ('gift-5', 'Crown', 'crown', 100);

-- Follows
INSERT INTO follows (user_id, clone_id) VALUES
  ('user-1', 'clone-3'),
  ('user-2', 'clone-1'),
  ('user-2', 'clone-2'),
  ('user-3', 'clone-1');

-- Clone shares (private clone shared to specific user)
INSERT INTO clone_shares (clone_id, owner_id, shared_to) VALUES
  ('clone-4', 'user-3', 'user-1');
