
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_APP, // بريدك الإلكتروني الكامل مثل: yourname@gmail.com
      pass: process.env.EMAIL_PASS, // كلمة مرور التطبيق (App Password)
    },
  });
  const mailOptions = {
    from: `"E-commerce App" <${process.env.EMAIL_APP}>`,
    to,
    subject,
    html,
    attachments,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    return info.accepted.length > 0;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
};
module.exports = sendEmail;
