const prisma = require('../config/dbConfig');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { USER_ROLES } = require('../constants');

exports.listUsers = asyncHandler(async (request, response) => {
  const search = String(request.query.search || '').trim();

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  response.json(new ApiResponse(200, { users }, 'Users loaded'));
});

exports.profile = asyncHandler(async (request, response) => {
  const profile = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  response.json(new ApiResponse(200, { profile }, 'Profile loaded'));
});

exports.promoteToAdmin = asyncHandler(async (request, response) => {
  const userId = request.params.userId;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: USER_ROLES.ADMIN },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  response.json(new ApiResponse(200, { user: updatedUser }, 'User promoted to admin'));
});