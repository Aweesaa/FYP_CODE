const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true
    },
    org_name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    logo_image: {
        data: Buffer,
        filename: String,
        contentType: String
      },
    aof: [{
        type: String,
      }]
  });

  const Organisation = mongoose.model('organisations', orgSchema);
  module.exports = Organisation;