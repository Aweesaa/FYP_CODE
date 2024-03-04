const mongoose = require('mongoose');

const clothingSchema = new mongoose.Schema({
    category: {
      type: String,
      required: true
    },
    item_name: {
      type: String,
      required: true,
    },
    item_image: {
      type: String,
      required: true
    },
    item_description: {
      type: String,
      required: true
    },
    item_price: {
        type: Number,
        required: true
      }
  });

  const Clothing = mongoose.model('clothes', clothingSchema);
  module.exports = Clothing;