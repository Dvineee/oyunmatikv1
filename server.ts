import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const APP_PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'oyunmatik-varsayilan-gizli-anahtar-123';

const app = express();
const httpServer = createServer(app);

// İstekleri logla (Hata ayıklama için)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Veritabanı Kurulumu
const db = sqlite3('db.sqlite');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    avatar_id TEXT,
    is_online BOOLEAN DEFAULT 0,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT,
    host_id TEXT,
    max_players INTEGER,
    status TEXT DEFAULT 'waiting',
    player_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(host_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    user_id TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// API Rotaları
app.post('/api/auth/signup', (req, res) => {
  const { username, password, avatar_id } = req.body;
  const id = Math.random().toString(36).substring(2, 11);
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare('INSERT INTO users (id, username, password, avatar_id) VALUES (?, ?, ?, ?)')
      .run(id, username, hashedPassword, avatar_id);
    
    const token = jwt.sign({ id, username }, JWT_SECRET);
    res.json({ token, user: { id, username, avatar_id } });
  } catch (err) {
    res.status(400).json({ error: 'Kullanıcı adı zaten alınmış.' });
  }
});

app.post('/api/auth/signin', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, avatar_id: user.avatar_id } });
  } else {
    res.status(400).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
  }
});

app.get('/api/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, username, avatar_id FROM users WHERE id = ?').get(decoded.id) as any;
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Yetkisiz' });
  }
});

app.get('/api/rooms', (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*, u.username as host_name, u.avatar_id as host_avatar 
    FROM rooms r 
    JOIN users u ON r.host_id = u.id 
    ORDER BY r.created_at DESC
  `).all();
  res.json(rooms);
});

// WebSocket İşlemleri
const onlineUsers = new Map();

io.on('connection', (socket) => {
  let currentUser: any = null;

  socket.on('auth', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      currentUser = db.prepare('SELECT id, username, avatar_id FROM users WHERE id = ?').get(decoded.id);
      if (currentUser) {
        onlineUsers.set(currentUser.id, { ...currentUser, socketId: socket.id });
        io.emit('online_users', Array.from(onlineUsers.values()));
      }
    } catch (err) {}
  });

  socket.on('create_room', (data) => {
    if (!currentUser) return;
    const roomId = Math.random().toString(36).substring(2, 11);
    db.prepare('INSERT INTO rooms (id, name, host_id, max_players, player_count) VALUES (?, ?, ?, ?, ?)')
      .run(roomId, data.name, currentUser.id, data.maxPlayers, 1);
    
    socket.join(roomId);
    socket.emit('room_created', { id: roomId });
    io.emit('rooms_updated');
  });

  socket.on('join_room', (roomId) => {
    if (!currentUser) return;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any;
    if (room && room.player_count < room.max_players) {
      db.prepare('UPDATE rooms SET player_count = player_count + 1 WHERE id = ?').run(roomId);
      socket.join(roomId);
      io.to(roomId).emit('player_joined', { user: currentUser });
      io.emit('rooms_updated');
    }
  });

  socket.on('send_message', (data) => {
    if (!currentUser) return;
    const msgId = Math.random().toString(36).substring(2, 11);
    db.prepare('INSERT INTO messages (id, room_id, user_id, content) VALUES (?, ?, ?, ?)')
      .run(msgId, data.roomId, currentUser.id, data.content);
    
    io.to(data.roomId).emit('new_message', {
      id: msgId,
      room_id: data.roomId,
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_url: currentUser.avatar_id,
      content: data.content,
      created_at: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    if (currentUser) {
      onlineUsers.delete(currentUser.id);
      io.emit('online_users', Array.from(onlineUsers.values()));
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(APP_PORT, '0.0.0.0', () => {
    console.log(`Sunucu http://localhost:${APP_PORT} adresinde çalışıyor`);
  });
}

startServer();
