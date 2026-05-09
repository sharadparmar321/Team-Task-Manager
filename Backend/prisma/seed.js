const { PrismaClient, Role, ProjectStatus, TaskStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const memberPassword = await bcrypt.hash('Member123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@teamtask.local' },
    update: { name: 'Admin User', role: Role.ADMIN },
    create: {
      name: 'Admin User',
      email: 'admin@teamtask.local',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@teamtask.local' },
    update: { name: 'Team Member', role: Role.MEMBER },
    create: {
      name: 'Team Member',
      email: 'member@teamtask.local',
      password: memberPassword,
      role: Role.MEMBER,
    },
  });

  let project = await prisma.project.findFirst({
    where: {
      name: 'Launch Dashboard',
      ownerId: admin.id,
    },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Launch Dashboard',
        description: 'Seed project for the team task manager.',
        ownerId: admin.id,
        status: ProjectStatus.ACTIVE,
      },
    });
  }

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member.id } },
    update: {},
    create: { projectId: project.id, userId: member.id },
  });

  await prisma.task.deleteMany({
    where: { projectId: project.id },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Design onboarding flow',
        description: 'Map auth screens and dashboard entry points.',
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        projectId: project.id,
        assigneeId: member.id,
        createdById: admin.id,
      },
      {
        title: 'Set up RBAC middleware',
        description: 'Lock down admin-only routes and task edits.',
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        projectId: project.id,
        assigneeId: admin.id,
        createdById: admin.id,
      },
    ],
  });

  console.log('Seeded demo users and project.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });