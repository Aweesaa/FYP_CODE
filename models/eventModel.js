const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    org_id: {
      type: String,
      required: true,
    },
    event_name: {
      type: String,
      required: true,
    },
    date_created: {
      type: Date,
      required: true,
    },
    event_date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true
    },
    event_location: {
      type: String,
      required: true
    },
    event_details: {
      type: String,
      required: true
    },
    event_image: {
      data: Buffer,
      filename: String,
      contentType: String
    },
    aof: [{
      type: String,
    }],
    completion_status: {
      type: Boolean,
      required: true
    },
  });

  const Event = mongoose.model('events', eventSchema);
  module.exports = Event;