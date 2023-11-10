const express = require("express");

const userController = require("../controller/user");

const router = express.Router();

router.post("/signup", userController.signup);

router.post("/login", userController.login);

router.post("/password/forgotpassword", userController.forgotPassword);

router.get("/password/resetpassword/:uuid", userController.updatePasswordForm);

router.patch("/password/updatepassword/:uuID", userController.updatePassword);

module.exports = router;
