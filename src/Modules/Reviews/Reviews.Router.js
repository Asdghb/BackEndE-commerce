const express = require("express");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const isAuthentication = require("../../Middleware/Authentication");
const { ValidDataAddReviews } = require("./Reviews.validation");
const { AddReviews } = require("./Reviews.conntroller");
const ReviewsRouter = express.Router();
// __________________________________________________________________________
// AddReviews
// http://localhost:3000/Reviews//AddReview
ReviewsRouter.post(
  "/AddReview",
  isAuthentication,
  isValid(ValidDataAddReviews),
  AddReviews
);
// __________________________________________________________________________
module.exports = ReviewsRouter;
