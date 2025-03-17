
// models/MarketItem.js
const mongoose = require('mongoose');

const MarketItemSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'Member',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    enum: ['crops', 'livestock', 'equipment', 'services', 'other'],
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  priceUnit: {
    type: String,
    required: [true, 'Please add a price unit (e.g., per kg, per bag)']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity available']
  },
  quantityUnit: {
    type: String,
    required: [true, 'Please add quantity unit (e.g., kg, bags)']
  },
  location: {
    type: String,
    required: [true, 'Please add pickup/delivery location']
  },
  images: [{
    type: String
  }],
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableTo: {
    type: Date
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'unavailable'],
    default: 'available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MarketItem', MarketItemSchema);
