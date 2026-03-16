const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendConfirmationEmail(registration) {
  const qrDataURL = await QRCode.toDataURL(registration.passId, { width: 300 });
  
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to: registration.email,
    subject: `✅ X-Hiliration 2026 - Pass Confirmed! (${registration.passId})`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #04020f; color: #e8e0ff; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding: 30px 0; }
        .logo { font-size: 2.5em; font-weight: 900; background: linear-gradient(135deg, #00f0ff, #b400ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .pass-id { background: #0a0520; border: 1px solid #00f0ff; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 1.1em; color: #00f0ff; text-align: center; margin: 20px 0; }
        .qr-code { background: white; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center; }
        .sports { background: rgba(0,240,255,0.05); border: 1px solid rgba(0,240,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 30px 0; color: #7a6fa8; font-size: 0.9em; }
        .btn { display: inline-block; background: linear-gradient(135deg, #00f0ff, #b400ff); color: black; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">X-HILIRATION 2026</div>
          <h1 style="color: #00f0ff; margin: 10px 0;">Registration Confirmed! 🎉</h1>
        </div>
        
        <div class="pass-id">${registration.passId}</div>
        
        <div class="qr-code">
          <h3 style="color: #fff; margin-bottom: 15px;">Your QR Pass</h3>
          <img src="${qrDataURL}" alt="QR Pass" style="max-width: 250px;">
          <p style="color: #7a6fa8; font-size: 0.9em; margin-top: 10px;">Show this at entry points</p>
        </div>
        
        <div style="background: rgba(57,255,20,0.05); border: 1px solid rgba(57,255,20,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #39ff14; margin-bottom: 10px;">Event Details</h3>
          <p><strong>College:</strong> ${registration.college}</p>
          <p><strong>Sports:</strong> ${registration.sports.join(', ') || 'EDM Night'}</p>
          ${registration.edmPass ? '<p><strong>EDM Night:</strong> Included</p>' : ''}
          <p><strong>Event Dates:</strong> March 23-29, 2026</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://your-website.com" class="btn">View Event Schedule</a>
          <a href="https://your-website.com/leaderboard" class="btn">Live Leaderboard</a>
        </div>
        
        <
