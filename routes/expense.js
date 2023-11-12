const express = require("express");

const expenseController = require("../controller/expense");
const userauthentication = require("../middleware/auth");

const router = express.Router();

router.post(
  "/addexpense",
  userauthentication.authenticate,
  expenseController.addexpense
);

router.get(
  "/getexpenses",
  userauthentication.authenticate,
  expenseController.getexpenses
);

router.delete(
  "/deleteexpense/:expenseid",
  userauthentication.authenticate,
  expenseController.deleteexpense
);

router.get(
  "/download",
  userauthentication.authenticate,
  expenseController.downloadcsvfile
);

module.exports = router;
