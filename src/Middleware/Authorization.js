// ثانياً: Authorization (التفويض)
// يعني: "ماذا يُسمح لك أن تفعل؟"

const { asyncHandler } = require("../Utils/asyncHandler");

const isAuthorized = (Role) => {
  return asyncHandler(async (req, res, next) => {
    if (Role !== req.user.role) {
      return next(new Error("You are not authorized to Admin", { cause: 403 }));
    }
    return next();
  });
};

module.exports = isAuthorized;
