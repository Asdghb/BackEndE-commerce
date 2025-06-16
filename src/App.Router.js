const AuthRouter = require("./Modules/Auth/Auth.router");
const BrandRouter = require("./Modules/Brand/Brand.Router");
const CartRouter = require("./Modules/Cart/Cart.Router");
const CategoryRouter = require("./Modules/Category/Category.Router");
const CouponRouter = require("./Modules/Coupon/Coupon.Router");
const OrderRouter = require("./Modules/Order/Order.Router");
const ProductRouter = require("./Modules/Product/Product.Router");
const SubCategoryRouter = require("./Modules/SubCategory/SubCategory.Router");
const ReviewsRouter = require("./Modules/Reviews/Reviews.Router");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv").config();

const AppRouter = (app, express) => {
  app.use(
    cors({
      origin: "http://localhost:3001",
      credentials: true,
    })
  );
  // ________________________________
  app.use((req, res, next) => {
    if (req.originalUrl === "/Order/webhook") {
      return next();
    }
    express.json()(req, res, next);
  });
  // ________________________________
  app.use("/Order/webhook", express.raw({ type: "application/json" }));
  // ________________________________
  app.use(express.json());
  // ________________________________
  if (process.env.NODE_ENV == "development") {
    app.use(morgan("dev"));
  }
  // ________________________________
  // Routes
  app.use("/auth", AuthRouter);
  app.use("/category", CategoryRouter);
  app.use("/subcategory", SubCategoryRouter);
  app.use("/Brand", BrandRouter);
  app.use("/Product", ProductRouter);
  app.use("/Coupon", CouponRouter);
  app.use("/Cart", CartRouter);
  app.use("/Order", OrderRouter);
  app.use("/Reviews", ReviewsRouter);
  // ________________________________
  // 404 handler
  app.all("*", (req, res, next) => {
    return next(new Error("Page Not Found!", { cause: 404 }));
  });
  // ________________________________
  // Global Error Handler
  app.use((error, req, res, next) => {
    return res.status(error.cause || 500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  });
};

module.exports = AppRouter;
