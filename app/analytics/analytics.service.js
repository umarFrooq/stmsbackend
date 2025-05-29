const { Product, User, SellerDetail, Order, } = require('../../config/mongoose')
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const mongoose = require("mongoose");
const config = require("../../config/config");
const { streamingUtils } = require("./../streaming/streaming.utils");
const { streamingEndpoints } = require("./../../config/enums")
const { originRevenue } = require('../orderItem/orderItem.service')
let { abondonedCart } = require('../cart/cart.service')
const { totalOrders } = require('../order/order.service')
const monthlyAnalytics = async (user, date, token) => {
  try {
    date = new Date(date);
    let { currDate, prevDate, topDate } = dateHandler(date)

    const curr = {
      createdAt: {
        $gte: new Date(currDate.startDate),
        $lte: new Date(currDate.endDate)
      }
    }
    const prev = {
      createdAt: {
        $gte: new Date(prevDate.startDate),
        $lte: new Date(prevDate.endDate)
      }
    }

    const top = {
      createdAt: {
        $gte: new Date(topDate.startDate),
        $lte: new Date(topDate.endDate)
      }
    }
    let [products, orders, users, videos] = await Promise.all([productsMonthlyAnalytics(prev, curr, top, user), ordersMonthlyAnalytics(prev, curr, top, user), usersMonthlyAnalytics(prev, curr, top), videosMonthlyAnalytics(date, token)])

    let result = { products: products, orders: orders, users: users }
    if (videos) {
      result.videos = videos
    }
    if (user.role == 'supplier') {
      delete result.users
    }
    return result

  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
}

const overallAnalytics = async (user, token) => {
  // streamingCollection()
  let [products, sales, users, videos] = await Promise.all([productsOverallAnalytics(user), salesAnalyticsQuery(user), usersOverallAnalytics(), videosOverAllAnalytics(token)])
  let productStats = {};

  if (products && products.length) {
    products = products[0]

    productStats.totalProducts = products.totalProducts && products.totalProducts.length && products.totalProducts[0].totalProducts || 0;
    products.productType && products.productType.length && products.productType.forEach((item) => {
      productStats[item._id] = item.total
    });
    products.status && products.status.length && products.status.forEach((item) => {
      if (item._id == true)
        productStats['active'] = item.total
      else if (item._id == false)
        productStats['inactive'] = item.total
    });
    console.log(productStats)
  }

  let totalsales = sales.length && sales[0]['totalSales'] && sales[0]['totalSales'] || 0;
  let totalUsers = users.length && users[0]['totalUsers'] && users[0]['totalUsers'] || 0;

  let result = { productStats, totalsales, totalUsers }
  if (videos) {
    result.videos = videos
  }
  if (user.role == 'supplier') {
    delete result.totalUsers
  }
  return result

}

const usersOverallAnalytics = async () => {
  let user_query = [
    {
      '$count': 'totalUsers'
    }
  ]
  let users = await User.aggregate(user_query)
  return users
}

const productsOverallAnalytics = async (user) => {
  let product_query = [
    {
      '$facet': {
        'productType': [
          {
            '$group': {
              '_id': '$productType',
              'total': {
                '$sum': 1
              }
            }
          }
        ],
        'status': [
          {
            '$group': {
              '_id': '$active',
              'total': {
                '$sum': 1
              }
            }
          }
        ],
        'totalProducts': [
          {
            '$count': 'totalProducts'
          }
        ]
      }
    }
  ]
  if (user.role == 'supplier') {
    product_query.unshift({
      '$match': {
        user: mongoose.Types.ObjectId(user._id)
      }
    })
  }

  let products = await Product.aggregate(product_query).read("secondary");
  return products
}

const salesAnalyticsQuery = async (user) => {
  let sales_query = [
    {
      '$group': {
        '_id': null,
        'totalSales': {
          '$sum': '$subTotal'
        }
      }
    }, {
      '$project': {
        '_id': 0
      }
    }
  ]
  if (user.role == 'supplier') {
    sales_query.unshift({
      '$match': {
        seller: mongoose.Types.ObjectId(user._id)
      }
    })
  }

  let sales = await Order.aggregate(sales_query).read("secondary");
  return sales
}


const productsMonthlyAnalytics = async (prev, curr, top, user) => {
  let product_query = [
    {
      '$match': { ...top }
    }, {
      '$facet': {
        'currMonthProducts': [
          {
            '$match': curr
          }, {
            '$count': 'total'
          }
        ],
        'prevMonthProducts': [
          {
            '$match': prev
          }, {
            '$count': 'total'
          }
        ]
      }
    }, {
      '$addFields': {
        'currMonthProducts': {
          '$ifNull': [
            {
              '$arrayElemAt': [
                '$currMonthProducts', 0
              ]
            }, {}
          ]
        },
        'prevMonthProducts': {
          '$ifNull': [
            {
              '$arrayElemAt': [
                '$prevMonthProducts', 0
              ]
            }, {}
          ]
        }
      }
    }, {
      '$project': {
        'currMonthProducts': {
          '$ifNull': [
            '$currMonthProducts.total', 0
          ]
        },
        'prevMonthProducts': {
          '$ifNull': [
            '$prevMonthProducts.total', 0
          ]
        }
      }
    }
  ]
  if (user.role == 'supplier') {
    product_query[0].$match.user = mongoose.Types.ObjectId(user._id)
  }
  let products = await Product.aggregate(product_query).read("secondary");
  return products[0]
}


const ordersMonthlyAnalytics = async (prev, curr, top, user) => {

  let order_query = [
    {
      '$match': { ...top }
    }, {
      '$lookup': {
        'from': 'orderstatuses',
        'let': {
          'order': '$_id'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$and': [
                  {
                    '$eq': [
                      '$order', '$$order'
                    ]
                  }
                ]
              }
            }
          }, {
            '$project': {
              'name': 1,
              '_id': 0
            }
          }
        ],
        'as': 'status'
      }
    }, {
      '$facet': {
        'currMonthSales': [
          {
            '$match': curr
          }, {
            '$group': {
              '_id': null,
              'sales': {
                '$sum': '$subTotal'
              }
            }
          }
        ],
        'prevMonthSales': [
          {
            '$match': prev
          }, {
            '$group': {
              '_id': null,
              'sales': {
                '$sum': '$subTotal'
              }
            }
          }
        ],
        'currMonthOrders': [
          {
            '$match': curr
          }, {
            '$unwind': {
              'path': '$status'
            }
          }, {
            '$group': {
              '_id': '$status.name',
              'total': {
                '$sum': 1
              }
            }
          },
        ],
        'prevMonthOrders': [
          {
            '$match': prev
          }, {
            '$unwind': {
              'path': '$status'
            }
          }, {
            '$group': {
              '_id': '$status.name',
              'total': {
                '$sum': 1
              }
            }
          }
        ]
      }
    }, {
      '$addFields': {
        'currMonthSales': {
          '$arrayElemAt': [
            '$currMonthSales', 0
          ]
        },
        'prevMonthSales': {
          '$arrayElemAt': [
            '$prevMonthSales', 0
          ]
        }
      }
    }, {
      '$project': {
        'currMonthSales': '$currMonthSales.sales',
        'prevMonthSales': '$prevMonthSales.sales',
        'currMonthOrders': 1,
        'prevMonthOrders': 1
      }
    }
  ]
  if (user.role == 'supplier') {
    order_query[0].$match.seller = mongoose.Types.ObjectId(user._id)
  }




  // let products = await Product.aggregate(product_query)
  let orders = await Order.aggregate(order_query).read("secondary");
  console.log(orders);
  let orderStats = {
    currMonthOrders: {},
    prevMonthOrders: {}
  }
  if (orders && orders.length) {
    orders = orders[0]
    orders.currMonthOrders && orders.currMonthOrders.forEach(order => {
      orderStats['currMonthOrders'][order._id] = order.total
    })
    orders.prevMonthOrders && orders.prevMonthOrders.forEach(order => {
      orderStats['prevMonthOrders'][order._id] = order.total
    })
  }

  orderStats.currMonthSales = orders.currMonthSales || 0;
  orderStats.prevMonthSales = orders.prevMonthSales || 0;
  orderStats.currMonthTotalOrders = orderStats.currMonthOrders && orderStats.currMonthOrders.new || 0;
  orderStats.prevMonthTotalOrders = orderStats.prevMonthOrders && orderStats.prevMonthOrders.new || 0;

  if (orderStats.currMonthTotalOrders != 0 && orderStats.prevMonthTotalOrders != 0) {
    orderStats.averageOrderValue = Math.ceil(orderStats.currMonthSales / orderStats.currMonthTotalOrders) || 0;
  }
  else
    orderStats.averageOrderValue = 0;
  return orderStats

}


const usersMonthlyAnalytics = async (prev, curr, top) => {
  let user_query = [
    {
      '$match': curr
    }, {
      '$facet': {
        'currMonthUsers': [
          {
            '$group': {
              '_id': '$role',
              'total': {
                '$sum': 1
              }
            }
          }, {
            '$project': {
              'role': '$_id',
              'total': 1,
              '_id': 0
            }
          }
        ],
        'currMonthTotalUsers': [
          {
            '$count': 'total'
          }
        ],
        'session': [
          {
            '$group': {
              '_id': '$origin.source',
              'total': {
                '$sum': 1
              }
            }
          }, {
            '$project': {
              'platform': '$_id',
              'total': 1,
              '_id': 0
            }
          }
        ]
      }
    }, {
      '$addFields': {
        'currMonthTotalUsers': {
          '$arrayElemAt': [
            '$currMonthTotalUsers', 0
          ]
        }
      }
    }, {
      '$addFields': {
        'currMonthTotalUsers': '$currMonthTotalUsers.total'
      }
    }
  ]

  let users = await User.aggregate(user_query).read("secondary");
  console.log(users)
  let userStats = {
    currMonthUsers: {},
    session: {}
  };
  if (users && users.length) {
    users = users[0]
    users.currMonthUsers.forEach(user => {
      userStats['currMonthUsers'][user.role] = user.total
    })
    users.session.forEach(session => {
      userStats['session'][session.platform] = session.total
    })

    userStats.currMonthTotalUsers = users.currMonthTotalUsers || 0;

  }

  console.log(userStats)
  return userStats
}

const orderChart = async (user, startDate, endDate, format) => {

  let chart_query = [
    {
      '$match': {
        'createdAt': {
          '$gte': new Date(startDate),
          '$lte': new Date(endDate)
        },
      }
    }, {
      '$addFields': {
        'createdAt': {
          '$cond': {
            'if': {
              '$eq': [
                {
                  '$type': '$createdAt'
                }, 'date'
              ]
            },
            'then': '$createdAt',
            'else': null
          }
        }
      }
    }, {
      '$addFields': {
        '__alias_0': {
          'year': {
            '$year': '$createdAt'
          },
          'month': {
            '$subtract': [
              {
                '$month': '$createdAt'
              }, 1
            ]
          }
        }
      }
    }, {
      '$group': {
        '_id': {
          '__alias_0': '$__alias_0'
        },
        '__alias_1': {
          '$sum': 1
        }
      }
    }, {
      '$project': {
        '_id': 0,
        '__alias_0': '$_id.__alias_0',
        '__alias_1': 1
      }
    }, {
      '$project': {
        'x': '$__alias_0',
        'y': '$__alias_1',
        '_id': 0
      }
    }, {
      '$sort': {
        'x.year': 1,
        'x.month': 1
      }
    }, {
      '$limit': 5000
    }
  ]
  if (user.role == 'supplier') {
    chart_query[0]['$match']['seller'] = mongoose.Types.ObjectId(user._id)
  }

  if (format == 'day') {
    chart_query[2]['$addFields']['__alias_0']['date'] = { '$dayOfMonth': '$createdAt' }
    chart_query[6]['$sort']['x.date'] = 1
  }

  let ordersChart = await Order.aggregate(chart_query).read("secondary");
  return { isSuccess: true, status: 200, data: ordersChart, message: 'Orders Chart' }

}


const videosMonthlyAnalytics = async (date, token) => {
  let payload = {}
  let options = {
    method: 'GET',
    url: `${streamingEndpoints.GET_MONTHLY_ANALYTICS}?date=${date}`,
    headers: {
      Authorization: token
    }
  }

  let data = await streamingUtils(payload, options)
  let result;
  if (data && data.isSuccess && data.data && data.data.isSuccess && data.data.data) {
    result = data.data.data
  }
  return result || undefined
}

const videosOverAllAnalytics = async (token) => {
  let payload = {}
  let options = {
    method: 'GET',
    url: streamingEndpoints.GET_OVERALL_ANALYTICS,
    headers: {
      Authorization: token
    }
  }

  let data = await streamingUtils(payload, options)
  let result;
  if (data && data.isSuccess && data.data && data.data.isSuccess && data.data.data) {
    result = data.data.data
  }
  console.log(data)
  return result || undefined
}

var dateHandler = function (date) {

  dt1 = new Date(date.getFullYear(), date.getMonth(), 1);
  dt2 = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  dt4 = new Date(date.getFullYear(), date.getMonth(), 0);
  dt3 = new Date(date.getFullYear(), date.getMonth() - 1, 1);

  let currDate = {
    startDate: dt1,
    endDate: dt2
  }
  let prevDate = {
    startDate: dt3,
    endDate: dt4
  }
  let topDate = {
    startDate: dt3,
    endDate: dt2
  }
  return {
    currDate,
    prevDate,
    topDate
  }

}



const revenue = async (query) => {
  let abondonedQuery = { ...query }
  const [result, abandoned, order] = await Promise.all([
    originRevenue(query),
    abondonedCart(abondonedQuery),
    totalOrders(query)
  ]);
  if (result.length > 0) {
    result[0].abandonedCart = abandoned;
    result[0].order = order
  }
  return result;
};

module.exports = {
  monthlyAnalytics,
  overallAnalytics,
  orderChart,
  revenue
}
