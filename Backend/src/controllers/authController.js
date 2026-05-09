const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/dbConfig');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { USER_ROLES } = require('../constants');

const authSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  adminKey: z.string().optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
});

const createToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

exports.signup = asyncHandler(async (request, response) => {
  const parsed = authSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || 'Invalid signup data');
  }

  const { name, email, password, adminKey } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ApiError(409, 'Email already in use');
  }

  let userRole = USER_ROLES.MEMBER;

  // Check if adminKey is provided and matches env
  if (adminKey && adminKey.trim() === process.env.AdminKey) {
    userRole = USER_ROLES.ADMIN;
  } else {
    // Fallback: first user is admin if no adminKey provided
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      userRole = USER_ROLES.ADMIN;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userRole,
    },
  });

  const token = createToken(user.id);

  response.status(201).json(
    new ApiResponse(201, {
      user: sanitizeUser(user),
      token,
    }, 'Account created'),
  );
});

exports.login = asyncHandler(async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || 'Invalid login data');
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = createToken(user.id);

  response.json(
    new ApiResponse(200, {
      user: sanitizeUser(user),
      token,
    }, 'Login successful'),
  );
});

exports.me = asyncHandler(async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  response.json(new ApiResponse(200, { user }, 'Current user loaded'));
});