const permissions = {
    address: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        },
        {
            name: 'userManageAddress',
            label: 'User Manage Address',
            description: 'Allows the user to manage their own address information'
        }
    ],
    alfalPN: [
        {
            name: 'cardPayment',
            label: 'Card Payment',
            description: 'Grants access to process card payments'
        }
    ],
    aliexpress: [
        {
            name: 'manageToken',
            label: 'Manage AliExpress Token',
            description: 'Allows managing the API tokens for AliExpress integration'
        },
        {
            name: 'manageFeedSync',
            label: 'Manage Feed Sync',
            description: 'Enables synchronization of product feed with AliExpress'
        },
        {
            name: 'productImport',
            label: 'Product Import',
            description: 'Allows importing products from AliExpress to the platform'
        },
        {
            name: 'managePice',
            label: 'Manage Price',
            description: 'Allows managing and updating prices of imported products'
        },
    ],
    analytics: [
        {
            name: 'manageDashboard',
            label: 'Manage Dashboard',
            description: 'Grants access to view and manage the analytics dashboard'
        },
        {
            name: 'manageRevenue',
            label: 'Manage Revenue',
            description: 'Allows the user to manage and track revenue analytics'
        }
    ],
    banner: [
        {
            name: 'manageHomePage',
            label: 'Manage Home Page Banner',
            description: 'Grants access to manage banners displayed on the home page'
        }
    ],
    bannerSet: [
        {
            name: 'manageBannerSet',
            label: 'Manage Banner Set',
            description: 'Allows managing sets of banners across various pages'
        }
    ],
    bulkOperations: [
        {
            name: 'manageBulkOp',
            label: 'Manage Bulk Operations',
            description: 'Allows the user to perform bulk operations such as bulk import/export'
        }
    ],
    campaign: [
        {
            name: 'managePromotion',
            label: 'Manage Promotion',
            description: 'Allows the user to manage and create promotions'
        }
    ],
    cart: [
        {
            name: 'manageCart',
            label: 'Manage Cart',
            description: 'Allows the user to manage and update cart details'
        },
        {
            name: 'manageAdminCart',
            label: 'Manage Admin Cart',
            description: 'Allows the user to manage and update cart details'
        }
    ],
    catalog: [
        {
            name: 'manageCatalogs',
            label: 'Manage Catalogs',
            description: 'Allows the user to manage catalogs'
        }
    ],
    category: [
        {
            name: 'manageCategories',
            label: 'Manage Category',
            description: 'Allows the user to manage categories'
        },
        {
            name: 'videoCount',
            label: 'Video Count',
            description: 'Allows the user to manage video count'
        }
    ],
    // checkout: [],
    collection: [
        {
            name: 'manageCollections',
            label: 'Manage Collection',
            description: 'Allows the user to manage collections'
        }
    ],
    deals: [
        {
            name: 'manageDeals',
            label: 'Manage Deals',
            description: 'Allows the user to manage deals'
        }
    ],
    // dealTraces: [],
    // firebase: [],
    follow: [
        {
            name: 'follow',
            label: 'Manage Follow',
            description: 'Allows the user to manage follow'
        }
    ],
    googleAnalytics: [
        {
            name: 'manageGA',
            label: 'Manage Google Analytics',
            description: 'Allows the user to manage Google Analytics'
        }
    ],
    groupBuyCustomerTrack: [
        {
            name: 'getGroupBuy',
            label: 'Manage Group Buy Customer Track',
            description: 'Allows the user to manage Group Buy Customer Track'
        }
    ],
    groupBuyPriceTrace: [
        {
            name: 'manageData',
            label: 'Manage Group Buy Price Trace',
            description: 'Allows the user to manage Group Buy Price Trace'
        }
    ],
    groupBuy: [
        {
            name: 'manageGroupBuy',
            label: 'Manage Group Buy',
            description: 'Allows the user to manage Group Buy'
        }
    ],
    // lambda: [],
    logs: [
        {
            name: 'manageLogs',
            label: 'Manage Logs',
            description: 'Allows the user to manage logs'
        }
    ],
    market: [
        {
            name: 'manageMarket',
            label: 'Manage Market',
            description: 'Allows the user to manage markets'
        }
    ],
    marketplace: [
        {
            name: 'manageMarketplace',
            label: 'Manage Marketplace',
            description: 'Allows the user to manage marketplace'
        }
    ],
    // mybazaargar: [],
    notifications: [
        {
            name: 'notification',
            label: 'Manage Notifications',
            description: 'Allows the user to manage notifications'
        }
    ],
    order: [
        {
            name: 'manageOrders',
            label: 'Manage Order',
            description: 'Allows the user to manage orders'
        },
        {
            name: 'manageAllOrders',
            label: 'Manage All Orders',
            description: 'Allows the user to manage all orders'
        },
        {
            name: 'getOrders',
            label: 'Get Orders',
            description: 'Allows the user to get orders'
        },
        {
            name: 'getOrderTransaction',
            label: 'Get Order Transaction',
            description: 'Allows the user to get order transactions'
        }
    ],
    orderDetail: [
        {
            name: 'manageCart',
            label: 'Manage Cart',
            description: 'Allows the user to manage and update cart details'
        },
        {
            name: 'manageOrderDetails',
            label: 'Manage Order Details',
            description: 'Allows the user to manage order details'
        },
        {
            name: 'oderDetial',
            label: 'Oder Detial',
            description: 'Allows the user to manage order details'
        },
        {
            name: 'adminOrder',
            label: 'Admin Order',
            description: 'Allows the user to manage order details'
        }
    ],
    orderItem: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        }
    ],
    orderStatus: [
        {
            name: 'manageStatus',
            label: 'Manage Status',
            description: 'Allows the user to manage status'

        },
        {
            name: 'manageOrderStatus',
            label: 'Manage Order Status',
            description: 'Allows the user to manage order status'
        }
    ],
    package: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        }
    ],
    packageItem: [
        {
            name: 'manageAddress',
            label: 'Manage Address',
            description: 'Allows the user to manage and update address details'
        }
    ],
    pageConfig: [
        {
            name: 'managaPageConfig',
            label: 'Manage Page Config',
            description: 'Allows the user to manage Page Config'
        }
    ],
    payment: [
        {
            name: 'managePayments',
            label: 'Manage Payment',
            description: 'Allows the user to manage payments'
        },
        {
            name: 'cardPayment',
            label: 'Card Payment',
            description: 'Grants access to process card payments'
        }
    ],
    // paymentVerification: [],
    product: [
        {
            name: 'manageProducts',
            label: 'Manage Product',
            description: 'Allows the user to manage products'
        },
        {
            name: 'manageVector',
            label: 'Manage Vector',
            description: 'Allows the user to manage vectors'
        },
        {
            name: 'manageHomePage',
            label: 'Manage Home Page',
            description: 'Allows the user to manage home page'
        },
        {
            name: 'manageData',
            label: 'Manage Data',
            description: 'Allows the user to manage data'
        },
        {
            name: 'manageCurrency',
            label: 'Manage Currency',
            description: 'Allows the user to manage currency'
        },
        {
            name: 'manageCategoryLang',
            label: 'Manage Category Lang',
            description: 'Allows the user to manage category lang'
        },
        {
            name: 'csvUpload',
            label: 'CSV Upload',
            description: 'Allows the user to manage csv upload'
        },
        {
            name: 'manageVideoUpload',
            label: 'Manage Video Upload',
            description: 'Allows the user to manage video upload'
        },
        {
            name: 'manageAllProducts',
            label: 'Manage All Products',
            description: 'Allows the user to manage all products'
        },
        {
            name: 'updateSlug',
            label: 'Update Slug',
            description: 'Allows the user to update slug'
        }
    ],
    qAndA: [
        {
            name: 'manageQuestion',
            label: 'Manage Question',
            description: 'Allows the user to manage questions'
        },
        {
            name: 'manageAnswer',
            label: 'Manage Answer',
            description: 'Allows the user to manage answers'
        },
        {
            name: 'manageQa',
            label: 'Manage Qa',
            description: 'Allows the user to manage qa'
        }
    ],
    rbac: [
        {
            name: 'manageRoles',
            label: 'Manage Roles',
            description: 'Allows the user to manage roles'
        },
        {
            name: 'getPermissions',
            label: 'Get Permissions',
            description: 'Allows the user to get permissions'
        }
    ],
    redeemVoucher: [
        {
            name: 'manageVoucher',
            label: 'Manage Voucher',
            description: 'Allows the user to manage vouchers'
        }
    ],
    refund: [
        {
            name: 'manageRefund',
            label: 'Manage Refund',
            description: 'Allows the user to manage refunds'
        },
        {
            name: 'refund',
            label: 'Refund',
            description: 'Allows the user to manage refunds'
        }
    ],
    report: [
        {
            name: 'manageReport',
            label: 'Manage Report',
            description: 'Allows the user to manage reports'
        },
        {
            name: 'reportgeneration',
            label: 'Report Generation',
            description: 'Allows the user to generate reports'
        }
    ],
    review: [
        {
            name: 'manageReview',
            label: 'Manage Review',
            description: 'Allows the user to manage reviews'
        }
    ],
    // reviewStats: [],
    rrp: [
        {
            name: 'rrpManage',
            label: 'Rrp Manage',
            description: 'Allows the user to manage rrps'
        }
    ],
    sellerConfidentialDetail: [
        {
            name: 'manageSellerConfidentialDetail',
            label: 'Manage Seller Confidential Detail',
            description: 'Allows the user to manage seller confidential details'
        },
        {
            name: 'apiKey',
            label: 'Api Key',
            description: 'Allows the user to manage api keys'
        }
    ],
    sellerDetail: [
        {
            name: 'manageSellerDetail',
            label: 'Manage Seller Detail',
            description: 'Allows the user to manage seller details'
        },
        {
            name: 'manageStore',
            label: 'Manage Store',
            description: 'Allows the user to manage stores'
        },
        {
            name: 'manageData',
            label: 'Manage Data',
            description: 'Allows the user to manage data'
        }
    ],
    setting: [
        {
            name: 'manageSetting',
            label: 'Manage Setting',
            description: 'Allows the user to manage settings'
        }
    ],
    // shippementMethods: [],
    shippment: [
        {
            name: 'manageShippment',
            label: 'Manage Shippment',
            description: 'Allows the user to manage shippments'
        },
        {
            name: 'createShippment',
            label: 'Create Shippment',
            description: 'Allows the user to create shippments'
        },
        {
            name: 'print',
            label: 'Print',
            description: 'Allows the user to print'
        },
        {
            name: 'shippmentStatus',
            label: 'Shippment Status',
            description: 'Allows the user to manage shippment status'
        }
    ],
    // siteMap: [],
    socialToken: [
        {
            name: 'socialToken',
            label: 'Social Token',
            description: 'Allows the user to manage social tokens'
        }
    ],
    stats: [
        {
            name: 'manageVisitStats',
            label: 'Manage Visit Stats',
            description: 'Allows the user to manage visit stats'
        },
        {
            name: 'manageStats',
            label: 'Manage Stats',
            description: 'Allows the user to manage stats'
        }
    ],
    // streaming: [],
    // transaction: [],
    translation: [
        {
            name: 'manageTranslation',
            label: 'Manage Translation',
            description: 'Allows the user to manage translations'
        }
    ],
    user: [
        {
            name: 'manageUsers',
            label: 'Manage Users',
            description: 'Allows the user to manage users'
        },
        {
            name: 'getUsers',
            label: 'Get Users',
            description: 'Allows the user to get users'
        },
        {
            name: 'manageProfile',
            label: 'Manage Profile',
            description: 'Allows the user to manage profile'
        },
        {
            name: 'viewPhone',
            label: 'View Phone',
            description: 'Allows the user to view phone'
        },
        {
            name: 'managePin',
            label: 'Manage Pin',
            description: 'Allows the user to manage pin'
        },
        {
            name: 'validCode',
            label: 'Valid Code',
            description: 'Allows the user to valid code'
        },
        {
            name: 'manageStatus',
            label: 'Manage Status',
            description: 'Allows the user to manage status'
        },
        {
            name: 'changePassword',
            label: 'Change Password',
            description: 'Allows the user to change password'
        },
        {
            name: 'manageRefCode',
            label: 'Manage Ref Code',
            description: 'Allows the user to manage ref code'
        }
    ],
    voucher: [
        {
            name: 'manageVoucher',
            label: 'Manage Voucher',
            description: 'Allows the user to manage vouchers'
        },
        {
            name: 'voucher',
            label: 'Voucher',
            description: 'Allows the user to manage vouchers'
        }
    ],
    wallet: [
        {
            name: 'manageWallet',
            label: 'Manage Wallet',
            description: 'Allows the user to manage wallets'
        }
    ],
    wishList: [
        {
            name: 'manageWishList',
            label: 'Manage Wish List',
            description: 'Allows the user to manage wish lists'
        }
    ],
};

module.exports = permissions;
