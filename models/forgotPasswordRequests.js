const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const ForgotPasswordRequests = sequelize.define("forgotPasswordRequests", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  isActive: Sequelize.BOOLEAN,
});

module.exports = ForgotPasswordRequests;
