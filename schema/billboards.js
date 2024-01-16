// Require Mongoose
const mongoose = require('mongoose');

// Define the billboard schema
const billboardSchema = new mongoose.Schema({
  image: {
    type: String, // Assuming you store the image URL
    required: true,
  },
  header: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },addedDate: {
    type: Date, 
    default: Date.now, 
  },
  status:{
    type:Boolean,
    default:false
  }
});

// Create a Billboard model based on the schema
const Billboard = mongoose.model('Billboard', billboardSchema);

module.exports = Billboard;
