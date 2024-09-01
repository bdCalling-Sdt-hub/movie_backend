
const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET } = require("../../config/defaults");

const verifyToken = (req, res, next) => {
  const tokenWithBearer  = req.headers.authorization;
  if (!tokenWithBearer) {
    return res.status(403).send({ success: false, message: "Forbidden access" });
  }
  if (!tokenWithBearer.startsWith("Bearer ")) {
    return res
      .status(401)
      .send({ success: false, message: "unauthorized access" });
  }
  const token = tokenWithBearer.split(" ")[1]; 
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ success: false, message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
