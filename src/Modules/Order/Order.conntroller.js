const { asyncHandler } = require("../../Utils/asyncHandler");
const Coupon = require("../../../DB/Models/Coupon.models");
const Cart = require("../../../DB/Models/Cart.models");
const Product = require("../../../DB/Models/Product.models");
const Order = require("../../../DB/Models/Order.models");
const { createInvoice } = require("../../Utils/CreateInvoice");
const sendEmail = require("../../Utils/SendEmail");
const { clearCart, UpdateStockProduct } = require("./Order.service");
const cloudinary = require("../../Utils/cloudinary");
const fs = require("fs/promises");
const path = require("path");
const { default: Stripe } = require("stripe");
const stripe = Stripe(process.env.STRIPE_Secret_key);
// __________________________________________________________________________
// create Order
const CreateOrder = asyncHandler(async (req, res, next) => {
  console.log("🟢 Received Order Body:", req.body);
  const user = req.user;
  const { payment, address, phone, coupon } = req.body;
  let checkcoupon;
  if (coupon) {
    checkcoupon = await Coupon.findOne({
      name: coupon,
      expiredAt: { $gt: new Date() },
    });
    if (!checkcoupon) return next(new Error("Invalid coupon!"));
  }
  const cart = await Cart.findOne({ user: user._id });
  if (!cart || cart.products.length < 1)
    return next(new Error("Invalid cart or empty!"));
  const products = cart.products;
  let orderproducts = [];
  let orderprice = 0;
  for (let item of products) {
    const product = await Product.findById(item.productId);
    if (!product)
      return next(new Error(`Product ${item.productId} not found!`));
    if (!product.inStock(item.quantity)) {
      return next(
        new Error(
          `${product.name} out of stock! Only ${product.availableItems} left.`
        )
      );
    }
    orderproducts.push({
      productId: product._id,
      quantity: item.quantity,
      name: product.name,
      itemprice: product.finalPrice,
      totalPrice: item.quantity * product.finalPrice,
    });
    orderprice += item.quantity * product.finalPrice;
  }
  let finalPrice = orderprice;
  if (checkcoupon) {
    finalPrice -= (orderprice * checkcoupon.discount) / 100;
  }
  const order = await Order.create({
    user: user._id,
    products: orderproducts,
    address,
    phone,
    price: finalPrice,
    payment,
    coupon: checkcoupon
      ? {
          id: checkcoupon._id,
          name: checkcoupon.name,
          discount: checkcoupon.discount,
        }
      : undefined,
  });
  const invoice = {
    shipping: {
      name: user.username,
      address: order.address,
      country: "Egypt",
    },
    items: order.products,
    subtotal: order.price,
    paid: finalPrice,
    invoice_nr: order._id,
  };
  const pdfpath = path.join(__dirname, "invoiceTemp", `${order._id}.pdf`);
  await createInvoice(invoice, pdfpath);
  // تحقق من وجود الملف بعد الإنشاء
  try {
    await fs.access(pdfpath);
    // console.log("✅ ملف الفاتورة تم إنشاؤه بنجاح:", pdfpath);
  } catch (err) {
    console.error("❌ لم يتم إنشاء ملف الفاتورة:", err);
    return next(new Error("Invoice PDF not generated"));
  }
  // ✅ اقرأ الملف كـ buffer قبل الرفع
  const pdfBuffer = await fs.readFile(pdfpath);
  // ✅ ارفع الملف إلى Cloudinary
  const { secure_url, public_id } = await cloudinary.uploader.upload(pdfpath, {
    folder: `${process.env.FOLDER_CLOUD_NAME}/order/invoice/${user._id}`,
  });
  order.invoice = { id: public_id, url: secure_url };
  await order.save();
  console.log("userEmail :", user.email);
  // ✅ أرسل الفاتورة من buffer
  const isSend = await sendEmail({
    to: user.email,
    subject: "Order Invoice",
    attachments: [
      {
        filename: `invoice-${order._id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
        encoding: "base64",
      },
    ],
  });
  if (isSend) {
    await UpdateStockProduct(order.products, true);
    await clearCart(user._id);
  }
  // ✅ احذف الملف من السيرفر
  try {
    await fs.unlink(pdfpath);
  } catch (err) {
    console.error("Failed to delete PDF after upload:", err);
  }
  // stripe
  if (payment == "visa") {
    const stripe = new Stripe(process.env.STRIPE_Secret_key);
    // جذا الكبون
    let existcoupon;
    if (order.coupon.name !== undefined) {
      existcoupon = await stripe.coupons.create({
        percent_off: order.coupon.discount,
        duration: "once",
      });
    }
    const session = await stripe.checkout.sessions.create({
      metadata: { order_id: order._id.toString() },
      // الدفع عن طريق card
      payment_method_types: ["card"],
      // اشتراك ولا دفع عادى ؟
      mode: "payment",
      // صفحة التوجه اليها بعد الدفع بنجاح
      success_url: process.env.success_url,
      // صفحة التوجة اليها لو ما اريد ادفع
      cancel_url: process.env.cancel_url,
      // لوب على منتجات الاوردر
      line_items: order.products.map((product) => {
        return {
          price_data: {
            currency: "egp",
            product_data: {
              name: product.name,
              images: [product.productId.defaultImage?.url],
            },
            unit_amount: product.itemprice * 100,
          },
          quantity: product.quantity,
        };
      }),
      // الكبون
      discounts: existcoupon ? [{ coupon: existcoupon.id }] : [],
    });
    return res.json({ success: true, results: session.url });
  }
  return res.json({
    success: true,
    message: "Order placed successfully! Please check your email.",
  });
});
// __________________________________________________________________________
// CancelOrder
const CancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return next(new Error("Order not found!"));
  }
  if (order.status === "shipped" || order.status === "delivered") {
    return next(new Error("Cannot cancel shipped or delivered orders!"));
  }
  // 1. استرجاع المخزون
  await UpdateStockProduct(order.products, false);
  // 2. حذف الفاتورة من Cloudinary
  if (order.invoice && order.invoice.public_id) {
    const cloudinary = require("cloudinary").v2;
    await cloudinary.uploader.destroy(order.invoice.public_id, {
      resource_type: "raw", // لأن الفاتورة PDF وليس صورة
    });
  }
  // 3. حذف الطلب من قاعدة البيانات
  await Order.findByIdAndDelete(order._id);
  res.json({ success: true, message: "Order and invoice deleted successfully." });
});
// __________________________________________________________________________
// Webhook
const webhooks = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  const metadata = event.data.object.metadata;
  const orderId = metadata?.order_id;
  try {
    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ Payment success for order:", orderId);
        await Order.findByIdAndUpdate(orderId, { status: "visa payed" });
        break;
      case "payment_intent.payment_failed":
        console.log("❌ Payment failed for order:", orderId);
        await Order.findByIdAndUpdate(orderId, { status: "failed to pay" });
        break;
      default:
        console.log("📦 حدث غير متوقع:", event.type);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Error in processing webhook:", err.message);
    res.status(500).send("Internal server error");
  }
});
// __________________________________________________________________________
// GetAllOrder
const GetAllOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.find();
  if (!order) {
    return next(new Error("Order Not Found!"));
  }
  res.json({ success: true, AllOrder: order });
});
// __________________________________________________________________________
// GetAllOrderUser
const GetAllOrderUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log(userId)
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});
// __________________________________________________________________________
// UpdateSingleOrder
const UpdateSingleOrder = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return next(new Error("Order not found!"));
  }
  order.status = status;
  const deleteStatuses = [
    "refunded",
    "shipped",
    "delivered",
    "visa payed",
    "failed to pay"
  ];
  if (deleteStatuses.includes(status)) {
    // ⏳ حذف تلقائي بعد 7 أيام
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    order.autoDeleteAt = sevenDaysLater;
  } else {
    // في باقي الحالات، لا نحذف
    order.autoDeleteAt = null;
  }
  await order.save();
  return res.json({ success: true, message: "Order status updated." });
});
// __________________________________________________________________________
module.exports = {
  CreateOrder,
  CancelOrder,
  webhooks,
  GetAllOrder,
  GetAllOrderUser,
  UpdateSingleOrder
};
