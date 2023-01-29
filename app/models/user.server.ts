import type { Password, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prisma } from '~/db.server';

export type { User } from '@prisma/client';

export const getUserById = async (id: User['id']) => {
  return prisma.user.findUnique({ where: { id } });
};

export const getUserByName = async (name: User['name']) => {
  return prisma.user.findUnique({ where: { name } });
};

export const createUser = async (name: User['name'], password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
};

export const deleteUserByName = async (name: User['name']) => {
  return prisma.user.delete({ where: { name } });
};

export const verifyLogin = async (name: User['name'], password: Password['hash']) => {
  const userWithPassword = await prisma.user.findUnique({
    where: { name },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password.hash);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
};
