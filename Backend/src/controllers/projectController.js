const { z } = require('zod');
const prisma = require('../config/dbConfig');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { USER_ROLES, PROJECT_STATUSES } = require('../constants');

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

const memberSchema = z.object({
  email: z.string().trim().email(),
});

function projectAccessClause(user) {
  if (user.role === USER_ROLES.ADMIN) {
    return {};
  }

  return {
    OR: [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } },
    ],
  };
}

async function getProjectForUser(projectId, user) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessClause(user),
    },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      tasks: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true, email: true, role: true } },
          createdBy: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project;
}

function formatProject(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    ownerId: project.ownerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    owner: project.owner,
    members: project.members.map((member) => member.user),
    tasks: project.tasks,
  };
}

exports.listProjects = asyncHandler(async (request, response) => {
  const projects = await prisma.project.findMany({
    where: projectAccessClause(request.user),
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  response.json(new ApiResponse(200, { projects: projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    ownerId: project.ownerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    owner: project.owner,
    members: project.members.map((member) => member.user),
    taskCount: project._count.tasks,
    memberCount: project._count.members,
  })) }, 'Projects loaded'));
});

exports.createProject = asyncHandler(async (request, response) => {
  if (request.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can create projects');
  }

  const parsed = projectSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || 'Invalid project data');
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      ownerId: request.user.id,
      members: {
        create: [{ userId: request.user.id }],
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  response.status(201).json(new ApiResponse(201, { project: formatProject(project) }, 'Project created'));
});

exports.getProject = asyncHandler(async (request, response) => {
  const project = await getProjectForUser(request.params.projectId, request.user);
  response.json(new ApiResponse(200, { project: formatProject(project) }, 'Project loaded'));
});

exports.updateProject = asyncHandler(async (request, response) => {
  const project = await prisma.project.findUnique({
    where: { id: request.params.projectId },
    select: { id: true, ownerId: true, status: true },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.status === PROJECT_STATUSES.COMPLETED) {
    throw new ApiError(400, 'Completed projects cannot be modified');
  }

  if (request.user.role !== USER_ROLES.ADMIN && project.ownerId !== request.user.id) {
    throw new ApiError(403, 'Only project owners or admins can update this project');
  }

  const parsed = projectSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || 'Invalid project data');
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      tasks: true,
    },
  });

  response.json(new ApiResponse(200, { project: formatProject(updated) }, 'Project updated'));
});

exports.archiveProject = asyncHandler(async (request, response) => {
  const project = await prisma.project.findUnique({
    where: { id: request.params.projectId },
    select: { id: true, ownerId: true, status: true },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.status === PROJECT_STATUSES.COMPLETED) {
    throw new ApiError(400, 'Completed projects cannot be archived');
  }

  if (request.user.role !== USER_ROLES.ADMIN && project.ownerId !== request.user.id) {
    throw new ApiError(403, 'Only project owners or admins can archive this project');
  }

  const archived = await prisma.project.update({
    where: { id: project.id },
    data: { status: PROJECT_STATUSES.ARCHIVED },
  });

  response.json(new ApiResponse(200, { project: archived }, 'Project archived'));
});

exports.closeProject = asyncHandler(async (request, response) => {
  if (request.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can close projects');
  }

  const project = await prisma.project.findUnique({
    where: { id: request.params.projectId },
    select: { id: true, status: true },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.status !== PROJECT_STATUSES.ACTIVE) {
    throw new ApiError(400, 'Only active projects can be closed');
  }

  const closed = await prisma.project.update({
    where: { id: project.id },
    data: { status: PROJECT_STATUSES.COMPLETED },
  });

  response.json(new ApiResponse(200, { project: closed }, 'Project closed'));
});

exports.addProjectMember = asyncHandler(async (request, response) => {
  if (request.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can manage project members');
  }

  const parsed = memberSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || 'Invalid member data');
  }

  const project = await prisma.project.findUnique({ where: { id: request.params.projectId } });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.status === PROJECT_STATUSES.COMPLETED) {
    throw new ApiError(400, 'Cannot add members to completed projects');
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    update: {},
    create: { projectId: project.id, userId: user.id },
  });

  response.status(201).json(new ApiResponse(201, { member: user }, 'Member added to project'));
});

exports.removeProjectMember = asyncHandler(async (request, response) => {
  if (request.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can manage project members');
  }

  await prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId: request.params.projectId,
        userId: request.params.userId,
      },
    },
  });

  response.json(new ApiResponse(200, null, 'Member removed from project'));
});

exports.listProjectMembers = asyncHandler(async (request, response) => {
  const project = await getProjectForUser(request.params.projectId, request.user);

  response.json(new ApiResponse(200, { members: project.members.map((member) => member.user) }, 'Project members loaded'));
});