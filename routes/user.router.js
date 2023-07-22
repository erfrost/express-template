const express = require("express");
const router = express.Router({ mergeParams: true });
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth.middleware");
const User = require("../models/User");
const { check, validationResult } = require("express-validator");

router.get("/info", auth, async (req, res) => {
  try {
    const { _id } = req.user;

    const currentUser = await User.findOne({ _id });

    res.status(200).json(currentUser);
  } catch (error) {
    res
      .status(400)
      .json({ message: "На сервере произошла ошибка. Попробуйте позднее" });
  }
});

router.patch("/emailUpdate", auth, [
  check("email", "Некорректный email").isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Проверьте правильность введенных данных",
        errors: errors.array(),
      });
    }
    try {
      const { email } = req.body;
      const { _id } = req.user;
      const updatedUser = await User.findOneAndUpdate(
        { _id },
        { email },
        { new: true }
      );
      return res.status(200).json(updatedUser);
    } catch (error) {
      return res
        .status(400)
        .json({ message: "На сервере произошла ошибка. Попробуйте позднее" });
    }
  },
]);

router.patch("/nicknameUpdate", auth, [
  check("nickname", "Никнейм должен состоять минимум из 6 латинских символов")
    .matches(/^[a-zA-Z]+$/)
    .isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Проверьте правильность введенных данных",
        errors: errors.array(),
      });
    }

    try {
      const { nickname } = req.body;
      const { _id } = req.user;
      const updatedUser = await User.findOneAndUpdate(
        { _id },
        { nickname },
        { new: true }
      );
      return res.status(200).json(updatedUser);
    } catch (error) {
      return res
        .status(400)
        .json({ message: "На сервере произошла ошибка. Попробуйте позднее" });
    }
  },
]);

router.patch("/avatarUpdate", auth, async (req, res) => {
  try {
    console.log(req.body);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "На сервере произошла ошибка. Попробуйте позднее" });
  }
});

router.patch("/passwordUpdate", auth, [
  check("password", "Пароль должен содержать минимум 8 символов").isLength({
    min: 8,
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Проверьте правильность введенных данных",
        errors: errors.array(),
      });
    }

    try {
      const { password } = req.body;
      const { _id } = req.user;
      const hashedPassword = bcrypt.hash(password, 12);
      const updatedUser = await User.findOneAndUpdate(
        { _id },
        { password: hashedPassword },
        { new: true }
      );
      return res.status(200).json(updatedUser);
    } catch (error) {
      return res
        .status(400)
        .json({ message: "На сервере произошла ошибка. Попробуйте позднее" });
    }
  },
]);

module.exports = router;
