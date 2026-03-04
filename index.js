const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(express.json());

// Render використовує process.env.PORT
const PORT = process.env.PORT || 3000;

// 📌 Підключення SQLite
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');

    // Створення таблиці якщо не існує
    db.run(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ownerKey TEXT NOT NULL,
        cardNumber TEXT UNIQUE NOT NULL,
        cvv TEXT NOT NULL,
        expireDate TEXT NOT NULL,
        balance REAL DEFAULT 0
      )
    `);
  }
});

// 🔹 Генерація даних
function generateCardNumber() {
  return '4' + Math.random().toString().slice(2, 15).padEnd(15, '0');
}

function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpireDate() {
  const today = new Date();
  const expireYear = today.getFullYear() + 3;
  const expireMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  return `${expireMonth}/${expireYear.toString().slice(2)}`;
}

// =========================
// POST /cards
// =========================
app.post('/cards', (req, res) => {
  const { ownerKey } = req.body;

  if (!ownerKey) {
    return res.status(400).json({ error: 'ownerKey is required' });
  }

  const cardNumber = generateCardNumber();
  const cvv = generateCVV();
  const expireDate = generateExpireDate();

  const sql = `
    INSERT INTO cards (ownerKey, cardNumber, cvv, expireDate, balance)
    VALUES (?, ?, ?, ?, 0)
  `;

  db.run(sql, [ownerKey, cardNumber, cvv, expireDate], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      ownerKey,
      cardNumber,
      cvv,
      expireDate,
      balance: 0
    });
  });
});

// =========================
// GET /cards/:ownerKey
// =========================
app.get('/cards/:ownerKey', (req, res) => {
  const { ownerKey } = req.params;

  db.all(`SELECT * FROM cards WHERE ownerKey = ?`, [ownerKey], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    res.status(200).json(rows);
  });
});

// =========================
// PUT /cards/:cardNumber/balance
// =========================
app.put('/cards/:cardNumber/balance', (req, res) => {
  const { cardNumber } = req.params;
  const { amount } = req.body;

  if (amount === undefined) {
    return res.status(400).json({ error: 'amount is required' });
  }

  const updateSql = `
    UPDATE cards
    SET balance = balance + ?
    WHERE cardNumber = ?
  `;

  db.run(updateSql, [amount, cardNumber], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    db.get(`SELECT * FROM cards WHERE cardNumber = ?`, [cardNumber], (err, row) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      res.status(200).json(row);
    });
  });
});

// =========================
// DELETE /cards/:cardNumber
// =========================
app.delete('/cards/:cardNumber', (req, res) => {
  const { cardNumber } = req.params;

  db.run(`DELETE FROM cards WHERE cardNumber = ?`, [cardNumber], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.status(200).json({ message: 'Card deleted successfully' });
  });
});

// =========================
// Health check (для Render)
// =========================
app.get('/', (req, res) => {
  res.send('Card API is running 🚀');
});

// =========================
// Start server
// =========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
