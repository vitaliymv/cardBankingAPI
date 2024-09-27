const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    ownerKey: {
        type: String,
        required: true,
    },
    cardNumber: {
        type: String,
        required: true,
        unique: true,
    },
    cvv: {
        type: String,
        required: true,
    },
    expireDate: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
});

const Card = mongoose.model('Card', cardSchema);
module.exports = Card;