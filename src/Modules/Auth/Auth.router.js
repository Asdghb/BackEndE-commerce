const express = require("express");
const AuthRouter = express.Router();
const { isValid } = require("../../Middleware/Validtion.Middieware");
const {
  registerData,
  activateAcount,
  LoginValid,
  forgetcodeValid,
  ResetPasswordValidData,
} = require("./Auth.validation");
const {
  register,
  ActivateAccount,
  Login,
  sendForgetCode,
  ResetPassword,
} = require("./Auth.conntroller");
// __________________________________________________________________________
// 1- Register
//  http://localhost:3000/auth/register
AuthRouter.post("/register", isValid(registerData), register);
// __________________________________________________________________________
// 2- Activate account
AuthRouter.get("/confirmEmail/:activationCode",isValid(activateAcount),ActivateAccount);
// __________________________________________________________________________
// 3- Login
// http://localhost:3000/auth/login
AuthRouter.post("/login", isValid(LoginValid), Login);
// __________________________________________________________________________
// 4- send Code password new
// http://localhost:3000/auth/forgetCode
AuthRouter.patch("/forgetCode", isValid(forgetcodeValid), sendForgetCode);
// __________________________________________________________________________
// 5- resetPassword
// http://localhost:3000/auth/resetPassword
AuthRouter.patch("/resetpassword", isValid(ResetPasswordValidData), ResetPassword);
// __________________________________________________________________________
module.exports = AuthRouter;
