const { z } = require('zod');
const prisma = require('../config/dbConfig');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { USER_ROLES, TASK_STATUSES } = require('../constants');

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id format');

const taskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  projectId: objectIdSchema,
  assigneeId: objectIdSchema.optional().or(z.literal('')),
  dueDate: z.string().datetime().optional().or(z.literal('')),
  status: z.enum(Object.values(TASK_STATUSES)).optional(),
});

const taskUpdateSchema = taskSchema.partial();

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

async function ensureProjectAccess(projectId, user) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ...projectAccessClause(user),
    },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project;
}

function taskInclude() {
  return {
    project: { select: { id: true, name: true, status: true } },
    assignee: { select: { id: true, name: true, email: true, role: true } },
    createdBy: { select: { id: true, name: true, email: true, role: true } },
  };
}

function isTaskOverdue(task) {
  return Boolean(
    task.dueDate
    && new Date(task.dueDate).getTime() < Date.now()
    && task.status !== TASK_STATUSES.DONE
    && task.status !== TASK_STATUSES.COMPLETED,
  );
}

exports.listTasks = asyncHandler(async (request, response) => {
  const { projectId, status, overdue, assigneeId } = request.query;
  const where = request.user.role === USER_ROLES.ADMIN
    ? {}
    : {
        OR: [
          { project: { ownerId: request.user.id } },
          { project: { members: { some: { userId: request.user.id } } } },
          { assigneeId: request.user.id },
        ],
      };

  if (projectId) {
    where.projectId = String(projectId);
  }

  if (status) {
    where.status = String(status);
  }

  if (assigneeId) {
    where.assigneeId = String(assigneeId);
  }

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude(),
    orderBy: { updatedAt: 'desc' },
  });

  const filtered = String(overdue || '').toLowerCase() === 'true'
    ? tasks.filter(isTaskOverdue)
    : tasks;

  response.json(new ApiResponse(200, { tasks: filtered }, 'Tasks loaded'));
});

exports.createTask = asyncHandler(async (request, response) => {
  if (request.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can create tasks');
  }

  const parsed = taskSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || 'Invalid task data');
  }

  await ensureProjectAccess(parsed.data.projectId, request.user);

  if (parsed.data.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assigneeId } });
    if (!assignee) {
      throw new ApiError(404, 'Assignee not found');
    }
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      projectId: parsed.data.projectId,
      assigneeId: parsed.data.assigneeId || null,
      createdById: request.user.id,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      status: parsed.data.status || TASK_STATUSES.TODO,
    },
    include: taskInclude(),
  });

  response.status(201).json(new ApiResponse(201, { task }, 'Task created'));
});

exports.updateTask = asyncHandler(async (request, response) => {
  const task = await prisma.task.findUnique({ where: { id: request.params.taskId } });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const hasAdminAccess = request.user.role === USER_ROLES.ADMIN;
  const ownsProject = await prisma.project.findFirst({
    where: {
      id: task.projectId,
      ownerId: request.user.id,
    },
  });

  if (!hasAdminAccess && !ownsProject) {
    throw new ApiError(403, 'Only admins or project owners can update tasks');
  }

  const parsed = taskUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || 'Invalid task data');
  }

  if (parsed.data.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assigneeId } });
    if (!assignee) {
      throw new ApiError(404, 'Assignee not found');
    }
  }

  if (parsed.data.status === TASK_STATUSES.COMPLETED && task.status !== TASK_STATUSES.DONE && task.status !== TASK_STATUSES.COMPLETED) {
    throw new ApiError(400, 'Completed tasks must be closed from Done tasks');
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      title: parsed.data.title ?? undefined,
      description: parsed.data.description === '' ? null : parsed.data.description ?? undefined,
      projectId: parsed.data.projectId ?? undefined,
      assigneeId: parsed.data.assigneeId === '' ? null : parsed.data.assigneeId ?? undefined,
      dueDate: parsed.data.dueDate === '' ? null : parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      status: parsed.data.status ?? undefined,
    },
    include: taskInclude(),
  });

  response.json(new ApiResponse(200, { task: updated }, 'Task updated'));
});

exports.updateTaskStatus = asyncHandler(async (request, response) => {
  const { status } = z.object({ status: z.enum(Object.values(TASK_STATUSES)) }).parse(request.body);

  const task = await prisma.task.findUnique({ where: { id: request.params.taskId } });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const canEdit = request.user.role === USER_ROLES.ADMIN || task.assigneeId === request.user.id;

  if (!canEdit) {
    throw new ApiError(403, 'You can only update status for your assigned tasks');
  }

  if (status === TASK_STATUSES.COMPLETED) {
    if (request.user.role !== USER_ROLES.ADMIN) {
      throw new ApiError(403, 'Only administrators can close tasks');
    }

    if (task.status !== TASK_STATUSES.DONE && task.status !== TASK_STATUSES.COMPLETED) {
      throw new ApiError(400, 'Only Done tasks can be marked as completed');
    }
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status },
    include: taskInclude(),
  });

  response.json(new ApiResponse(200, { task: updated }, 'Task status updated'));
});

exports.deleteTask = asyncHandler(async (request, response) => {
  const task = await prisma.task.findUnique({ where: { id: request.params.taskId } });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (request.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can delete tasks');
  }

  await prisma.task.delete({ where: { id: task.id } });

  response.json(new ApiResponse(200, null, 'Task deleted'));
});