const Sequelize = require("sequelize");

const sequelize = new Sequelize("sql8661249", "sql8661249", "d6lz8g5sGa", {
  dialect: "mysql",
  host: "sql8.freemysqlhosting.net",
});

module.exports = sequelize;

// const sequelize = new Sequelize("expensetracker", "root", "sharp", {
//   dialect: "mysql",
//   host: "localhost",
// });
