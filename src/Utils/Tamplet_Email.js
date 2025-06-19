const template_Email = (activationCode , username ) => `
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <title>رمز التحقق</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      direction: rtl;
    }
    .container {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      max-width: 500px;
      margin: auto;
    }
    .code {
      font-size: 24px;
      font-weight: bold;
      color: #28a745;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      font-size: 12px;
      color: #888;
      margin-top: 30px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>مرحبًا {${username}}،</h2>
    <p>شكرًا لانضمامك إلى <strong>E-commerce App</strong>!</p>
    <p>يرجى استخدام رمز التحقق التالي لتفعيل حسابك:</p>
    <div> activationCode:${activationCode} </div>
    <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.</p>
    <div class="footer">© 2025 E-commerce App جميع الحقوق محفوظة</div>
  </div>
</body>
</html>`;

module.exports = template_Email;
