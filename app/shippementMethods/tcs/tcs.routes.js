const express = require("express");
const router = express.Router();
const tcsController = require("./tcs.controller");


router.route("/place-order").post(tcsController.placeOrder);
router.route("/cancel-order").put(tcsController.cancelOrder);
router.route("/track-order").post(tcsController.trackOrder);
// router.route("/cities").get(blueController.cities);
// router.route("/track").get(blueController.trackOrder);
module.exports = router;