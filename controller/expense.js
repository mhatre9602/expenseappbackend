const Expense = require("../models/expenses");
const { Op } = require("sequelize");
const User = require("../models/users");
const sequelize = require("../util/database");
const moment = require("moment");
let converter = require("json-2-csv");
const s3Bucket = require("../s3");

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

function reportsFilter(req) {
  let whereClause = {};
  if (req.query.type == "daily" && req.query.start.length) {
    whereClause = {
      ...whereClause,
      createdAt: {
        [Op.between]: [
          moment(req.query.start).startOf("day").toISOString(),
          moment(req.query.start).endOf("day").toISOString(),
        ],
      },
    };
  }
  //weekly reports
  if (req.query.type == "weekly" && req.query.start.length) {
    whereClause = {
      ...whereClause,
      createdAt: {
        [Op.between]: [
          moment(req.query.start).startOf("week").toISOString(),
          moment(req.query.start).endOf("week").toISOString(),
        ],
      },
    };
  }
  //monthly reports
  if (req.query.type == "monthly" && req.query.start.length) {
    whereClause = {
      ...whereClause,
      createdAt: {
        [Op.between]: [
          moment(req.query.start).startOf("month").toISOString(),
          moment(req.query.start).endOf("month").toISOString(),
        ],
      },
    };
  }
  return whereClause;
}

const getexpenses = async (req, res) => {
  // console.log(req.user);
  const whereClause = reportsFilter(req);

  //for normal expense reports
  const data = await Expense.findAll({
    where: { ...whereClause, userId: req.user.id },
  })
    .then((expenses) => {
      return expenses;
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err, success: false });
    });
  res.status(200).json({ expenses: data, success: true });
  return data;
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

const downloadcsvfile = async (req, res) => {
  // console.log(req.user);
  const whereClause = reportsFilter(req);

  //for normal expense reports
  const data = await Expense.findAll({
    where: { ...whereClause, userId: req.user.id },
    attributes: ["expenseamount", "category", "description", "userId"],
  })
    .then((expenses) => {
      return expenses;
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err, success: false });
    });
  // res.status(200).json({ expenses: data, success: true });
  const reportCsv = [];
  data.forEach((d) => {
    reportCsv.push({
      Date: moment(d.createdAt).format("DD-MMM-yyyy"),
      User: d.userId,
      Amount: d.expenseamount,
      Description: d.description,
      Category: d.category,
    });
  });
  const csv = await converter.json2csv(reportCsv);
  const report = await s3Bucket.uploadFileToS3(csv);
  return res.send(report);
};

module.exports = {
  deleteexpense,
  getexpenses,
  addexpense,
  downloadcsvfile,
};
