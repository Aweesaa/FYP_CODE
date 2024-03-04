const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    equippeditems: {
        type: [{
          type: String
        }],
        default: []
    }
  });

  const Avatar = mongoose.model('avatars', avatarSchema);
  module.exports = Avatar;