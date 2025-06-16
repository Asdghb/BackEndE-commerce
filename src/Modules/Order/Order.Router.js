const express = require("express");
const isAuthentication = require("../../Middleware/Authentication");
const isAuthorized = require("../../Middleware/Authorization");
const { isValid } = require("../../Middleware/Validtion.Middieware");
const {
  CreateOrder,
  CancelOrder,
  webhooks,
  GetAllOrder,
  GetAllOrderUser,
  UpdateSingleOrder,
} = require("./Order.conntroller");
const {
  CreateOrdervalid,
  CancelOrdervalid,
  UpdateSingleOrderValid,
} = require("./Order.validation");
// __________________________________________________________________________
const OrderRouter = express.Router();

// create Order
// http://localhost:3000/Order
OrderRouter.post("/", isAuthentication, isValid(CreateOrdervalid), CreateOrder);
// __________________________________________________________________________
// GetAllOrder
// http://localhost:3000/Order/GetAllOrder
OrderRouter.get(
  "/GetAllOrder",
  isAuthentication,
  isAuthorized("admin"),
  GetAllOrder
);
// __________________________________________________________________________
// GetAllOrderUser
// http://localhost:3000/Order/GetAllOrderUser
OrderRouter.get("/GetAllOrderUser", isAuthentication, GetAllOrderUser);
// __________________________________________________________________________
// UpdateSingleOrder
// http://localhost:3000/Order/UpdateSingleOrder/:orderId
OrderRouter.put(
  "/UpdateSingleOrder/:orderId",
  isAuthentication,
  isAuthorized("admin"),
  isValid(UpdateSingleOrderValid),
  UpdateSingleOrder
);
// __________________________________________________________________________
// cancel order
// http://localhost:3000/Order/:orderId
OrderRouter.patch(
  "/:orderId",
  isAuthentication,
  isValid(CancelOrdervalid),
  CancelOrder
);
// __________________________________________________________________________
// لازم تستخدم raw body
OrderRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhooks
);
// __________________________________________________________________________
module.exports = OrderRouter;
