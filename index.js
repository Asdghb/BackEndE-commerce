// E-commerce App;
const express = require("express");
const colors = require("colors");
const dotenv = require("dotenv").config();
const app = express();
const port = 3000;
// __________________________________________________
const connect_DB = require("./DB/ConnetionDB/Connetion");
const AppRouter = require("./src/App.Router");
// data DB conect
connect_DB();
// Routing
AppRouter(app, express);
app.listen(process.env.PORT || port, () => {
  console.log(`server connect port ${process.env.PORT} `.bgMagenta);
});
