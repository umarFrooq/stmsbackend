const httpStatus = require("http-status");
const ApiError = require("../../../utils/ApiError");
const blueExEnums = require("./blue.enum");
const blueExUtils = require("./blue.utils");
const qs = require("qs");
const config = require("../../../config/config");
const blueExCities = require("./blueEx.cities");
const { OrderDetail } = require("../../../config/mongoose");
const sellerDetailService = require("../../sellerDetail/sellerDetail.service")
const en=require('../../../config/locales/en')
const getAllCities = async () => {
  const cities = blueExCities.cities;
  // return JSON.stringify(cities);
  return cities;
};

const placeOrder = async (orderData, orderDetial) => {
  if (orderData) {
    console.log(orderData)
    if (orderData && orderData.orderItems && orderData.orderItems.length > 0) {
      let _placeOrderPayLoad = blueExEnums.placeOrderPayLoad;
      let orderAmount = 0;
      let orderWeight = 0;
      let productDetail = [];
      // let _productPayload = blueExEnums.productPayload;
      for (let i = 0; i < orderData.orderItems.length; i++) {
        let _product = orderData.orderItems[i];
        // console.log(_product.total);
        // let _productPayload = blueExEnums.productPayload;
        let _productPayload = {}
        _productPayload["product_code"] = _product.product.id;
        _productPayload["product_name"] = _product.product.productName;
        _productPayload["product_price"] = _product.total;
        _productPayload["product_weight"] = _product.product.weight;
        _productPayload["product_quantity"] = _product.quantity;
        _productPayload["product_variations"] = _product.product.productName;
        orderAmount += _product.total;
        orderWeight += _product.weight;
        productDetail.push(_productPayload);
        _placeOrderPayLoad["products_detail"] = productDetail
        // _placeOrderPayLoad.products_detail.push(_productPayload);
      }
      let international = orderDetial.customer.defaultAddress && orderDetial.customer.defaultAddress.localType == "international" ? true : false;
      _placeOrderPayLoad["shipper_contact"] = orderData.seller.phone ? orderData.seller.phone : "";
      if (orderData.seller && orderData.seller.sellerDetail) {
        _placeOrderPayLoad["shipper_name"] = orderData.seller.sellerDetail.brandName;
        _placeOrderPayLoad["shipper_address"] = orderData.seller.sellerDetail.address;
        _placeOrderPayLoad["shipper_city"] = orderData.seller.sellerDetail.cityCode ? orderData.seller.sellerDetail.cityCode : "";
        _placeOrderPayLoad["shipper_origion_city"] = orderData.seller.sellerDetail.cityCode ? orderData.seller.sellerDetail.cityCode : "";
        // _placeOrderPayLoad. = orderData.seller.sellerDetail.address;
      }
      _placeOrderPayLoad["shipper_email"] = orderData.seller.email ? orderData.seller.email : "";
      if (orderDetial && orderDetial.customer && orderDetial.customer.defaultAddress && orderDetial.customer.defaultAddress) {
        let phone = "";
        if (orderDetial.customer && orderDetial.customer.defaultAddress && orderDetial.customer.defaultAddress.localType == "international")
          phone = config.blueEx.internationalPhone;
        else
          phone = orderDetial.customer.defaultAddress.phone
            ? orderDetial.customer.defaultAddress.phone
            : "";
        _placeOrderPayLoad["customer_name"] = orderDetial.customer.defaultAddress.localType == "international"
          ? config.blueEx.internationalName :
          orderDetial.customer.defaultAddress.fullname;
        if (international)
          _placeOrderPayLoad["customer_email"] = config.blueEx.internationalEmail;
        else
          _placeOrderPayLoad["customer_email"] = orderDetial.customer.email
            ? orderDetial.customer.email
            : "";
        _placeOrderPayLoad["customer_contact"] = phone;
        _placeOrderPayLoad["customer_address"] =
          orderDetial.customer.defaultAddress.localType == "international"
            ? config.blueEx.internationalAddress
            : orderDetial.customer.defaultAddress.address;
        _placeOrderPayLoad["customer_city"] =
          orderDetial.customer.defaultAddress.localType == "international"
            ? config.blueEx.internationalCity
            // : "ABP"
            : orderDetial.customer.defaultAddress.city_code;
        _placeOrderPayLoad.customer_comment = orderDetial.comment
          ? orderDetial.comment
          : "";
        const totalOrderAmount = orderData.payable >= 0 && orderData.payableShippment >= 0 ? orderData.payable + orderData.payableShippment : orderData.subTotal + orderData.shippmentCharges;
        _placeOrderPayLoad["order_refernce_code"] = orderData.orderId;
        _placeOrderPayLoad["total_order_amount"] = totalOrderAmount.toString();
        _placeOrderPayLoad["total_order_weight"] = orderWeight;
        delete _placeOrderPayLoad.userid;
        delete _placeOrderPayLoad.password;
        // _placeOrderPayLoad.total_order_amount = orderAmount;
        // _placeOrderPayLoad.total_order_weight = orderWeight;
        let token = createToken();
        console.log(token);
        const options = {
          method: "POST",
          url: "https://bigazure.com/api/json_v3/shipment/create_shipment.php",
          token: "Basic " + token
        };
        console.log(_placeOrderPayLoad);
        // let order = JSON.stringify(_placeOrderPayLoad);
        // let order = { order: JSON.stringify(_placeOrderPayLoad) };
        // console.log(order);
        // _placeOrderPayLoad["shipping_charges"] = orderData.payableShippment >= 0 ? orderData.payableShippment : orderData.shippmentCharges;
        return await blueExUtils.blueExUtil(_placeOrderPayLoad, options);
      } else
        throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.ADDRESS_NOT_FOUND' );
    } else {
      throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.NO_PRODUCT_FOUND' );
    }
  } else {
    throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.NO_ORDER_FOUND' );
  }
};


const consignmentPrint = async (_consignment) => {
  if (_consignment && _consignment.length > 0) {
    const consignmentToString = _consignment.join(",");
    let _consignmentPayload = blueExEnums.consignmentPayload;
    _consignmentPayload.consignments = consignmentToString;
    const options = {
      method: "POST",
      url: "https://bigazure.com/api/json_v2/cnprint/cnprint.php",
    };
    const _consignmentPayloadToString = {
      consignments: JSON.stringify(_consignmentPayload),
    };
    return await blueExUtils.blueExUtil(
      qs.stringify(_consignmentPayloadToString),
      options
    );
  } else {
    throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.NO_CONSIGNMENT_ID_FOUND' );
  }
};
// const reversePickUp = async(_consignment) => {
//     if (_consignment && _consignment.length > 0) {
//         const consignmentToString = _consignment.join(",");
//         let _consignmentPayload = blueExEnums.consignmentPayload;
//         _consignmentPayload.consignments = consignmentToString;
//         const options = {
//             "method": "POST",
//             "url": "https://bigazure.com/api/json_v2/cnprint/cnprint.php",
//         }
//         const _consignmentPayloadToString = { "consignments": JSON.stringify(_consignmentPayload) };
//         return await blueExUtils.blueExUtil(qs.stringify(_consignmentPayloadToString), options);
//     } else {
//         throw new ApiError(httpStatus.NOT_FOUND, "Consignment Id not found.")
//     }
// }
const trackOrder = async (_consignment) => {
  if (_consignment && _consignment.length > 0) {
    let _consignmentPayload = blueExEnums.trackingConsignmentPayload;
    let options = {
      method: "GET",
      url: "https://bigazure.com/api/json_v2/tracking/tracking.php?tracking=",
    };
    _consignmentPayload.consignment_no = _consignment;
    let _payload = JSON.stringify(_consignmentPayload);
    options.url += _payload;
    return await blueExUtils.blueExUtil(
      "",
      options
    );
  } else {
    throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.NO_CONSIGNMENT_ID_FOUND' );
  }
};

const _consignmentPrint = async (_consignment) => {
  if (_consignment && _consignment.length > 0) {
    // const consignmentToString = _consignment.join(",");
    let _consignmentPayload = blueExEnums.consignmentPayload;
    _consignmentPayload.consignments = _consignment;
    const options = {
      method: "POST",
      url: "https://bigazure.com/api/json_v2/cnprint/cnprint.php",
    };
    const _consignmentPayloadToString = {
      consignments: JSON.stringify(_consignmentPayload),
    };
    return await blueExUtils.blueExUtil(
      qs.stringify(_consignmentPayloadToString),
      options
    );
  } else {
    throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.NO_CONSIGNMENT_ID_FOUND' );
  }
};

const getBlueXStatus = async (_consignment) => {

  if (_consignment && _consignment.length > 0) {
    let _consignmentPayload = blueExEnums.consignmentPayload;
    _consignmentPayload.consignments = _consignment;
    let options = {
      method: "GET",
      url: "https://bigazure.com/api/json_v2/status/status.php",
    };
    // const _consignmentPayloadToString = {
    //   status: JSON.stringify(_consignmentPayload),
    // };
    options.url += `?status={${qs.stringify(_consignmentPayload)}}`;
    return await blueExUtils.blueExUtil(
      {},
      options
    );
  } else {
    throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.NO_CONSIGNMENT_ID_FOUND' );
  }
}

const createToken = () => {
  let credentials = config.blueEx.accountNo + ":" + config.blueEx.blueExPasswordV3;
  let token = Buffer.from(credentials).toString('base64')
  console.log(token);
  return token;
}
const reverseShipment = async (consignmentNo) => {
  if (consignmentNo) {
    const token = await createToken();
    if (token) {
      const options = {
        method: "POST",
        url: "https://bigazure.com/api/json_v3/reversepickup/reversepickup.php",
        token: "Basic " + token
      }
      return await blueExUtils.blueExUtil(
        { consignment_no: consignmentNo },
        options
      );
    } else throw new ApiError(httpStatus.NOT_FOUND,'BLUE_EX_MODULE.SHIPPMENT_METHOD_ERROR' );
  } else throw new ApiError(httpStatus.NOT_FOUND, 'BLUE_EX_MODULE.NO_CONSIGNMENT_ID_FOUND' );
}
module.exports = {
  getAllCities,
  placeOrder,
  consignmentPrint,
  trackOrder,
  _consignmentPrint,
  getBlueXStatus
};
