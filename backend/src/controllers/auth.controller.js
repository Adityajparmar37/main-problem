const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const env = require('../config/env');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return error(res, 'Email already registered', 409);
  }

  const user = await User.create({ name, email, passwordHash: password });
  const token = generateToken(user._id);

  return success(res, { user, token }, 'Account created successfully', 201);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    return error(res, 'Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  // Don't send passwordHash
  const userObj = user.toJSON();

  return success(res, { user: userObj, token }, 'Login successful');
};

const getMe = async (req, res) => {
  return success(res, { user: req.user }, 'User fetched');
};

module.exports = { register, login, getMe };
