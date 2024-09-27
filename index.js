const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Card = require('./models/card');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


function generateCardNumber() {
  return '4' + Math.random().toString().slice(2, 15).padEnd(15, '0');
}

function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString(); // Генерує число від 100 до 999
}

function generateExpireDate() {
  const today = new Date();
  const expireYear = today.getFullYear() + 3; // Додаємо 3 роки
  const expireMonth = (today.getMonth() + 1).toString().padStart(2, '0'); // Місяці від 1 до 12
  return `${expireMonth}/${expireYear.toString().slice(2)}`; // Формат MM/YY
}

app.post('/cards', async (req, res) => {
  const { ownerKey } = req.body;
  const cardNumber = generateCardNumber();
  const cvv = generateCVV();
  const expireDate = generateExpireDate();

  try {
    const newCard = new Card({ ownerKey, cardNumber, cvv, expireDate, balance: 0 });
    await newCard.save();
    res.status(201).json(newCard);
  } catch (err) {
    res.status(400).json({ error: 'Error creating card', details: err.message });
  }
});

app.get('/cards/:ownerKey', async (req, res) => {
  const { ownerKey } = req.params;
  try {
    const cards = await Card.find({ ownerKey });
    res.status(200).json(cards);
  } catch (err) {
    res.status(400).json({ error: 'Error fetching cards', details: err.message });
  }
});

app.put('/cards/:cardNumber/balance', async (req, res) => {
  const { cardNumber } = req.params;
  const { amount } = req.body;
  try {
    const card = await Card.findOne({ cardNumber });
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    card.balance += amount;
    await card.save();
    res.status(200).json(card);
  } catch (err) {
    res.status(400).json({ error: 'Error updating balance', details: err.message });
  }
});

app.delete('/cards/:cardNumber', async (req, res) => {
  const { cardNumber } = req.params;
  try {
    const deletedCard = await Card.findOneAndDelete({ cardNumber });
    if (!deletedCard) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.status(200).json({ message: 'Card deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Error deleting card', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});