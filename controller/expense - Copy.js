const Expense = require("../models/expenses");
const { Op } = require("sequelize");

const addexpense = (req, res) => {
  const { expenseamount, description, category } = req.body;

  if (expenseamount == undefined || expenseamount.length === 0) {
    return res.status(400).json({ success: false, message: "Required Amount" });
  }

  Expense.create({ expenseamount, description, category, userId: req.user.id })
    .then((expense) => {
      return res.status(201).json({ expense, success: true });
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
};

const getexpenses = (req, res) => {
  let whereClause = {};
  //for normal expense reports
  Expense.findAll({ where: { ...whereClause, userId: req.user.id } })
    .then((expenses) => {
      return res.status(200).json({ expenses, success: true });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err, success: false });
    });
};

const deleteexpense = (req, res) => {
  const expenseid = req.params.expenseid;
  if (expenseid.length === 0) {
    return res.status(400).json({ success: false });
  }
  Expense.destroy({ where: { id: expenseid, userId: req.user.id } })
    .then((count) => {
      if (count === 0) {
        return res.status(404).json({
          success: false,
          message: "Error deleting the expense",
        });
      }
      return res
        .status(200)
        .json({ success: true, message: "Deleted Successfuly" });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ success: true, message: "Failed" });
    });
};

module.exports = {
  deleteexpense,
  getexpenses,
  addexpense,
};
