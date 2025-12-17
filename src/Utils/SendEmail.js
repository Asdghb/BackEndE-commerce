const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // استخدم true لو port 465
      auth: {
        user: "9e354c001@smtp-brevo.com",
        pass: "O9fLsKkgzcpC4FqZ",
      },
    });

    const mailOptions = {
      from: `"E-commerce App" <9e354c001@smtp-brevo.com>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("Failed to send email via SMTP:", err);
    return false;
  }
};

module.exports = sendEmail;


// EMAIL_APP=9e354c001@smtp-brevo.com
// EMAIL_PASS=O9fLsKkgzcpC4FqZ
// SMTP_HOST=smtp-relay.brevo.com
// SMTP_PORT=587