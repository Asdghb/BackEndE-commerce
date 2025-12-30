const AuthRouter = require("./Modules/Auth/Auth.router");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
// _______________________________________________
const AppRouter = (app, express) => {
  // ✅ CORS إعداد
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3001",
      credentials: true,
    })
  );

  // ✅ Ping Route سريع وبسيط بدون JSON Parsing
  app.get("/ping", (req, res) => {
    res.send("pong");
  });

  // ✅ Webhook خاص بـ Stripe (قبل json middleware)
  app.use("/Order/webhook", express.raw({ type: "application/json" }));

  // ✅ JSON Middleware (بعد استثناء /Order/webhook)
  app.use((req, res, next) => {
    if (req.originalUrl === "/Order/webhook") return next();
    express.json()(req, res, next);
  });

  // ✅ Logger
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // ✅ Routes
  app.use("/auth", AuthRouter);



  // ✅ 404 Handler
  app.all("*", (req, res, next) => {
    next(new Error("Page Not Found!", { cause: 404 }));
  });

  // ✅ Global Error Handler
  app.use((error, req, res, next) => {
    res.status(error.cause || 500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  });
};
// ________________________________________________
module.exports = AppRouter;
