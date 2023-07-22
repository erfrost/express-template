const express = require("express");
const router = express.Router({ mergeParams: true });
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { check, validationResult } = require("express-validator");
const {
  generate,
  save,
  validateRefresh,
  findToken,
} = require("../services/tokenService");

router.post("/signUp", [
  check("email", "Некорректный email").isEmail(),
  check("nickname", "Никнейм должен состоять минимум из 6 латинских символов")
    .matches(/^[a-zA-Z]+$/)
    .isLength({ min: 5 }),
  check("password", "Пароль должен содержать минимум 8 символов").isLength({
    min: 8,
  }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Проверьте правильность введеных данных",
          errors: errors.array(),
        });
      }

      const { email, nickname, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(201).json({
          message: "Данный email уже зарегистрирован",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await User.create({
        email: email,
        nickname: nickname,
        password: hashedPassword,
      });

      const tokens = generate({ _id: newUser._id });

      await save(newUser._id, tokens.refreshToken);

      res.status(201).send({ ...tokens, userId: newUser._id });
    } catch {
      res
        .status(500)
        .json({ message: "На сервере произошла ошибка. Попробуйте позже" });
    }
  },
]);

router.post("/signInWithPassword", [
  check("login", "Некорректный email").isEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);

      const { login, password } = req.body;

      let existingUser = undefined;

      if (!errors.isEmpty()) {
        existingUser = await User.findOne({ nickname: login });
      } else {
        existingUser = await User.findOne({ email: login });
      }
      if (!existingUser) {
        return res.status(201).send({
          message: "Неверное имя пользователя или пароль",
        });
      }

      const isPasswordEqual = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!isPasswordEqual) {
        return res.status(201).send({
          message: "Неверное имя пользователя или пароль",
        });
      }

      const tokens = generate({ _id: existingUser._id });
      await save(existingUser._id, tokens.refreshToken);

      res.status(200).send({ ...tokens, userId: existingUser._id });
    } catch {
      res
        .status(500)
        .json({ message: "На сервере произошла ошибка. Попробуйте позже" });
    }
  },
]);

function isTokenInvalid(data, dbToken) {
  return !data || !dbToken || data._id !== dbToken?.user?.toString();
}

router.post("/token", async (req, res) => {
  try {
    const { refresh_token: refreshToken } = req.body;
    const data = validateRefresh(refreshToken);
    const dbToken = await findToken(refreshToken);

    if (isTokenInvalid(data, dbToken)) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    const tokens = generate({ _id: data._id });
    await save(data._id, tokens.refreshToken);

    res.status(200).send({ ...tokens, userId: data._id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "На сервере произошла ошибка. Попробуйте позже" });
  }
});

module.exports = router;
