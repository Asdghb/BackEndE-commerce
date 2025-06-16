  const asyncHandler = (conntroller) => {
  return (req, res, next) => {
    conntroller(req, res, next).catch((error) => {
      next(error);
    });
  };
};
module.exports = { asyncHandler };
