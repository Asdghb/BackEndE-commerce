const express = require("express");
const AuthRouter = express.Router();
const { isValid } = require("../../Middleware/Validtion.Middieware");
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const {
  registerData,
  LoginValid,
  createActivationCodeV,
} = require("./Auth.validation");
const {
  createActivationCode,
  getCoursesForUser,
  getAllActivationCodes,
  markVideoWatched,
  getWatchedVideos,
  createCourse,
  register,
  Login,
} = require("./Auth.conntroller");
// __________________________________________________________________________
//  Register
//  http://localhost:3000/auth/register
AuthRouter.post("/register", isValid(registerData), register);
// __________________________________________________________________________
//  Login
// http://localhost:3000/auth/login
AuthRouter.post("/login", isValid(LoginValid), Login);
// __________________________________________________________________________
//  createActivationCode
// http://localhost:3000/auth/createActivationCode
AuthRouter.post(
  "/createActivationCode",
  isAuthentication,
  isAuthorized("admin"),
  isValid(createActivationCodeV),
  createActivationCode
);
// __________________________________________________________________________
//  getCoursesForUser
// http://localhost:3000/auth/getCoursesForUser
AuthRouter.get(
  "/getCoursesForUser",
  isAuthentication,
  isAuthorized("user"),
  getCoursesForUser
);
// __________________________________________________________________________
//  getAllActivationCodes
// http://localhost:3000/auth/getAllActivationCodes
AuthRouter.get(
  "/getAllActivationCodes",
  isAuthentication,
  isAuthorized("admin"),
  getAllActivationCodes
);
// __________________________________________________________________________
// createCourse
// http://localhost:3000/auth/createCourse
AuthRouter.post(
  "/createCourse",
  isAuthentication,
  isAuthorized("admin"),
  createCourse
);
// __________________________________________________________________________
AuthRouter.post(
  "/watchVideo",
  isAuthentication,
  isAuthorized("user"),
  markVideoWatched
);
// __________________________________________________________________________
AuthRouter.get(
  "/watchedVideos/:courseId",
  isAuthentication,
  isAuthorized("user"),
  getWatchedVideos
);
// __________________________________________________________________________
module.exports = AuthRouter;
