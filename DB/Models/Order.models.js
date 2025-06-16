const mongoose = require("mongoose");
const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        _id: false,
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          min: 1,
        },
        name: String,
        itemprice: Number,
        totalPrice: Number,
      },
    ],
    invoice: {
      id: { type: String },
      url: { type: String },
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    coupon: {
      id: { type: mongoose.Types.ObjectId, ref: "Coupon" },
      name: String,
      discount: { type: Number, min: 1, max: 100 },
    },
    status: {
      type: String,
      enum: [
        "placed",
        "refunded",
        "shipped",
        "delivered",
        "cancelled",
        "visa payed",
        "failed to pay",
      ],
      default: "placed",
    },
    autoDeleteAt: {
      type: Date,
      default: null,
    },
    payment: {
      type: String,
      enum: ["cash", "visa"],
      default: "cash",
    },
  },
  { timestamps: true }
);
// ✅ TTL Index — حذف تلقائي بعد autoDeleteAt
OrderSchema.index({ autoDeleteAt: 1 }, { expireAfterSeconds: 0 });
OrderSchema.virtual("finalPrice").get(function () {
  return this.coupon
    ? Number.parseFloat(
        this.price - (this.price * this.coupon.discount) / 100
      ).toFixed(2)
    : this.price;
});
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
