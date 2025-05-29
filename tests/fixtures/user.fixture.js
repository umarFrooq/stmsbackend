const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const faker = require('faker');

const db = require("../../config/mongoose");

const User = db.User;
const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
};

const userTwo = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
};
const userThree = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
};

const supplierOne = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'supplier',
};
const supplierTwo = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'supplier',
};

const admin = {
  _id: mongoose.Types.ObjectId(),
  fullname: faker.name.findName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
};

const adminTwo = {
  _id: mongoose.Types.ObjectId(),
  fullname: "Muhammad Mustafa",
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
};
const insertUsers = async (users) => {
  await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};

module.exports = {
  userOne,
  userTwo,
  userThree,
  supplierOne,
  supplierTwo,
  admin,
  adminTwo,
  insertUsers,
};
