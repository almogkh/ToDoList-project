import { type Task } from "@prisma/client";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { api } from "~/utils/api";
import { flushSync } from "react-dom";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import useCollapsable from "~/utils/use-collapsable";
import { LayoutContext } from "~/utils/contexts";
import { sortTaskList } from "~/utils/task_utils";

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

// An individual task in the task list
function ListItem(props: { task: Task, id: string, index: number, editMobile: (a: string, b: Date, callback: (a: string, b: Date) => void) => void }) {
  const { task, id, index, editMobile } = props

  const [complete, setComplete] = useState(task.completed)
  const [description, setDescription] = useState(task.description)
  const [dueDate, setDueDate] = useState(task.dueDate)
  const [priority, setPriority] = useState(task.priority)
  const [editing, setEditing] = useState(false)

  const descRef = useRef<HTMLInputElement>(null)

  const utils = api.useContext()

  const editTask = api.todolist.editTask.useMutation({
    async onMutate(data) {
      await utils.todolist.getTasks.cancel()
      const prevList = utils.todolist.getTasks.getData();
      utils.todolist.getTasks.setData(id, (oldData) => {
        if (oldData)
          return {
            ...oldData, tasks: oldData.tasks.map((taskM) => {
              if (taskM.id === task.id)
                return { ...taskM, ...data }
              else
                return taskM
            })
          }
        throw new Error('No old data')
      })
      return prevList
    },
    onError(err, vars, ctx) {
      utils.todolist.getTasks.setData(id, ctx)
    },
    async onSettled() {
      await utils.todolist.getTasks.invalidate(id)
    }
  })
  const deleteTask = api.todolist.deleteTask.useMutation({
    async onMutate(deletedTask) {
      await utils.todolist.getTasks.cancel()
      const prevList = utils.todolist.getTasks.getData(id)
      utils.todolist.getTasks.setData(id, (oldData) =>
        oldData
          ? { ...oldData, tasks: oldData.tasks.filter((taskF) => taskF.id !== deletedTask) }
          : { id, tasks: [] })
      return prevList
    },
    onError(err, vars, ctx) {
      utils.todolist.getTasks.setData(id, ctx)
    },
    async onSettled() {
      await utils.todolist.getTasks.invalidate(id)
    }
  })

  // Allow confirming the description change by simply clicking outside the textbox
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!editing)
        return
      if (descRef.current && !descRef.current.contains(e.target as Node)) {
        setEditing(false)
        const desc = descRef.current.value
        setDescription(desc)
        editTask.mutate({ id: task.id, data: { description: desc } })
      }
    }
    document.addEventListener('mousedown', handleClick)
    if (editing)
      descRef.current?.focus()
    return () => { document.removeEventListener('mousedown', handleClick) }
  }, [editing, editTask, task.id])

  const callback = (desc: string, date: Date) => {
    setDescription(desc)
    setDueDate(date)
    editTask.mutate({
      id: task.id,
      data: {
        description: desc,
        dueDate: date,
      }
    })
  }

  return (
    <tr>
      <td className="hidden md:table-cell text-black dark:text-white">{index}</td>
      <td><input
        type='checkbox'
        checked={complete}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          setComplete(checked)
          editTask.mutate({
            id: task.id,
            data: { completed: checked },
          });
        }} />
      </td>
      <td>
        <select
          value={priority}
          name='priority'
          className={priority === 'LOW' ? 'bg-green-500' :
            priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'}
          onChange={(e) => {
            setPriority(e.currentTarget.value as Priority)
            editTask.mutate({
              id: task.id,
              data: { priority: e.currentTarget.value as Priority }
            })
          }}>
          <option value='LOW' className="bg-green-500">Low</option>
          <option value='MEDIUM' className="bg-yellow-500">Medium</option>
          <option value='HIGH' className="bg-red-500">High</option>
        </select>
      </td>
      <td>
        <div onDoubleClick={() => { setEditing(true) }}>
          <input
            ref={descRef}
            className="border border-black dark:border-white disabled:bg-white/50 w-full md:w-64 lg:w-80 p-1 rounded-sm"
            type='text'
            disabled={!editing}
            autoFocus={editing}
            value={description}
            onChange={(e) => {
              setDescription(e.currentTarget.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditing(false)
                editTask.mutate({
                  id: task.id,
                  data: { description },
                })
              }
            }}
          />
        </div>
      </td>
      <td className="hidden sm:table-cell">
        <span className="text-black dark:text-white">
          {task.createdAt.toISOString().slice(0, 10)}
        </span>
      </td>
      <td className="hidden sm:table-cell">
        <input
          type="date"
          className="text-black dark:text-white"
          value={dueDate.toISOString().slice(0, 10)}
          onChange={(e) => {
            const dueDate = e.currentTarget.valueAsDate
            if (!dueDate)
              throw new Error("Invalid date")
            setDueDate(dueDate)
            editTask.mutate({ id: task.id, data: { dueDate } })
          }} />
      </td>
      <td>
        <div className="flex flex-row space-x-1 md:space-x-6 lg:space-x-0">
          <button type="button" className="inline lg:hidden" onClick={() => editMobile(description, dueDate, callback)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            className="dark:text-white lg:border border-black dark:border-white rounded-md lg:p-1 lg:bg-red-500 lg:hover:bg-red-600 lg:dark:bg-red-900 lg:dark:hover:bg-red-950"
            onClick={() => {
              deleteTask.mutate(task.id)
            }}>
            <span className="hidden lg:inline">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="lg:hidden w-6 h-6">
              <path className="stroke-red-800 dark:stroke-red-500" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function Page() {
  const router = useRouter()
  const id = router.query.id as string

  const utils = api.useContext()
  const tasks = api.todolist.getTasks.useQuery(id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [taskList, setTaskList] = useState(tasks.data)
  const [dialogShowing, setDialogShowing] = useState(false)
  const [filterCompleted, setFilterCompleted] = useState(false)
  const [sortOrder, setSortOrder] = useState("default")
  const [confirmationShowing, setConfirmationShowing] = useState(false)
  const setter = useCallback(() => {
    setDialogShowing(false)
    setConfirmationShowing(false)
  }, [])

  const list = useRef<HTMLTableSectionElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [innerRef, innerId] = useCollapsable<HTMLDivElement>(setter)

  const createTask = api.todolist.createTask.useMutation({
    onSuccess(data) {
      utils.todolist.getTasks.setData(id, (oldData) =>
        oldData
          ? { ...oldData, tasks: [...oldData.tasks, data] }
          : { id, tasks: [data] }
      )
      flushSync(() => setTaskList(utils.todolist.getTasks.getData(id)));
      (list.current?.lastChild as Element).scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  })

  const deleteAllTasks = api.todolist.deleteAllTasks.useMutation({
    onSuccess() {
      void utils.todolist.getTasks.invalidate(id)
    }
  })
  const deleteTodolist = api.todolist.deleteTodolist.useMutation({
    onSuccess() {
      void router.push('/')
    }
  })

  useEffect(() => {
    if (dialogShowing || confirmationShowing) {
      dialog.current?.showModal()
    } else {
      dialog.current?.close()
    }
  }, [dialogShowing, confirmationShowing])

  const { setMobileMenuContent } = useContext(LayoutContext)
  useEffect(() => {
    if (!setMobileMenuContent) return
    setMobileMenuContent((
      <>
        <li>
          <Link href={`/${id}/charts`} className="hover:text-sky-500 dark:hover:text-sky-400">View statistics</Link>
        </li>
        <li>
          <button type="button" onClick={() => setDialogShowing(true)} className="hover:text-sky-500 dark:hover:text-sky-400">View QR code</button>
        </li>
      </>
    ))

    return () => {
      setMobileMenuContent(null)
    }
  }, [id, setMobileMenuContent])

  const [editingMobile, setEditingMobile] = useState(false)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(new Date())
  const callbackRef = useRef<null | ((a: string, b: Date) => void)>(null)
  const callback = useCallback((desc: string, date: Date, callback: (a: string, b: Date) => void) => {
    setEditingMobile(true)
    setDescription(desc)
    setDueDate(date)
    callbackRef.current = callback
  }, [])

  let filteredTasks = tasks.data?.tasks
  if (filterCompleted) {
    filteredTasks = filteredTasks?.filter((task) => !task.completed)
  }

  const sortedTasks = sortTaskList(filteredTasks, sortOrder)

  return (
    <>
      <Head>
        <title>ToDo list</title>
      </Head>
      {tasks.isLoading
        ? 'Loading...'
        : tasks.data === null ? 'Invalid todolist ID'
          : <>
            <div className="hidden lg:flex flex-col items-center">
              <Link href={`/${id}/charts`} className="inline-flex gap-x-2 text-xl font-bold text-red-900 hover:text-red-800 dark:text-teal-400 dark:hover:text-teal-200">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                </svg>

                View ToDo list statistics
              </Link>
            </div>

            {editingMobile && (<div className="fixed flex place-content-center place-items-center inset-0 backdrop-blur-sm">
              <div className="flex flex-col w-10/12 justify-center space-y-8 p-6 rounded-lg shadow-lg text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-400">
                <input
                  type="text"
                  placeholder="Task description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                  }}
                  className="w-full p-1"
                />
                <input
                  type="date"
                  className="text-center text-black dark:text-white"
                  value={dueDate.toISOString().slice(0, 10)}
                  onChange={(e) => {
                    const dueDate = e.target.valueAsDate
                    if (!dueDate)
                      throw new Error("Invalid date")
                    setDueDate(dueDate)
                  }} 
                />
                <div className="flex place-content-center gap-16">
                  <button 
                    type='button' 
                    className="text-black dark:text-white bg-slate-200 dark:bg-slate-600"
                    onClick={() => {
                      if (callbackRef.current) {
                        callbackRef.current(description, dueDate)
                      }
                      setEditingMobile(false)
                    }}
                  >
                    Confirm
                  </button>
                  <button 
                    type='button' 
                    className="text-black dark:text-white bg-slate-200 dark:bg-slate-600"
                    onClick={() => {
                      setEditingMobile(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>)}

            <div className="flex flex-col w-[95vw] md:w-auto items-center lg:block mt-4">
              <dialog ref={dialog} className={`backdrop:backdrop-blur-[2px] p-0 rounded-md text-white border border-white ${confirmationShowing ? 'bg-transparent' : ''}`}>
                <div ref={innerRef} data-collapsable={(dialogShowing || confirmationShowing) && 'open'}>
                  {dialogShowing && (
                    <div>
                      <QRCodeSVG value={window.location.href} size={300} />
                    </div>)}
                  {confirmationShowing && (
                    <div className="flex flex-col m-0 p-6 w-max items-center gap-4 bg-slate-800 ">
                      <h1 className="font-bold">Are you sure you want to delete the ToDo list?</h1>
                      <div className="flex gap-4 justify-center items-center">
                        <button
                          className="border border-white p-2 rounded-md"
                          onClick={() => deleteTodolist.mutate(id)}>
                          Yes
                        </button>
                        <button
                          className="border border-white p-2 rounded-md"
                          onClick={() => setConfirmationShowing(false)}>
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </dialog>
              <div className="hidden lg:block absolute top-0 right-6 m-6">
                <button data-id={innerId} className="border border-black dark:border-white rounded-md p-4 flex gap-2 bg-slate-300 hover:bg-slate-500 dark:bg-slate-800 dark:hover:bg-black" onClick={() => setDialogShowing(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM6 6.75A.75.75 0 016.75 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75A.75.75 0 016 7.5v-.75zm9.75 0A.75.75 0 0116.5 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM6 16.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm9.75 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm-3 3a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75z" clipRule="evenodd" />
                  </svg>
                  Get QR code
                </button>
              </div>
              <div className="flex items-center space-x-8 lg:space-x-2 mb-2 pl-2 lg:pl-0 lg:ml-0 lg:mb-4 pb-3 w-11/12 lg:w-auto lg:pb-1 border-b border-black dark:border-white">
                <button
                  onClick={() => createTask.mutate(id)}
                  className="lg:mb-2 lg:py-1 lg:px-2 lg:border border-black dark:border-white rounded-md lg:bg-slate-300 hover:bg-slate-500 lg:dark:bg-slate-800 dark:hover:bg-black">
                  <span className="hidden lg:inline">Create new task</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="inline lg:hidden w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteAllTasks.mutate(id)}
                  className="lg:mb-2 lg:py-1 lg:px-2 lg:border border-black dark:border-white rounded-md lg:bg-slate-300 hover:bg-slate-500 lg:dark:bg-slate-800 dark:hover:bg-black">
                  <span className="hidden lg:inline">Clear task list</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="inline lg:hidden w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
                <button
                  data-id={innerId}
                  onClick={() => setConfirmationShowing(true)}
                  className="lg:mb-2 lg:py-1 lg:px-2 lg:border border-black dark:border-white rounded-md lg:bg-red-500 lg:hover:bg-red-600 lg:dark:bg-red-900 lg:dark:hover:bg-red-950">
                  <span className="hidden lg:inline">Delete ToDo list</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="inline lg:hidden w-8 h-8">
                    <path className="stroke-red-800 dark:stroke-red-500" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row">
                  <div className="ml-4">
                    <div onClick={() => setFilterCompleted(!filterCompleted)}>
                      <input className="mr-2" type="checkbox" checked={filterCompleted} />
                      <label className="md:text-lg">Filter completed tasks</label>
                    </div>
                  </div>
                  <div className="space-x-4">
                    <label className="ml-4">Sort</label>
                    <select onChange={(e) => setSortOrder(e.target.value)}>
                      <option value="default">Default</option>
                      <option value="priority">Priority</option>
                      <option value="createDate">Creation Date</option>
                      <option value="dueDate">Due Date</option>
                    </select>
                  </div>
                </div>
              </div>
              <table className="text-black w-full lg:w-auto lg:ml-0 dark:text-white border-collapse lg:border">
                <thead className="hidden lg:table-header-group">
                  <tr className="lg:p-10">
                    <th>#</th>
                    <th>Completed</th>
                    <th>Priority</th>
                    <th>Task description</th>
                    <th>Creation date</th>
                    <th>Due date</th>
                    <th>Delete task</th>
                  </tr>
                </thead>
                <tbody ref={list}>
                  {sortedTasks?.map((task, idx) => (<ListItem key={task.id} task={task} id={id} index={idx + 1} editMobile={callback} />))}
                </tbody>
              </table>
            </div>
          </>}
    </>
  )

}