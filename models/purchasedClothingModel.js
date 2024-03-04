const mongoose = require('mongoose');

const purchasedClothesSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true
    },
    item_id: {
      type: String,
      required: true
    }
  });

  const PurchasedClothing = mongoose.model('purchasedclothes', purchasedClothesSchema);
  module.exports = PurchasedClothing;