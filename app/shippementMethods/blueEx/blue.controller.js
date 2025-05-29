const catchAsync = require('../../../utils/catchAsync');
const blueExServices = require("./blue.service");
const httpStatus = require("http-status");

const placeOrder = catchAsync(async(req, res) => {
    const _placeOrder = await blueExServices.placeOrder(req.body);
    // res.status(httpStatus.OK).send(_placeOrder);
    res.sendStatus(_placeOrder);
});

const consignmentPrint = catchAsync(async(req, res) => {
    const _consigmentPrint = await blueExServices.consignmentPrint(req.body.consigments);
    // res.status(httpStatus.OK).send(_consigmentPrint);
    res.sendStatus(_consigmentPrint);
});
const cities = catchAsync(async(req, res) => {
    const cities = await blueExServices.getAllCities();
    // res.status(httpStatus.OK).send(cities);
    res.sendStatus(cities);
});

const trackOrder = catchAsync(async(req,res)=>{
    const _trackOrder = await blueExServices.trackOrder(req.body.consignment);
    // res.status(httpStatus.OK).send(_trackOrder);
    res.sendStatus(_trackOrder);
})
module.exports = {
    placeOrder,
    consignmentPrint,
    cities,
    trackOrder
}