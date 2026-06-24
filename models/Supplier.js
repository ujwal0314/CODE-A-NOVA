const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: String,
  email: String,
  address: String
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
