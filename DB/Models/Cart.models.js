const mongoose = require("mongoose");
const CartSchame = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [
      {
        _id: false,
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          unique: true,
        },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);
const Cart = mongoose.model("Cart", CartSchame);
module.exports = Cart;
