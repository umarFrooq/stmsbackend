// const roles = ['user', 'admin', 'supplier', 'requestedSeller', 'marketplace', 'student', 'teacher', 'staff', 'admin_education'];

const roles = ['student', 'teacher', 'admin',  'supperAdmin'];

const roleRights = new Map();
roleRights.set(roles[0], [
  "manageProfile", 'manageReview', 'manageCart', "viewPhone", "getGroupBuy",
  'manageWishList', 'manageAddress', "managePayment", "manageVideo", "follow", "shippmentStatus",
  "changePassword", "firebaseToken",  "manageWallet", "refund", "voucher", "pushNotification","cardPayment",
"manageQuestion","validCode","manageStatus","manageOrderStatus", "CardInfo", "transaction","oderDetial"]);
roleRights.set(roles[1], [
  'getUsers', 'manageUsers', "manageVisitStats","manageRoles","manageQa",
  'manageCategories', 'manageProducts', "viewPhone", "manageProfile", "manageMarket",
  "manageOrderDetails", "manageOrders", "manageAllOrders", "getOrders", "manageHomePage", "manageSellerConfidentialDetails",
  "manageSellerDetail", "manageOrderStatuses", "manageStats", "changePassword", "manageShippment", "createShippment", "manageVideo", "shippmentStatus", "manageBannerSet",
  "firebaseToken", 'manageReview', "manageOrderStatus", "manageData", "manageCart", 'userManageAddress', "manageAdminCart", "manageOrderDetail", "manageRefCode", "rrpManage",
  "manageFirebase", "manageWallet", "refund", "manageRefund", "manageVoucher", "manageGroupBuy", "manageLogs", "print", "manageSiteMap", "adminOrder", "manageAllProducts",
  "pushNotification","manageDeals",  "pushNotification", "getOrderTransaction", "updateSlug", "manageCollections","manageBulkOp","manageSeller","manageDashboard","manageGA","manageTranslation",
  "manageStore","manageReport","productImport","manageSetting","socialToken","managePromotion","manageVector","manageCurrency","manageToken","manageFeedSync","manageVideoUpload", "videoCount","manageRevenue","manageStatus",  "apiKey",
  "manageTransaction","attendanceManagement","testManagement","testResultManagement"
]);

roleRights.set(roles[2], [
  "reportgeneration", "manageProfile", 'manageProducts', 'manageAddress', "createShippment", "viewPhone", "manageStats",

  "manageOrders", "getOrders", "manageSellerDetail", "subjectManagement", "manageVideo", "manageSellerConfidentialDetail", "print", "notification"
  , "firebaseToken", "changePassword", "csvUpload",
  , "firebaseToken", "changePassword", "csvUpload", "manageRefund", "refund", "userManageAddress",  "pushNotification","manageAnswer", "manageSeller", "manageDashboard", "manageTranslation", "manageStatus",
<<<<<<< Updated upstream
"manageAnswer","manageCurrency","manageToken","manageFeedSync","videoCount","apiKey","manageShopify","premium","sellerSetting",
"gradeManagement","attendanceManagement","testManagement","testResultManagement","getUsers"
=======
"manageAnswer","manageCurrency","manageToken","manageFeedSync","videoCount","apiKey","manageShopify","premium","sellerSetting","getUsers",
"gradeManagement","attendanceManagement","testManagement","testResultManagement","manageUser"
>>>>>>> Stashed changes
]);

roleRights.set(roles[3], [
  "manageProfile", 'manageAddress', "manageSellerDetail", "viewPhone",
  , "manageVideo", "manageSellerConfidentialDetail", "changePassword",  "notification", "firebaseToken","manageSeller",
  "manageTranslation", "manageUser", "getUsers", "manageUsers", "manageBranches","subjectManagement","gradeManagement","attendanceManagement",
  "testManagement","testResultManagement"
]);
// roleRights.set(roles[4], [
//   "marketplace", "manageSellerDetail","apiKey"
// ])
module.exports = {
  roles,
  roleRights,
};
