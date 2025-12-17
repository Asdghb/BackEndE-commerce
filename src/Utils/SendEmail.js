const nodemailer = require("nodemailer");
require("dotenv").config();
// _____________________________________________________________________________
const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_APP, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: `"E-commerce App" <${process.env.EMAIL_APP}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("Failed to send email via Gmail:", err);
    return false;
  }
};
// ____________________________________________________________________
module.exports = sendEmail;
