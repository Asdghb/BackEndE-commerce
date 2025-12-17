const Brand = require("../../../DB/Models/Brand.models");
const { asyncHandler } = require("../../Utils/asyncHandler");
const slugify = require("slugify");
const cloudinary = require("../../Utils/cloudinary");
const fs = require("fs");
const uploadToCloudinary = require("../../Utils/uploadToCloudinary");
// __________________________________________________________________________
// create Brand
const CreateBrand = asyncHandler(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new Error("Brand name is required", { cause: 400 }));
  }

  if (!req.file) {
    return next(new Error("Brand image is required", { cause: 400 }));
  }

  const createdBy = req.user._id;

  // ⬅️ رفع مباشر من الـ buffer
  const result = await uploadToCloudinary(
    req.file.buffer,
    `${process.env.FOLDER_CLOUD_NAME}/Brand`
  );

  const brand = await Brand.create({
    name,
    createdBy,
    slug: slugify(name),
    image: {
      id: result.public_id,
      url: result.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    results: brand,
  });
});
// __________________________________________________________________________
// Update Brand
const UpdateBrand = asyncHandler(async (req, res, next) => {
  const { BrandId } = req.params;
  // التحقق من وجود التصنيف
  const brand = await Brand.findById(BrandId);
  if (!brand) {
    return next(new Error("Brand Not Found!"));
  }
  if (req.user._id.toString() !== brand.createdBy.toString()) {
    return next(new Error("User Not Authorization!", { cause: 404 }));
  }
  // تحديث الاسم والسلاج إذا تم إرسالهما
  if (req.body.name) {
    brand.name = req.body.name;
    brand.slug = slugify(req.body.name);
  }
  // تحديث الصورة إن تم رفع صورة جديدة
  if (req.file) {
    const uploadOptions = {};
    // إذا كانت هناك صورة قديمة، استبدلها
    if (brand.image && brand.image.id) {
      uploadOptions.public_id = brand.image.id;
    }
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      uploadOptions
    );
    // تحديث أو إضافة الصورة
    brand.image = {
      url: secure_url,
      id: public_id,
    };
  }
  // حفظ التعديلات في قاعدة البيانات
  await brand.save();
  // إرسال الرد
  return res.json({ success: true, message: "Brand updated successfully." });
});
// __________________________________________________________________________
const DeleteBrand = asyncHandler(async (req, res, next) => {
  const { BrandId } = req.params; // تأكد من أن الـ param اسمه id في الراوت
  // التحقق من وجود البراند
  const brand = await Brand.findById(BrandId);
  if (!brand) {
    return next(new Error("Brand not found!"));
  }
  // حذف الصورة من Cloudinary إذا كانت موجودة
  if (brand.image && brand.image.id) {
    await cloudinary.uploader.destroy(brand.image.id);
  }
  // حذف البراند من قاعدة البيانات حسب _id
  await Brand.findByIdAndDelete(BrandId);
  res.json({ success: true, message: "Brand deleted successfully!" });
});
// __________________________________________________________________________
// Get All Brand
const GetAllBrand = asyncHandler(async (req, res, next) => {
  const All_Brand = await Brand.find();
  if (!All_Brand) {
    return next(new Error("Brand Not Found Data!"));
  }
  return res.json({ success: true, results: All_Brand });
});
// __________________________________________________________________________
module.exports = {
  CreateBrand,
  UpdateBrand,
  DeleteBrand,
  GetAllBrand,
};
