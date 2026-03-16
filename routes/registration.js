const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const Registration = require('../models/Registration');
const { sendConfirmationEmail } = require('../utils/email');

const router = express.Router();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise
      currency,
      receipt,
      notes: {
        event: 'X-Hiliration 2026'
      }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Payment & Complete Registration
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      registrationData 
    } = req.body;

    // Verify Razorpay signature
    const sign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (sign !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Generate unique pass ID
    const passId = `XH26-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Generate QR Code
    const qrData = await QRCode.toDataURL(passId, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Save registration
    const registration = new Registration({
      ...registrationData,
      passId,
      qrData: qrData.split(',')[1], // Store base64 without prefix
      payment: {
        amount: registrationData.payment?.amount || 0,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid'
      },
      status: 'confirmed'
    });

    await registration.save();

    // Send confirmation email
    await sendConfirmationEmail(registration);

    res.json({
      success: true,
      passId,
      message: 'Registration confirmed! Check your email for QR pass.'
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Free Registration (Sports only)
router.post('/free-register', async (req, res) => {
  try {
    const { name, email, phone, college, state, sports } = req.body;

    if (!name || !email || !phone || !college || !state || sports.length === 0) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if already registered
    const existing = await Registration.findOne({ 
      email, 
      college,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already registered with this college' });
    }

    const passId = `XH26-FREE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const qrData = await QRCode.toDataURL(passId, { width: 256 });

    const registration = new Registration({
      name, email, phone, college, state, sports,
      passId,
      qrData: qrData.split(',')[1],
      status: 'confirmed'
    });

    await registration.save();
    await sendConfirmationEmail(registration);

    res.json({
      success: true,
      passId,
      message: 'Sports registration confirmed!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get registration by passId (for check-in)
router.get('/pass/:passId', async (req, res) => {
  try {
    const registration = await Registration.findOne({ 
      passId: req.params.passId,
      status: 'confirmed'
    });

    if (!registration) {
      return res.status(404).json({ error: 'Pass not found or invalid' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
