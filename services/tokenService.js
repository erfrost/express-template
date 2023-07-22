const jwt = require("jsonwebtoken");
const config = require("config");
const Token = require("../models/Token");
const chalk = require("chalk");

class TokenService {
  generate(payload) {
    const accessToken = jwt.sign(payload, config.get("accessSecret"), {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(payload, config.get("refreshSecret"));

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async save(userId, refreshToken) {
    const data = await Token.findOne({ user: userId });
    if (data) {
      data.refreshToken = refreshToken;
      return data.save();
    }

    const token = await Token.create({
      user: userId,
      refreshToken,
    });
    return token;
  }

  validateRefresh(refreshToken) {
    try {
      const verify = jwt.verify(refreshToken, config.get("refreshSecret"));
      return verify;
    } catch (error) {
      return null;
    }
  }

  validateAccess(accessToken) {
    try {
      return jwt.verify(accessToken, config.get("accessSecret"));
    } catch (error) {
      return null;
    }
  }

  async findToken(refreshToken) {
    try {
      return await Token.findOne({ refreshToken });
    } catch (error) {
      return null;
    }
  }
}

module.exports = new TokenService();
