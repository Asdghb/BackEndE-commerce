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

  try {
    await fs.access(pdfpath);
  } catch (err) {
    console.error("❌ لم يتم إنشاء ملف الفاتورة:", err);
    return next(new Error("Invoice PDF not generated"));
  }

  const pdfBuffer = await fs.readFile(pdfpath);

  const { secure_url, public_id } = await cloudinary.uploader.upload(pdfpath, {
    folder: `${process.env.FOLDER_CLOUD_NAME}/order/invoice/${user._id}`,
  });
  order.invoice = { id: public_id, url: secure_url };
  await order.save();
  console.log("userEmail :", user.email);

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

  try {
    await fs.unlink(pdfpath);
  } catch (err) {
    console.error("Failed to delete PDF after upload:", err);
  }

  if (payment === "visa") {
    const stripe = new Stripe(process.env.STRIPE_Secret_key);
    let existcoupon;
    if (order.coupon && order.coupon.name) {
      existcoupon = await stripe.coupons.create({
        percent_off: order.coupon.discount,
        duration: "once",
      });
    }
    const line_items = [];
    for (let product of order.products) {
      const productDoc = await Product.findById(product.productId);
      const imageUrl = productDoc?.defaultImage?.url;
      const item = {
        price_data: {
          currency: "egp",
          product_data: {
            name: product.name,
            ...(imageUrl && { images: [imageUrl] }),
          },
          unit_amount: product.itemprice * 100,
        },
        quantity: product.quantity,
      };

      line_items.push(item);
    }

    const session = await stripe.checkout.sessions.create({
      metadata: { order_id: order._id.toString() },
      payment_method_types: ["card"],
      mode: "payment",
      success_url: process.env.success_url,
      cancel_url: process.env.cancel_url,
      line_items,
      discounts: existcoupon ? [{ coupon: existcoupon.id }] : [],
    });

    return res.json({ success: true, results: session.url });
  }

  return res.json({
    success: true,
    message: "Order placed successfully! Please check your email.",
  });
});
// _________________________________________________________________________
// const CreateOrder = asyncHandler(async (req, res, next) => {
//   const user = req.user;
//   const { payment, address, phone, coupon } = req.body;

//   // تحقق من طريقة الدفع صالحة
//   if (!["cash", "visa"].includes(payment)) {
//     return next(new Error("Invalid payment method"));
//   }

//   // تحقق من الكوبون
//   let checkcoupon;
//   if (coupon) {
//     checkcoupon = await Coupon.findOne({
//       name: coupon,
//       expiredAt: { $gt: new Date() },
//     });
//     if (!checkcoupon) return next(new Error("Invalid coupon!"));
//   }

//   // جلب السلة
//   const cart = await Cart.findOne({ user: user._id });
//   if (!cart || cart.products.length < 1)
//     return next(new Error("Invalid cart or empty!"));

//   // تجهيز المنتجات
//   const orderproducts = [];
//   let orderprice = 0;

//   for (let item of cart.products) {
//     const product = await Product.findById(item.productId);
//     if (!product)
//       return next(new Error(`Product ${item.productId} not found!`));
//     if (!product.inStock(item.quantity)) {
//       return next(
//         new Error(
//           `${product.name} out of stock! Only ${product.availableItems} left.`
//         )
//       );
//     }

//     orderproducts.push({
//       productId: product._id,
//       quantity: item.quantity,
//       name: product.name,
//       itemprice: product.finalPrice,
//       totalPrice: item.quantity * product.finalPrice,
//       image: product.defaultImage?.url || "",
//     });

//     orderprice += item.quantity * product.finalPrice;
//   }

//   // حساب السعر النهائي مع الخصم
//   let finalPrice = orderprice;
//   if (checkcoupon) {
//     finalPrice -= (orderprice * checkcoupon.discount) / 100;
//   }

//   // الدفع Visa: فقط انشئ جلسة Stripe ولا تنشئ الطلب بعد
//   if (payment === "visa") {
//     const stripe = new Stripe(process.env.STRIPE_Secret_key);

//     // إنشاء كوبون Stripe إذا وجد
//     let existcoupon;
//     if (checkcoupon) {
//       existcoupon = await stripe.coupons.create({
//         percent_off: checkcoupon.discount,
//         duration: "once",
//       });
//     }

//     // تجهيز line_items
//     const line_items = orderproducts.map((product) => ({
//       price_data: {
//         currency: "egp",
//         product_data: {
//           name: product.name,
//           ...(product.image ? { images: [product.image] } : {}),
//         },
//         unit_amount: product.itemprice * 100,
//       },
//       quantity: product.quantity,
//     }));

//     // إنشاء جلسة Checkout
//     const session = await stripe.checkout.sessions.create({
//       metadata: {
//         user_id: user._id.toString(),
//         address,
//         phone,
//         coupon: checkcoupon ? checkcoupon.name : "",
//         payment_method: payment,
//       },
//       payment_method_types: ["card"],
//       mode: "payment",
//       success_url: process.env.success_url,
//       cancel_url: process.env.cancel_url,
//       line_items,
//       discounts: existcoupon ? [{ coupon: existcoupon.id }] : [],
//     });

//     return res.json({ success: true, url: session.url });
//   }

//   // الدفع نقداً: إنشاء الطلب والفاتورة مباشرة
//   const order = await Order.create({
//     user: user._id,
//     products: orderproducts,
//     address,
//     phone,
//     price: finalPrice,
//     payment,
//     coupon: checkcoupon
//       ? {
//           id: checkcoupon._id,
//           name: checkcoupon.name,
//           discount: checkcoupon.discount,
//         }
//       : undefined,
//   });

//   // إنشاء الفاتورة PDF
//   const invoice = {
//     shipping: {
//       name: user.username,
//       address: order.address,
//       country: "Egypt",
//     },
//     items: order.products,
//     subtotal: order.price,
//     paid: finalPrice,
//     invoice_nr: order._id,
//   };

//   const invoiceDir = path.join(__dirname, "invoiceTemp");
//   await fs.mkdir(invoiceDir, { recursive: true });
//   const pdfpath = path.join(invoiceDir, `${order._id}.pdf`);
//   await createInvoice(invoice, pdfpath);

//   try {
//     await fs.access(pdfpath);
//   } catch (err) {
//     return next(new Error("Invoice PDF not generated"));
//   }

//   const pdfBuffer = await fs.readFile(pdfpath);

//   // رفع الفاتورة إلى Cloudinary
//   const { secure_url, public_id } = await cloudinary.uploader.upload(pdfpath, {
//     folder: `${process.env.FOLDER_CLOUD_NAME}/order/invoice/${user._id}`,
//   });

//   order.invoice = { id: public_id, url: secure_url };
//   await order.save();

//   // إرسال الفاتورة إلى البريد
//   const isSend = await sendEmail({
//     to: user.email,
//     subject: "Order Invoice",
//     attachments: [
//       {
//         filename: `invoice-${order._id}.pdf`,
//         content: pdfBuffer,
//         contentType: "application/pdf",
//         encoding: "base64",
//       },
//     ],
//   });

//   if (isSend) {
//     await UpdateStockProduct(order.products, true);
//     await clearCart(user._id);
//   }

//   try {
//     await fs.unlink(pdfpath);
//   } catch (err) {
//     console.error("Failed to delete PDF after upload:", err);
//   }

//   return res.json({
//     success: true,
//     message: "Order placed successfully! Please check your email.",
//   });
// });
// _________________________________________________________________________

// دى بالنسبة ل Render
// const CreateOrder = asyncHandler(async (req, res, next) => {
//   console.log("🟢 Received Order Body:", req.body);
//   const user = req.user;
//   const { payment, address, phone, coupon } = req.body;

//   // ✅ التحقق من الكوبون
//   let checkcoupon;
//   if (coupon) {
//     checkcoupon = await Coupon.findOne({
//       name: coupon,
//       expiredAt: { $gt: new Date() },
//     });
//     if (!checkcoupon) return next(new Error("Invalid coupon!"));
//   }

//   // ✅ التحقق من العربة
//   const cart = await Cart.findOne({ user: user._id });
//   if (!cart || cart.products.length < 1)
//     return next(new Error("Invalid cart or empty!"));

//   const products = cart.products;
//   let orderproducts = [];
//   let orderprice = 0;

//   // ✅ التحقق من المنتجات والمخزون
//   for (let item of products) {
//     const product = await Product.findById(item.productId);
//     if (!product)
//       return next(new Error(`Product ${item.productId} not found!`));

//     if (!product.inStock(item.quantity)) {
//       return next(
//         new Error(
//           `${product.name} out of stock! Only ${product.availableItems} left.`
//         )
//       );
//     }

//     orderproducts.push({
//       productId: product._id,
//       quantity: item.quantity,
//       name: product.name,
//       itemprice: product.finalPrice,
//       totalPrice: item.quantity * product.finalPrice,
//     });

//     orderprice += item.quantity * product.finalPrice;
//   }

//   // ✅ حساب السعر النهائي بعد الخصم
//   let finalPrice = orderprice;
//   if (checkcoupon) {
//     finalPrice -= (orderprice * checkcoupon.discount) / 100;
//   }

//   // ✅ إنشاء الطلب
//   const order = await Order.create({
//     user: user._id,
//     products: orderproducts,
//     address,
//     phone,
//     price: finalPrice,
//     payment,
//     coupon: checkcoupon
//       ? {
//           id: checkcoupon._id,
//           name: checkcoupon.name,
//           discount: checkcoupon.discount,
//         }
//       : undefined,
//   });

//   // ✅ إعداد بيانات الفاتورة
//   const invoice = {
//     shipping: {
//       name: user.username,
//       address: order.address,
//       country: "Egypt",
//     },
//     items: order.products,
//     subtotal: order.price,
//     paid: finalPrice,
//     invoice_nr: order._id,
//   };

//   // ✅ إنشاء ملف الفاتورة في /tmp
//   const pdfpath = path.join("/tmp", `${order._id}.pdf`);
//   await createInvoice(invoice, pdfpath);

//   // ✅ التأكد من وجود الملف
//   try {
//     await fs.access(pdfpath);
//   } catch (err) {
//     console.error("❌ لم يتم إنشاء ملف الفاتورة:", err);
//     return next(new Error("Invoice PDF not generated"));
//   }

//   // ✅ قراءة الملف كـ buffer
//   const pdfBuffer = await fs.readFile(pdfpath);

//   // ✅ رفع الفاتورة إلى Cloudinary
//   const { secure_url, public_id } = await cloudinary.uploader.upload(pdfpath, {
//     folder: `${process.env.FOLDER_CLOUD_NAME}/order/invoice/${user._id}`,
//   });

//   // ✅ ربط الفاتورة بالطلب
//   order.invoice = { id: public_id, url: secure_url };
//   await order.save();

//   // ✅ إرسال الفاتورة بالبريد
//   const isSend = await sendEmail({
//     to: user.email,
//     subject: "Order Invoice",
//     attachments: [
//       {
//         filename: `invoice-${order._id}.pdf`,
//         content: pdfBuffer,
//         contentType: "application/pdf",
//         encoding: "base64",
//       },
//     ],
//   });

//   // ✅ تحديث المخزون وتفريغ العربة
//   if (isSend) {
//     await UpdateStockProduct(order.products, true);
//     await clearCart(user._id);
//   }

//   // ✅ حذف ملف الفاتورة المؤقت
//   try {
//     await fs.unlink(pdfpath);
//   } catch (err) {
//     console.error("Failed to delete PDF after upload:", err);
//   }

//   // ✅ في حالة الدفع بالفيزا (Stripe)
//   // if (payment === "visa") {
//   //   const stripe = new Stripe(process.env.STRIPE_Secret_key);

//   //   let existcoupon;
//   //   if (order.coupon && order.coupon.name) {
//   //     existcoupon = await stripe.coupons.create({
//   //       percent_off: order.coupon.discount,
//   //       duration: "once",
//   //     });
//   //   }

//   //   const session = await stripe.checkout.sessions.create({
//   //     metadata: { order_id: order._id.toString() },
//   //     payment_method_types: ["card"],
//   //     mode: "payment",
//   //     success_url: process.env.success_url,
//   //     cancel_url: process.env.cancel_url,
//   //     line_items: order.products.map((product) => ({
//   //       price_data: {
//   //         currency: "egp",
//   //         product_data: {
//   //           name: product.name,
//   //           images: [product.productId.defaultImage?.url || ""],
//   //         },
//   //         unit_amount: product.itemprice * 100,
//   //       },
//   //       quantity: product.quantity,
//   //     })),
//   //     discounts: existcoupon ? [{ coupon: existcoupon.id }] : [],
//   //   });

//   //   return res.json({ success: true, results: session.url });
//   // }

//   if (payment === "visa") {
//     const stripe = new Stripe(process.env.STRIPE_Secret_key);

//     let existcoupon;
//     if (order.coupon && order.coupon.name) {
//       existcoupon = await stripe.coupons.create({
//         percent_off: order.coupon.discount,
//         duration: "once",
//       });
//     }

//     // ✅ تجهيز المنتجات بدون إرسال صورة فارغة
//     const line_items = [];

//     for (let product of order.products) {
//       const productDoc = await Product.findById(product.productId);
//       const imageUrl = productDoc?.defaultImage?.url;

//       const item = {
//         price_data: {
//           currency: "egp",
//           product_data: {
//             name: product.name,
//             ...(imageUrl && { images: [imageUrl] }), // ✅ إرسال الصورة فقط إن وجدت
//           },
//           unit_amount: product.itemprice * 100,
//         },
//         quantity: product.quantity,
//       };

//       line_items.push(item);
//     }

//     const session = await stripe.checkout.sessions.create({
//       metadata: { order_id: order._id.toString() },
//       payment_method_types: ["card"],
//       mode: "payment",
//       success_url: process.env.success_url,
//       cancel_url: process.env.cancel_url,
//       line_items,
//       discounts: existcoupon ? [{ coupon: existcoupon.id }] : [],
//     });

//     return res.json({ success: true, results: session.url });
//   }

//   // ✅ الرد في حالة الدفع كاش
//   return res.json({
//     success: true,
//     message: "Order placed successfully! Please check your email.",
//   });
// });
// __________________________________________________________________________
// CancelOrder
// const CancelOrder = asyncHandler(async (req, res, next) => {
//   const order = await Order.findById(req.params.orderId);
//   if (!order) {
//     return next(new Error("Order not found!"));
//   }
//   if (order.status === "shipped" || order.status === "delivered") {
//     return next(new Error("Cannot cancel shipped or delivered orders!"));
//   }
//   // 1. استرجاع المخزون
//   await UpdateStockProduct(order.products, false);
//   // 2. حذف الفاتورة من Cloudinary
//   if (order.invoice && order.invoice.public_id) {
//     const cloudinary = require("cloudinary").v2;
//     await cloudinary.uploader.destroy(order.invoice.public_id, {
//       resource_type: "raw", // لأن الفاتورة PDF وليس صورة
//     });
//   }
//   // 3. حذف الطلب من قاعدة البيانات
//   await Order.findByIdAndDelete(order._id);
//   res.json({
//     success: true,
//     message: "Order and invoice deleted successfully.",
//   });
// });
const CancelOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    return next(new Error("Order not found!"));
  }
  // لا يمكن إلغاء الطلبات المشحونة أو المسلمة
  if (order.status === "shipped" || order.status === "delivered") {
    return next(new Error("Cannot cancel shipped or delivered orders!"));
  }
  // ✅ 1. استرجاع المخزون فقط إذا لم يكن مدفوعًا
  const skipStockRestore =
    order.status === "paid" || order.status === "visa payed";
  if (!skipStockRestore) {
    await UpdateStockProduct(order.products, false);
  }
  // ✅ 2. حذف الفاتورة من Cloudinary إن وجدت
  if (order.invoice && order.invoice.public_id) {
    const cloudinary = require("cloudinary").v2;
    await cloudinary.uploader.destroy(order.invoice.public_id, {
      resource_type: "raw", // لأن الفاتورة PDF
    });
  }
  // ✅ 3. حذف الطلب
  await Order.findByIdAndDelete(order._id);
  res.json({
    success: true,
    message: "Order and invoice deleted successfully.",
  });
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
// const webhooks = asyncHandler(async (req, res) => {
//   const sig = req.headers["stripe-signature"];
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.error("❌ Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   try {
//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object;
//       const metadata = session.metadata;

//       // تحقق من وجود بيانات أساسية في الميتاداتا
//       if (!metadata.user_id) {
//         throw new Error("Missing user_id in metadata");
//       }

//       // جلب بيانات المستخدم
//       const user = await User.findById(metadata.user_id);
//       if (!user) throw new Error("User not found");

//       // جلب سلة المستخدم (من المفترض أنها موجودة)
//       const cart = await Cart.findOne({ user: user._id });
//       if (!cart || cart.products.length < 1) {
//         throw new Error("Cart empty or not found");
//       }

//       // التحقق من الكوبون (إن وُجد)
//       let checkcoupon;
//       if (metadata.coupon) {
//         checkcoupon = await Coupon.findOne({
//           name: metadata.coupon,
//           expiredAt: { $gt: new Date() },
//         });
//       }

//       // تحضير المنتجات، الأسعار كما في الـ CreateOrder
//       const orderproducts = [];
//       let orderprice = 0;
//       for (let item of cart.products) {
//         const product = await Product.findById(item.productId);
//         if (!product) throw new Error(`Product ${item.productId} not found`);
//         if (!product.inStock(item.quantity)) {
//           throw new Error(
//             `${product.name} out of stock! Only ${product.availableItems} left.`
//           );
//         }

//         orderproducts.push({
//           productId: product._id,
//           quantity: item.quantity,
//           name: product.name,
//           itemprice: product.finalPrice,
//           totalPrice: item.quantity * product.finalPrice,
//           image: product.defaultImage?.url || "",
//         });

//         orderprice += item.quantity * product.finalPrice;
//       }

//       // حساب السعر النهائي مع الخصم
//       let finalPrice = orderprice;
//       if (checkcoupon) {
//         finalPrice -= (orderprice * checkcoupon.discount) / 100;
//       }

//       // إنشاء الطلب
//       const order = await Order.create({
//         user: user._id,
//         products: orderproducts,
//         address: metadata.address || "", // يمكن تخزين العنوان في metadata
//         phone: metadata.phone || "",
//         price: finalPrice,
//         payment: "visa",
//         status: "paid",
//         coupon: checkcoupon
//           ? {
//               id: checkcoupon._id,
//               name: checkcoupon.name,
//               discount: checkcoupon.discount,
//             }
//           : undefined,
//         stripeSessionId: session.id,
//       });

//       // إنشاء الفاتورة PDF
//       const invoice = {
//         shipping: {
//           name: user.username,
//           address: order.address,
//           country: "Egypt",
//         },
//         items: order.products,
//         subtotal: order.price,
//         paid: finalPrice,
//         invoice_nr: order._id,
//       };

//       const invoiceDir = path.join(__dirname, "invoiceTemp");
//       await fs.mkdir(invoiceDir, { recursive: true });
//       const pdfpath = path.join(invoiceDir, `${order._id}.pdf`);
//       await createInvoice(invoice, pdfpath);

//       const pdfBuffer = await fs.readFile(pdfpath);

//       // رفع الفاتورة إلى Cloudinary
//       const { secure_url, public_id } = await cloudinary.uploader.upload(
//         pdfpath,
//         {
//           folder: `${process.env.FOLDER_CLOUD_NAME}/order/invoice/${user._id}`,
//         }
//       );

//       order.invoice = { id: public_id, url: secure_url };
//       await order.save();

//       // إرسال الفاتورة إلى البريد
//       await sendEmail({
//         to: user.email,
//         subject: "Order Invoice",
//         attachments: [
//           {
//             filename: `invoice-${order._id}.pdf`,
//             content: pdfBuffer,
//             contentType: "application/pdf",
//             encoding: "base64",
//           },
//         ],
//       });

//       // تحديث المخزون ومسح السلة
//       await UpdateStockProduct(order.products, true);
//       await clearCart(user._id);

//       // حذف ملف الفاتورة من السيرفر
//       try {
//         await fs.unlink(pdfpath);
//       } catch (err) {
//         console.error("Failed to delete PDF after upload:", err);
//       }

//       console.log("✅ Order created and payment confirmed:", order._id);
//     } else if (event.type === "payment_intent.payment_failed") {
//       const session = event.data.object;
//       const metadata = session.metadata;

//       if (metadata && metadata.order_id) {
//         await Order.findByIdAndUpdate(metadata.order_id, {
//           status: "failed to pay",
//         });
//         console.log("❌ Payment failed for order:", metadata.order_id);
//       }
//     } else {
//       console.log("📦 Unhandled event type:", event.type);
//     }

//     res.status(200).json({ received: true });
//   } catch (err) {
//     console.error("❌ Error processing webhook:", err.message);
//     res.status(500).send("Internal server error");
//   }
// });
// __________________________________________________________________________
// GetAllOrder
const GetAllOrder = asyncHandler(async (req, res, next) => {
  const orders = await Order.find().populate(
    "user",
    "-password -__v -role -createdAt -updatedAt"
  );
  if (!orders || orders.length === 0) {
    return next(new Error("لم يتم العثور على طلبات"));
  }
  res.json({ success: true, AllOrder: orders });
});
// __________________________________________________________________________
// GetAllOrderUser
const GetAllOrderUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log(userId);
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
    "failed to pay",
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
  UpdateSingleOrder,
};
