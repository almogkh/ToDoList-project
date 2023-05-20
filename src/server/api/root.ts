import { createTRPCRouter } from "~/server/api/trpc";
import { todolistRouter } from "~/server/api/routers/todolist";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  todolist: todolistRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
