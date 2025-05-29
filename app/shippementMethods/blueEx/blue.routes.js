const express = require("express");
const router = express.Router();
const blueController = require("./blue.controller");
router.route("/place-order").post(blueController.placeOrder);
router.route("/consignment-print").post(blueController.consignmentPrint);
router.route("/cities").get(blueController.cities);
router.route("/track").get(blueController.trackOrder);
module.exports = router;
