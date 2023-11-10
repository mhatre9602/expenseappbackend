const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Sib = require("sib-api-v3-sdk");
require("dotenv").config();
const ResetPassword = require("../models/forgotPasswordRequests");
const { v4: uuidv4 } = require("uuid");

function isstringinvalid(string) {
  if (string == undefined || string.length === 0) {
    return true;
  } else {
    return false;
  }
}

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("email", email);
    if (
      isstringinvalid(name) ||
      isstringinvalid(email || isstringinvalid(password))
    ) {
      return res
        .status(400)
        .json({ err: "Bad parameters . Something is missing" });
    }
    const saltrounds = 10;
    bcrypt.hash(password, saltrounds, async (err, hash) => {
      console.log(err);
      await User.create({ name, email, password: hash });
      res.status(201).json({ message: "Successfuly create new user" });
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

const generateAccessToken = (id, name, ispremiumuser) => {
  return jwt.sign({ userId: id, name: name, ispremiumuser }, "secretkey");
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (isstringinvalid(email) || isstringinvalid(password)) {
      return res
        .status(400)
        .json({ message: "Email id or password is missing ", success: false });
    }
    // console.log(password);
    const user = await User.findAll({ where: { email } });
    if (user.length > 0) {
      bcrypt.compare(password, user[0].password, (err, result) => {
        if (err) {
          throw new Error("Something went wrong");
        }
        if (result === true) {
          return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token: generateAccessToken(
              user[0].id,
              user[0].name,
              user[0].ispremiumuser
            ),
          });
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Password is incorrect" });
        }
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User Does not exists" });
    }
  } catch (err) {
    res.status(500).json({ message: err, success: false });
  }
};

const forgotPassword = async (req, res) => {
  const emailID = req.body.email;
  console.log(emailID);
  const user = await User.findAll({ where: { email: emailID } });
  console.log(user[0].id);
  const randomUUID = uuidv4();
  console.log(randomUUID);

  ResetPassword.create({
    id: randomUUID,
    isActive: true,
    userId: user[0].id,
  });

  const client = Sib.ApiClient.instance;
  const apiKey = client.authentications["api-key"];
  apiKey.apiKey = process.env.API_KEY;

  const tranEmailApi = new Sib.TransactionalEmailsApi();

  const sender = {
    email: "pratikk.mhatre93@gmail.com",
  };

  const receivers = [
    {
      email: "pratikk.mhatre@gmail.com",
    },
  ];

  tranEmailApi
    .sendTransacEmail({
      sender,
      to: receivers,
      subject: "Reset password link",
      textContent: `http://localhost:3001/user/password/resetpassword/${randomUUID}`,
    })
    .then(console.log("Link sent"))
    .catch((err) => {
      console.log(err);
    });
};

const updatePasswordForm = async (req, res) => {
  const uuidPwd = req.params.uuid;
  console.log("User UUID", uuidPwd);

  const isRequest = await ResetPassword.findOne({ where: { id: uuidPwd } });
  const requestActive = isRequest.isActive;
  const userID = isRequest.userId;
  console.log(userID);
  console.log(requestActive);
  if (isRequest && requestActive) {
    res.redirect("http://localhost:3000/user/resetpasswordform/" + uuidPwd);
  }
};

const updatePassword = async (req, res) => {
  const userID = req.params.uuID;
  // console.log(userID);
  const updateUser = await ResetPassword.findOne({ where: { id: userID } });
  await ResetPassword.update(
    { isActive: false },
    {
      where: { id: userID },
    }
  );
  const updateId = updateUser.userId;
  // console.log(updateId);
  const newPassword = req.body.password;
  // console.log(newPassword);

  const saltrounds = 10;
  bcrypt.hash(newPassword, saltrounds, async (err, hash) => {
    console.log(err);
    await User.update(
      { password: hash },
      {
        where: {
          id: updateId,
        },
      }
    );

    res.status(201).json({ message: "Successfuly Updated password" });
  });
};

module.exports = {
  signup,
  login,
  generateAccessToken,
  forgotPassword,
  updatePasswordForm,
  updatePassword,
};
