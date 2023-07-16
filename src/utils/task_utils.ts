import { type Task } from "@prisma/client"

export function sortTaskList(tasks: Task[] | undefined, sortOrder: string): Task[] | undefined {
  let sortFn: ((a: Task, b: Task) => number) | undefined = undefined
  switch (sortOrder) {
    case "priority":
      sortFn = (a, b) => {
        switch (a.priority) {
          case "LOW":
            return b.priority === "LOW" ? 0 : -1
          case "HIGH":
            return b.priority === "HIGH" ? 0 : 1
          case "MEDIUM":
            return b.priority === "MEDIUM" ? 0 : b.priority === "LOW" ? 1 : -1
        }
      }
      break

    case "createDate":
      sortFn = (a, b) => {
        const at = a.createdAt.getTime() 
        const bt = b.createdAt.getTime()
        return at < bt ? -1 : at > bt ? 1 : 0
      }
      break

    case "dueDate":
      sortFn = (a, b) => {
        const at = a.dueDate.getTime() 
        const bt = b.dueDate.getTime()
        return at < bt ? -1 : at > bt ? 1 : 0
      }
      break
  }

  // Array.prototype.toSorted is still too new
  return !tasks ? undefined : [...tasks].sort(sortFn)
}