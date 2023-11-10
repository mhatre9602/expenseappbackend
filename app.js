const path = require("path");

const express = require("express");
var cors = require("cors");
const sequelize = require("./util/database");
const User = require("./models/users");
const Expense = require("./models/expenses");
const Order = require("./models/orders");
const ForgotPassword = require("./models/forgotPasswordRequests");

const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const purchaseRoutes = require("./routes/purchase");
const premiumFeatureRoutes = require("./routes/premiumFeature");

const app = express();
const dotenv = require("dotenv");

// get config vars
dotenv.config();

app.use(cors());

app.use(express.json()); //this is for handling jsons

app.use("/user", userRoutes);
app.use("/expense", expenseRoutes);
app.use("/purchase", purchaseRoutes);
app.use("/premium", premiumFeatureRoutes);
app.get("/", (req, res) => {
  res.send({
    message: "Welcome",
  });
});
User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);
User.hasMany(ForgotPassword);

sequelize
  .sync()
  .then(() => {
    app.listen(3001);
  })
  .catch((err) => {
    console.log(err);
  });
