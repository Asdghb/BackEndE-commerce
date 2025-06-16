const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 3,
      max: 20,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    phone: {
      type: String,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isCofirmed: {
      type: Boolean,
      default: false,
    },
    forgetCode: String,
    activationCode: String,
    profileImage: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dxldeqxgq/image/upload/v1745592581/bcrgbuc83gxvsxesjyvc.jpg",
      },
      id: {
        type: String,
        default: "bcrgbuc83gxvsxesjyvc",
      },
    },
    coverImages: [
      {
        url: { type: String, required: true },
        id: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
module.exports = User;
