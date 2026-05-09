const prisma = require('../config/dbConfig');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { USER_ROLES, TASK_STATUSES } = require('../constants');

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

exports.getSummary = asyncHandler(async (request, response) => {
  const now = new Date();

  const [projects, tasks, overdueTasks, users] = await Promise.all([
    prisma.project.findMany({
      where: projectAccessClause(request.user),
      include: { _count: { select: { tasks: true, members: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.task.findMany({
      where: request.user.role === USER_ROLES.ADMIN
        ? {}
        : {
            OR: [
              { project: { ownerId: request.user.id } },
              { project: { members: { some: { userId: request.user.id } } } },
              { assigneeId: request.user.id },
            ],
          },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: [TASK_STATUSES.DONE, TASK_STATUSES.COMPLETED] },
        ...(request.user.role === USER_ROLES.ADMIN
          ? {}
          : {
              OR: [
                { project: { ownerId: request.user.id } },
                { project: { members: { some: { userId: request.user.id } } } },
                { assigneeId: request.user.id },
              ],
            }),
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const taskStats = tasks.reduce(
    (accumulator, task) => {
      accumulator.total += 1;
      accumulator[task.status] += 1;
      return accumulator;
    },
    { total: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0, COMPLETED: 0, BLOCKED: 0 },
  );

  response.json(new ApiResponse(200, {
    summary: {
      projects: projects.length,
      users: users.length,
      tasks: taskStats.total,
      todo: taskStats.TODO,
      inProgress: taskStats.IN_PROGRESS,
      done: taskStats.DONE,
      completed: taskStats.COMPLETED,
      blocked: taskStats.BLOCKED,
      overdue: overdueTasks.length,
    },
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      taskCount: project._count.tasks,
      memberCount: project._count.members,
    })),
    overdueTasks,
    recentTasks: tasks.slice(0, 6),
    teamMembers: users,
  }, 'Dashboard loaded'));
});