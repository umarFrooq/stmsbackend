const qaModel = require("./q&a.model");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const db = require("../../config/mongoose");
const { responseMethod } = require("@/utils/generalDB.methods.js/DB.methods");
const { dateFilter, sortByParser } = require("@/config/components/general.methods");
const sellerDetailMod = db.SellerDetail;
const productModel = db.Product;
const { roleTypes, productTypes } = require("../../config/enums");
const mongoose = require("mongoose");

/**
 * Create a question
 * @param {Object} qaBody
 * @param {Object} user
 * @returns {Promise<result>}
 */

const createQuestion = async (qaBody, user) => {
  try {
    if (!qaBody || !Object.keys(qaBody).length)
      throw new ApiError(httpStatus.BAD_REQUEST, "Body not found.");
    const product = await productModel.findById(qaBody.productId);
    if (!product)
      throw new ApiError(httpStatus.BAD_REQUEST, "Product not found");
    if (product.productType === productTypes.VARIANT)
      qaBody["productId"] = product.mainProduct;

    if (
      !product.user ||
      !product.user.sellerDetail ||
      !Object.keys(product.user.sellerDetail).length
    )
      throw new ApiError(httpStatus.BAD_REQUEST, "product store not exist.");
    qaBody["productName"] = product.productName;
    qaBody["userId"] = user.id;
    qaBody["userName"] = user.fullname;
    qaBody["brandName"] = product.user.sellerDetail.brandName;
    qaBody["brandId"] = product.user.sellerDetail.id;
    qaBody["sellerId"] = product.user.id;
    const result = await qaModel.create(qaBody);
    return responseMethod(200, true, "Qestion created ", result);
  } catch (err) {
    throw new ApiError(400, err);
  }
};

/**
 * Create a Answer
 * @param {Object} qaBody
 * @param {Object} user
 *  @param {ObjectId} qaId
 * @returns {Promise<result>}
 */
const createAnswer = async (id, qaBody, user) => {
  try {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "QA id not found");
    if (!qaBody || !Object.keys(qaBody).length)
      throw new ApiError(httpStatus.BAD_REQUEST, "body not found");
    const QADoc = await qaById(id);
    if (!user || user.sellerDetail.id != QADoc.data.brandId)
      throw new ApiError(
        401,
        "You are not authorized to answer this question."
      );
    await qaById(id);
    const result = await qaModel.findByIdAndUpdate(id, qaBody, { new: true });
    if (!result)
      throw new ApiError(httpStatus.NOT_FOUND, " Question not found");
    return responseMethod(200, true, "Answer created successfully", result);
  } catch (err) {
    if (err && err.statusCode) throw new ApiError(err.statusCode, err.message);
    throw new ApiError(400, err);
  }
};

/**
 * get question Answer by id
 *  @param {ObjectId} qaId
 * @returns {Promise<result>}
 */
const qaById = async (id) => {
  try {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Question not found");
    id = mongoose.Types.ObjectId(id);
    // const result = await qaModel.findById(id);
    // if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
    let result = await qaModel.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productId",
        },
      },

      {
        $unwind: {
          path: "$productId",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          productId: {
            productName: 1,
            slug: 1,
            price: 1,
            regularPrice: 1,
            onSale: 1,
            salePrice: 1,
            id: "$productId._id",
            mainImage: 1,
            description: 1,
          },
          id: "$_id",
          question: 1,
          brandName: 1,
          brandId: 1,
          userId: 1,
          answer: 1,
          userName: 1,
          _id: 0,
          createdAt: 1
        },
      }

    ]);

    if (!result || !result.length)
      throw new ApiError(httpStatus.NOT_FOUND, "Question not found");

    return responseMethod(200, true, "Question and Answer found", result[0]);
  } catch (err) {
    if (err && err.statusCode) throw new ApiError(err.statusCode, err.message);
    throw new ApiError(400, err);
  }
};

/**
 * delete question Answer by id
 * @param {ObjectId} qaId
 * @returns {Promise<result>}
 */
const deleteQa = async (id) => {
  try {
    if (!id) throw new ApiError(httpStatus.BAD_REQUEST, "Question not found");
    await qaById(id);
    const result = await qaModel.findByIdAndDelete(id);
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
    return responseMethod(200, true, "Question deleted succesfully", result);
  } catch (err) {
    if (err && err.statusCode) throw new ApiError(err.statusCode, err.message);
    throw new ApiError(400, err);
  }
};
/**
 * Querying users with filter and options
 * @param {Object} filter --filters of Q&A
 * @param {Object} options -- options include limit, page and sortBy
 * @returns {Promise<result>}
 */

const getAllQa = async (filter, option, user) => {
  try {
    if (
      (filter.to || filter.from) &&
      ((user && user.role === roleTypes.ADMIN) ||
        user.role === roleTypes.SUPPLIER)
    )
      filter = dateFilter(filter);
    if (user && user.role === roleTypes.SELLER)
      Object.assign(filter, { sellerId: user.id });
    if (!user || !Object.keys(user).length)
      Object.assign(filter, {
        visible: true,
      });
    option.page && option.page > 0 ? option.page : (option.page = 1);
    option.limit && option.limit > 0 ? option.limit : (option.limit = 10);
    let skip = (option.page - 1) * option.limit;
    if (filter.productId)
      filter.productId = mongoose.Types.ObjectId(filter.productId);
    if (filter.brandId)
      filter.brandId = mongoose.Types.ObjectId(filter.brandId);
    if (!option || !option.sortBy)
      option["sortBy"] = "-createdAt"
    sortByParser(option)

    let query = [
      { $match: filter },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productId",
        },
      },

      {
        $unwind: {
          path: "$productId",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: option.sortBy },
      {
        $project: {
          productId: {
            productName: 1,
            slug: 1,
            price: 1,
            regularPrice: 1,
            onSale: 1,
            salePrice: 1,
            id: "$productId._id",
            mainImage: 1,
            description: 1,
          },
          id: "$_id",
          question: 1,
          brandName: 1,
          brandId: 1,
          userId: 1,
          answer: 1,
          userName: 1,
          _id: 0,
          createdAt: 1
        },
      },
      {
        $facet: {
          totalResults: [
            {
              $count: "total",
            },
          ],
          results: [
            {
              $skip: skip,
            },
            {
              $limit: option.limit,
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$totalResults",
        },
      },
      {
        $addFields: {
          page: option.page,
          limit: option.limit,
          totalPages: {
            $ceil: {
              $divide: ["$totalResults.total", option.limit],
            },
          },
          totalResults: "$totalResults.total",
        },
      },
    ]
    console.log(JSON.stringify(query));
    let result = await qaModel.aggregate(query);

    if (!result || !result[0] || !result[0].results || !result[0].results.length)
      throw new ApiError(httpStatus.NOT_FOUND, "No record found");
    return responseMethod(200, true, "Question found", result[0]);
  } catch (err) {
    if (err && err.statusCode) throw new ApiError(err.statusCode, err.message);
    throw new ApiError(400, err);
  }
};

module.exports = {
  createQuestion,
  createAnswer,
  qaById,
  getAllQa,
  deleteQa,
};
