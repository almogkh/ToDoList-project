import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const todolistRouter = createTRPCRouter({
  createTodolist: publicProcedure
    .mutation(async ({ ctx }) => {
      const todolist = await ctx.prisma.todoList.create({data: {}})
      return {
        id: todolist.id,
      };
    }),
  getTasks: publicProcedure
  .input(z.string())
  .query(async ({ ctx, input }) => {
    try {
      return await ctx.prisma.todoList.findUnique({
        where: {
          id: input,
        },
        include: {
          tasks: true,
        },
      })
    } catch {
      return null
    }
  }),
  createTask: publicProcedure
  .input(z.string())
  .mutation(async ({ctx, input}) => {
    return await ctx.prisma.task.create({
      data: {
        TodoList: {
          connect: {
            id: input
          }
        }
      }
    })
  }),
  editTask: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          completed: z.boolean().optional(),
          description: z.string().optional(),
          dueDate: z.date().optional(),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input
      const todo = await ctx.prisma.task.update({
        where: { id },
        data,
      })
      return todo
    }),
    deleteTask: publicProcedure
      .input(z.string())
      .mutation(async ({ ctx, input }) => {
        const todo = await ctx.prisma.task.delete({
          where: {
            id: input
          }
        })
        return todo
      })
})
