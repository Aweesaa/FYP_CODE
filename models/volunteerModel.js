const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true
    },
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    skills:[{
      type: String,
    }],
    total_hours_worked: {
        type: Number,
        required: false,
    },
    points: {
      type: Number,
      required: false,
    }
  });

  const Volunteer = mongoose.model('volunteers', volunteerSchema);
  module.exports = Volunteer;