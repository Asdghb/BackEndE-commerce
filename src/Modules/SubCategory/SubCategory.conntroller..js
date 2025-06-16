const { asyncHandler } = require("../../Utils/asyncHandler");
const SubCategory = require("../../../DB/Models/SubCategory.models");
const Category = require("../../../DB/Models/Category.models");
const slugify = require("slugify");
const cloudinary = require("../../Utils/cloudinary");
// __________________________________________________________________________
// create SubCategory
const CreateSubCategory = asyncHandler(async (req, res, next) => {
  // data
  const { name } = req.body;
  const { categoryId } = req.params;
  // check Category
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new Error("Category Not Found!", { cause: 404 }));
  }
  //   check file
  if (!req.file) {
    return next(new Error("image Not Found!", { cause: 404 }));
  }
  // image
  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folderP: `${process.env.FOLDER_CLOUD_NAME}/subcategory`,
    }
  );
  // save db
  const subcategory = await SubCategory.create({
    name,
    slug: slugify(name),
    categoryId,
    createdBy: req.user._id,
    image: { id: public_id, url: secure_url },
  });
  // send res
  return res.json({ success: true, results: subcategory });
});
// __________________________________________________________________________
// update SubCategory
const updateSubCategory = asyncHandler(async (req, res, next) => {
  const { categoryId, subcategoryId } = req.params;
  const { name } = req.body;
  const file = req.file;
  // التحقق من وجود القسم الرئيسي
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new Error("Category Not Found!", { cause: 404 }));
  }
  // التحقق من وجود القسم الفرعي
  const subCategory = await SubCategory.findById(subcategoryId);
  if (!subCategory) {
    return next(new Error("SubCategory Not Found!", { cause: 404 }));
  }
  if (req.user._id.toString() !== subCategory.createdBy.toString()) {
    return next(new Error("User Not Authorization!", { cause: 404 }));
  }
  // تحديث الاسم و slug إذا تم تمرير اسم جديد
  if (name) {
    subCategory.name = name;
    subCategory.slug = slugify(name);
  }
  // تحديث الصورة إذا تم رفع ملف جديد
  if (file) {
    const uploaded = await cloudinary.uploader.upload(file.path, {
      public_id: subCategory.image?.id,
    });
    subCategory.image.url = uploaded.secure_url;
  }
  await subCategory.save();
  return res.json({
    success: true,
    message: "Updated successfully!",
    results: subCategory,
  });
});
// __________________________________________________________________________
// delete Subcategory
const DeleteSubCategory = asyncHandler(async (req, res, next) => {
  const { categoryId, subcategoryId } = req.params;
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new Error("Category Not Found!", { cause: 404 }));
  }
  if (req.user._id.toString() !== subCategory.createdBy.toString()) {
    return next(new Error("User Not Authorization!", { cause: 404 }));
  }
  // delete from db
  const del = await SubCategory.findByIdAndDelete(subcategoryId);
  if (!del) {
    return next(new Error("SubCategory Not Found!", { cause: 404 }));
  }
  return res.json({
    success: true,
    message: "Delete successfully!",
  });
});
// __________________________________________________________________________
// Get All Subcategory
const ALLSubCategory = asyncHandler(async (req, res, next) => {
  const SubCategorys = await SubCategory.find().populate("categoryId");
  if (!SubCategorys) {
    return next(new Error("SubCategorys Not Found!", { cause: 404 }));
  }
  return res.json({
    success: true,
    results: SubCategorys,
  });
});
// __________________________________________________________________________
module.exports = {
  CreateSubCategory,
  updateSubCategory,
  DeleteSubCategory,
  ALLSubCategory,
};
