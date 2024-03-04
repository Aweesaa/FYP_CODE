const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    volunteer_id: {
      type: String,
      required: true
    },
    event_id: {
      type: String,
      required: true,
    },
    application_date: {
      type: Date,
      required: true
    },
    attendance_status: {
      type: Number,
      required: true
    },
    hours_worked: {
        type: Number,
        required: true
      }
  });

  const Application = mongoose.model('applications', applicationSchema);
  module.exports = Application;