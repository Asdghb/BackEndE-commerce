const Tamplet_Email_ResetPassword = (Code) =>
  `<!DOCTYPE html>
<html lang="en" style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
</head>
<body style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <h2 style="color: #333333;">Reset Your Password</h2>
  <p style="color: #555555;">Hello,</p>
  <p style="color: #555555;">
    We received a request to reset your password. Click the button below to set a new password:
  </p>
  <h1 
     style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 20px; margin: 20px 0; border-radius: 5px; text-decoration: none; font-weight: bold;">
    Reset Password Code :${Code}
  </h1>
  <p style="color: #777777; font-size: 14px;">
    If you didn’t request a password reset, you can safely ignore this email.
  </p>
  <p style="color: #777777; font-size: 14px;">Thanks,<br>The Team</p>
</body>
</html>
`;
module.exports = Tamplet_Email_ResetPassword;
