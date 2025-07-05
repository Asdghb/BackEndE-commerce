const express = require("express");
const AuthRouter = express.Router();
const { isValid } = require("../../Middleware/Validtion.Middieware");
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const {
  registerData,
  activateAcount,
  LoginValid,
  forgetcodeValid,
  ResetPasswordValidData,
  NewCreateadminValidData,
} = require("./Auth.validation");
const {
  register,
  ActivateAccount,
  Login,
  sendForgetCode,
  ResetPassword,
  NewCreateadmin,
  GetAllAdmin,
  DeleteSangleAdmin,
} = require("./Auth.conntroller");
// __________________________________________________________________________
// 1- Register
//  http://localhost:3000/auth/register
AuthRouter.post("/register", isValid(registerData), register);
// __________________________________________________________________________
// 2- Activate account
AuthRouter.post("/confirmEmail", isValid(activateAcount), ActivateAccount);
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
AuthRouter.patch(
  "/resetpassword",
  isValid(ResetPasswordValidData),
  ResetPassword
);
// __________________________________________________________________________
// 6- NewCreateadmin
// http://localhost:3000/auth/NewCreateadmin
AuthRouter.post(
  "/NewCreateadmin",
  isAuthentication,
  isAuthorized("admin"),
  isValid(NewCreateadminValidData),
  NewCreateadmin
);
// __________________________________________________________________________
// 7- GetAllAdmin
// http://localhost:3000/auth/GetAllAdmin
AuthRouter.get(
  "/GetAllAdmin",
  isAuthentication,
  isAuthorized("admin"),
  GetAllAdmin
);
// __________________________________________________________________________
// 8- DeleteSangleAdmin
// http://localhost:3000/auth/DeleteSangleAdmin/:AdminId
AuthRouter.patch(
  "/DeleteSangleAdmin/:AdminId",
  isAuthentication,
  isAuthorized("admin"),
  DeleteSangleAdmin
);
// __________________________________________________________________________
module.exports = AuthRouter;
