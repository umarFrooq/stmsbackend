// const roles = ['user', 'admin', 'supplier', 'requestedSeller', 'marketplace', 'student', 'teacher', 'staff', 'admin_education'];

// Using 'superadmin' for consistency with the request, and adding 'rootUser'.
const roles = ['student', 'teacher', 'admin', 'superadmin', 'rootUser'];

const roleRights = new Map();
roleRights.set(roles[0], [ // student
  "manageProfile", 'manageReview', 'manageCart', "viewPhone", "getGroupBuy",
  'manageWishList', 'manageAddress', "managePayment", "manageVideo", "follow", "shippmentStatus",
  "changePassword", "firebaseToken",  "manageWallet", "refund", "voucher", "pushNotification","cardPayment",
"manageQuestion","validCode","manageStatus","manageOrderStatus", "CardInfo", "transaction","oderDetial"]);

roleRights.set(roles[1], [ // teacher
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

roleRights.set(roles[2], [ // admin
  "reportgeneration", "manageProfile", 'manageProducts', 'manageAddress', "createShippment", "viewPhone", "manageStats",
  "manageOrders", "getOrders", "manageSellerDetail", "subjectManagement", "manageVideo", "manageSellerConfidentialDetail", "print", "notification",
  "firebaseToken", "changePassword", "csvUpload", "manageRefund", "refund", "userManageAddress",  "pushNotification","manageAnswer", "manageSeller", "manageDashboard", "manageTranslation", "manageStatus",
  "manageAnswer","manageCurrency","manageToken","manageFeedSync","videoCount","apiKey","manageShopify","premium","sellerSetting","getUsers",
  "gradeManagement","attendanceManagement","testManagement","testResultManagement","manageUser","manageUsers"
]);

roleRights.set(roles[3], [ // superadmin (school-level admin)
  // Profile & Basic School Details
  "manageProfile",
  "manageOwnSchoolDetails", // General config for their own school
  // User Management within their school
  "manageSchoolUsers", // Covers creating/updating/deleting teachers, students, staff within their school
  "viewSchoolUsers",   // Covers listing users within their school
  // Branch Management (within their school)
  "manageBranches",
  "viewBranches",
  // Academic Configuration
  "manageGrades", "viewGrades",
  "manageSubjects", "viewSubjects", // Assuming subjectManagement covers this
  "manageTimetables", "viewTimetables",
  // Academic Operations
  "manageAttendances", "viewAttendances",
  "manageTests", "viewTests",
  "manageTestResults", "viewTestResults",
  "managePapers", "viewPapers", // For exam papers etc.
  // Financial Management
  "manageFees", "viewFees",
  "manageFines", "viewFines",
  "manageSchoolBilling",
  // Other specific permissions previously assigned
  'manageAddress', // If superadmin manages addresses related to school/users
  "manageSellerDetail", "viewPhone", // These seem less relevant for SMS superadmin, might be from copy-paste
  "manageVideo", "manageSellerConfidentialDetail", // ^ same
  "changePassword",  "notification", "firebaseToken","manageSeller", // ^ same
  "manageTranslation", // ^ same
  "gradeManagement", // Covered by manageGrades
  "attendanceManagement", // Covered by manageAttendances
  "testManagement", // Covered by manageTests
  "testResultManagement" // Covered by manageTestResults
  // "manageUser", "getUsers", "manageUsers", // Replaced by manageSchoolUsers, viewSchoolUsers for clarity
]);

roleRights.set(roles[4], [ // rootUser
  "manageSchools", // Full CRUD on school entities
  "manageAllUsers", // Typically a root user can manage any user
  "viewSystemAnalytics", // Example permission
  "manageSystemSettings" // Example permission
]);
module.exports = {
  roles,
  roleRights,
};
