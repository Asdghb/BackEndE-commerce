
const isValid = (Schema) => {
  return (req, res, next) => {
    // دمج البيانات من body و params و query
    const copyReq = { ...req.body, ...req.params, ...req.query };
    // التحقق من البيانات باستخدام Joi
    const validationResoult = Schema.validate(copyReq, { abortEarly: false });
    // إذا كان هناك أخطاء في التحقق
    if (validationResoult.error) {
      // جمع رسائل الخطأ
      const message = validationResoult.error.details.map(
        (error) => error.message
      );
      // إرسال الخطأ إلى next مع الرسائل
      return next(new Error(message.join(", ")));
    }
    // إذا كانت البيانات صحيحة
    return next();
  };
};

module.exports = { isValid };
