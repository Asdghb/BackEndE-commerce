const express = require("express");
const CartRouter = express.Router();
const isAuthentication = require("../../Middleware/Authentication");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const {
  ValidAddToCart,
  ValidUpdateCart,
  ValidRemoveCart,
} = require("./Cart.validation");
const {
  AddToCart,
  UserCart,
  UpdateCart,
  RemoveProductCart,
  ClearToCart,
} = require("./Cart.conntroller");
// __________________________________________________________________________
// add product to cart
// http://localhost:3000/Cart/
CartRouter.post("/", isAuthentication, isValid(ValidAddToCart), AddToCart);
// __________________________________________________________________________
// user cart
// http://localhost:3000/Cart/
CartRouter.get("/", isAuthentication, UserCart);
// __________________________________________________________________________
// Update cart
// http://localhost:3000/Cart/
CartRouter.patch("", isAuthentication, isValid(ValidUpdateCart), UpdateCart);
// __________________________________________________________________________
// Clear To Cart
// http://localhost:3000/Cart/clear
CartRouter.patch("/clear", isAuthentication, ClearToCart);
// __________________________________________________________________________
// Remove product from cart
// http://localhost:3000/Cart/:productId
CartRouter.patch(
  "/:productId",
  isAuthentication,
  isValid(ValidRemoveCart),
  RemoveProductCart
);
// __________________________________________________________________________
module.exports = CartRouter;
