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
<<<<<<< HEAD
          // unique: true,
=======
          //unique: true,
>>>>>>> feb1c3b23cc521bfa3f0de3babf0356646f8a9a9
        },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);
const Cart = mongoose.model("Cart", CartSchame);
module.exports = Cart;
