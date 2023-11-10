const Expense = require("../models/expenses");
const { Op } = require("sequelize");
const User = require("../models/users");
const sequelize = require("../util/database");

const addexpense = async (req, res) => {
  const transact = await sequelize.transaction();
  try {
    const { expenseamount, description, category } = req.body;

    if (expenseamount == undefined || expenseamount.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Parameters missing" });
    }

    const expense = await Expense.create(
      { expenseamount, description, category, userId: req.user.id },
      { transaction: transact }
    );

    const total_cost = Number(req.user.totalExpenses) + Number(expenseamount);
    console.log(total_cost);
    await User.update(
      {
        totalExpenses: total_cost,
      },
      {
        where: { id: req.user.id },
        transaction: transact,
      }
    );
    await transact.commit();
    return res.status(201).json({ expense: expense });
  } catch (err) {
    await transact.rollback();
    return res.status(500).json({ success: false, error: err });
  }
};

const getexpenses = (req, res) => {
  let whereClause = {};
  if (req.query.type == "daily" && req.query.start.length) {
    whereClause = {
      ...whereClause,
      createdAt: {
        [Op.between]: [
          req.query.start + " 00:00:00",
          req.query.start + " 23:59:59",
        ],
      },
    };
  }
  if (
    req.query.type == "monthly" &&
    req.query.start.length &&
    req.query.end.length
  ) {
    whereClause = {
      ...whereClause,
      createdAt: {
        [Op.between]: [
          req.query.start + " 00:00:00",
          req.query.end + " 23:59:59",
        ],
      },
    };
  }

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

const deleteexpense = async (req, res) => {
  const transact = await sequelize.transaction();
  const expenseid = req.params.expenseid;
  try {
    const expenseamt = await Expense.findOne({ where: { id: expenseid } });
    const userTotalExpense = req.user.totalExpenses;
    let totalCost;
    // if totalExpenses become zero then to ensure we don't run into negative total expense
    if (userTotalExpense && expenseamt.expenseamount) {
      totalCost = Number(userTotalExpense) - Number(expenseamt.expenseamount);
    } else {
      totalCost = 0;
    }
    if (expenseid == undefined || expenseid.length === 0) {
      return res.status(400).json({ success: false });
    }
    const rowsCount = await Expense.destroy({
      where: { id: expenseid, userId: req.user.id },
    });
    if (rowsCount === 0) {
      transact.commit();
      return res.status(404).json({
        success: false,
        message: "Error deleting the expense",
      });
    }

    await User.update(
      {
        totalExpenses: totalCost,
      },
      {
        where: { id: req.user.id },
        transaction: transact,
      }
    );
    transact.commit();
    return res
      .status(200)
      .json({ success: true, message: "Deleted Successfuly" });
  } catch (err) {
    transact.rollback();
    console.log(err);
    return res.status(500).json({ success: true, message: "Failed" });
  }
};

module.exports = {
  deleteexpense,
  getexpenses,
  addexpense,
};
