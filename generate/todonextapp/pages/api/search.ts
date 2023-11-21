import { db } from '@/utils/db';
import { ErrorMessage, TodoItem } from '@/utils/types';
import { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = TodoItem[] | ErrorMessage;

type TodoWhereParams = Prisma.todoWhereInput

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const { search, completed, size } = req.query;
    const whereInput: TodoWhereParams = {};
    const limit = size ? parseInt(size as string) : undefined;

    if (search) {
      whereInput.text = { contains: search as string };
    }

    if (completed) {
      whereInput.completed = { equals: completed === 'true' };
    }

    const results = await db.todo.findMany({
      where: whereInput,
      take: limit,
      orderBy: {
        id: 'desc',
      }
    });
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}