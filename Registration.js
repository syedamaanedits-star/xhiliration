const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  passId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  college: { type: String, required: true },
  state: { type: String, required: true },
  sports: [{ type: String }],
  edmPass: { type: Boolean, default: false },
  payment: {
    amount: { type: Number, default: 0 },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' }
  },
  qrData: String, // Base64 QR code
  status: { type: String, enum: ['pending', 'confirmed', 'checked-in'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

registrationSchema.index({ email: 1, college: 1 });
registrationSchema.index({ passId: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
