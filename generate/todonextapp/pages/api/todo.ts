// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {db} from '@/utils/db';
import type { NextApiRequest, NextApiResponse } from 'next'




export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { completed } = req.query;

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
          where: {
            completed: completed !== undefined ? completed === 'true' : undefined,
          },
          orderBy: {
            id: 'desc',
          },
        })
        // .then(todos => todos.map(todo => ({
        //   ...todo,
        //   upvoteCount: todo.votes.filter(vote => vote.value === 'UPVOTE').length,
        //   downvoteCount: todo.votes.filter(vote => vote.value === 'DOWNVOTE').length,
        // })))
        res.status(200).json(results);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    case 'POST':
      try {
        // const firstUser = await db.user.findFirstOrThrow();
        const { text, completed } = req.body;
        const result = await db.todo.create({
          data: {
            text,
            completed,
            // created_by_id: firstUser?.id,
          },
        });
        res.status(201).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    case 'PUT':
      try {
        const { id } = req.query;
        const { completed } = req.body;
        const result = await db.todo.update({
          where: {
            id: parseInt(id as string),
          },
          data: {
            completed,
          },
        });
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    case 'DELETE':
      try {
        const { id } = req.query;
        if (id) {
          await db.todo.delete({
            where: {
              id: parseInt(id as string),
            },
          })
        } else {
          await db.todo.deleteMany();
        }
        res.status(204).end();
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${method} Not Allowed` });
  }
}
