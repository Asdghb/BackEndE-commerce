const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const colors = require('colors');
const connect_DB = async () => {
  try {
    await mongoose.connect(process.env.DB_DATE_CONNECT);
    console.log('✅ Successfully connected to the database.'.bgGreen.bold);
  } catch (error) {
    console.error(`❌ Failed to connect to the database: ${error.message}`.bgRed);
    process.exit(1);
  }
};

module.exports = connect_DB;

