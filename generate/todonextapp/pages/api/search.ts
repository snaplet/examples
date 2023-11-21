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
      select: {
        id: true,
        text: true,
        completed: true,
        // votes: {
        //   select: {
        //     value: true,
        //   }
        // }
      },
      where: whereInput,
      take: limit,
      orderBy: {
        id: 'desc',
      }
    })
    // .then(todos => todos.map(todo => ({
    //   ...todo,
    //   upvoteCount: todo.votes.filter(vote => vote.value === 'UPVOTE').length,
    //   downvoteCount: todo.votes.filter(vote => vote.value === 'DOWNVOTE').length,
    // })))
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}