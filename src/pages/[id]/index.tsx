import { type Task } from "@prisma/client";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import style from "~/styles/tasks.module.css"
import { flushSync } from "react-dom";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

function ListItem(props: {task: Task, id: string}) {
    const { task, id } = props

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
                    return {...oldData, tasks: oldData.tasks.map((taskM) => {
                        if (taskM.id === task.id)
                            return {...taskM, ...data}
                        else
                            return taskM
                    })}
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
            ? {...oldData, tasks: oldData.tasks.filter((taskF) => taskF.id !== deletedTask)}
            : {id, tasks: []})
            return prevList
        },
        onError(err, vars, ctx) {
            utils.todolist.getTasks.setData(id, ctx)
        },
        async onSettled() {
            await utils.todolist.getTasks.invalidate(id)
        }
    })

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!editing)
                return
            if (descRef.current && !descRef.current.contains(e.target as Node)) {
                setEditing(false)
                const desc = descRef.current.value
                setDescription(desc)
                editTask.mutate({id: task.id, data: {description: desc}})
            }
        }
        document.addEventListener('mousedown', handleClick)
        if (editing)
            descRef.current?.focus()
        return () => {document.removeEventListener('mousedown', handleClick)}
    }, [editing, editTask, task.id])

    return (
        <tr>
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
                <div onDoubleClick={() => {setEditing(true)}}>
                    <input
                        ref={descRef}
                        className="disabled:bg-white/50 w-80"
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
                        }} />
                    </div>
            </td>
            <td>
                <span className="text-white">
                    {task.createdAt.toISOString().slice(0, 10)}
                </span>
            </td>
            <td>
                <input
                    type="date"
                    value={dueDate.toISOString().slice(0, 10)}
                    onChange={(e) => {
                        const dueDate = e.currentTarget.valueAsDate
                        if (!dueDate)
                            throw new Error("Invalid date")
                        setDueDate(dueDate)
                        editTask.mutate({id: task.id, data: {dueDate}})
                    }} />
            </td>
            <td>
                <button
                    className="text-white border rounded-md p-1 bg-red-900 hover:bg-red-950"
                    onClick={() => {
                        deleteTask.mutate(task.id)
                    }}>
                        Delete
                </button>
            </td>
        </tr>
    )
}

export default function Page() {
    const router = useRouter()
    const id = router.query.id as string

    const utils = api.useContext()
    const tasks = api.todolist.getTasks.useQuery(id)
    const [taskList, setTaskList] = useState(tasks.data)
    const [dialogShowing, setDialogShowing] = useState(false)

    const list = useRef<HTMLTableSectionElement>(null)
    const dialogRef = useRef<HTMLDialogElement>(null)
    const innerDiv = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!innerDiv.current?.contains(e.target as Node))
                setDialogShowing(false)
        }
        if (dialogShowing) {
            dialogRef.current?.showModal()
            setTimeout(() => document.addEventListener('click', handleClick), 0)
        }
        else {
            dialogRef.current?.close()
        }

        return () => {
            if (dialogShowing)
                document.removeEventListener('click', handleClick)
        }
    }, [dialogShowing])

    const createTask = api.todolist.createTask.useMutation({
        onSuccess(data) {
            utils.todolist.getTasks.setData(id, (oldData) => 
                oldData
                ? {...oldData, tasks: [...oldData.tasks, data]}
                : {id, tasks: [data]}
            )
            flushSync(() => setTaskList(utils.todolist.getTasks.getData(id)));
            (list.current?.lastChild as Element).scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    })
    
    return (
        <>
        <Head>
            <title>ToDo list</title>
        </Head>
        {tasks.isLoading
        ? 'Loading...'
        : tasks.data === null ? 'Invalid todolist ID'
        : <>
        <div className="flex flex-col items-center -mt-4 text-xl font-bold text-teal-400 hover:text-teal-200">
            <Link href={`/${id}/charts`} className="inline-flex gap-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
  <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
</svg>

                View ToDo list statistics
            </Link>
        </div>
        <div>
            <dialog ref={dialogRef} className="backdrop:backdrop-blur-[2px]">
                <div ref={innerDiv}>
                    <QRCodeSVG value={window.location.href} size={300} />
                </div>
            </dialog>
            <div className="absolute top-0 right-0 m-6">
                <button className="border border-white rounded-md p-4 flex gap-2 bg-slate-900 hover:bg-slate-700" onClick={() => setDialogShowing(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
  <path fillRule="evenodd" d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM6 6.75A.75.75 0 016.75 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75A.75.75 0 016 7.5v-.75zm9.75 0A.75.75 0 0116.5 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM6 16.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm9.75 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm-3 3a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75z" clipRule="evenodd" />
</svg>
                    Get QR code
                </button>
            </div>
            <button
                onClick={() => createTask.mutate(id)}
                className="mb-2 py-1 px-2 border rounded-md bg-slate-800 hover:bg-black">
                    Create new task
            </button>
            <div className="border border-white rounded-md h-[29rem] overflow-y-scroll">
                <table className={`text-black border-collapse border ${style.table as string}`}>
                    <thead className="text-white">
                        <tr className=" p-10">
                            <th>Completed</th>
                            <th>Priority</th>
                            <th>Task description</th>
                            <th>Creation date</th>
                            <th>Due date</th>
                            <th>Delete task</th>
                        </tr>
                    </thead>
                    <tbody ref={list}>
                        {tasks.data?.tasks.map((task) => ( <ListItem key={task.id} task={task} id={id}/>))}
                    </tbody>
                </table>
            </div>
        </div>
        </>}
        </>
    )
    
}