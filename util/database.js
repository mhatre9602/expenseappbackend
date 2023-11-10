const Sequelize = require("sequelize");

const sequelize = new Sequelize("expensetracker", "root", "sharp", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
