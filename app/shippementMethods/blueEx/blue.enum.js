const config = require("../../../config/config");

//"product_variations": "small-black",
//"sku_code": "12assk11aa"
// "customer_name": "test",
//"customer_email": "example@example.com",
//"customer_contact": "032300000000",
//"customer_address": "Address",
//"customer_city": "City",
//"customer_comment": "comments",
//"total_order_amount": "1200",
//"total_order_weight": "2",
const placeOrderPayLoad = {

    "acno": config.blueEx.accountNo,
    "testbit": "N",
    "userid": config.blueEx.blueExId,
    "password": config.blueEx.blueExPassword,
    "service_code": "BE",
    "cn_generate": "Y",
    "customer_country": "PK",
    "customer_comment": "",
    // "shipping_charges": "130",
    "payment_type": "COD",
    "fragile": "N",
    "parcel_type": "P",
    "insurance_require": "N",
    "insurance_value": "0",
    "multi_pickup": "Y",
}

const productPayload = {
    "product_code": "",
    "product_name": "",
    "product_price": "",
    "product_weight": "",
    "product_quantity": "",
    "product_variations": "",
    "sku_code": ""
}

let consignmentPayload = {
    "acno": config.blueEx.accountNo,
    "userid": config.blueEx.blueExId,
    "password": config.blueEx.blueExPassword,
    "consignments": ""
}

let trackingConsignmentPayload = {
    "acno": config.blueEx.accountNo,
    "userid": config.blueEx.blueExId,
    "password": config.blueEx.blueExPassword,
    "consignment_no": ""
}



module.exports = { placeOrderPayLoad, productPayload, consignmentPayload, trackingConsignmentPayload }