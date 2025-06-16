
const mongoose = require("mongoose");
const TokenModel = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    agent: {
      type: String,
    },
    expiredAt: { type: String },
  },
  { timestamps: true }
);
const Token = mongoose.models.Token || mongoose.model("Token", TokenModel);
module.exports = Token;
