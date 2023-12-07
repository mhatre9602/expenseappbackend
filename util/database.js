const Sequelize = require("sequelize");

const sequelize = new Sequelize("sql8668357", "sql8668357", "FhiItYXYiq", {
  dialect: "mysql",
  host: "sql8.freemysqlhosting.net",
});

module.exports = sequelize;

// const sequelize = new Sequelize("expensetracker", "root", "sharp", {
//   dialect: "mysql",
//   host: "localhost",
// });
