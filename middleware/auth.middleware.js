const { validateAccess } = require("../services/tokenService");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  try {
    const accessToken = req.headers.authorization.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const data = validateAccess(accessToken);
    if (!data) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = data;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
