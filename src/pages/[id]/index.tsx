import { Task } from "@prisma/client";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import style from "~/styles/tasks.module.css"
import { flushSync } from "react-dom";

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

function ListItem(props: {task: Task, id: string}) {
    const { task, id } = props

    const [complete, setComplete] = useState(task.completed)
    const [description, setDescription] = useState(task.description)
    const [dueDate, setDueDate] = useState(task.dueDate)
    const [priority, setPriority] = useState(task.priority)
    const [editing, setEditing] = useState(false)

    const descRef = useRef<any>(null)

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
        onSettled() {
            utils.todolist.getTasks.invalidate(id)
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
        onSettled() {
            utils.todolist.getTasks.invalidate(id)
        }
    })

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!editing)
                return
            if (descRef.current && !descRef.current.contains(e.target)) {
                setEditing(false)
                const desc = descRef.current.value
                setDescription(desc)
                editTask.mutate({id: task.id, data: {description: desc}})
            }
        }
        document.addEventListener('mousedown', handleClick)
        if (editing)
            descRef.current.focus()
        return () => {document.removeEventListener('mousedown', handleClick)}
    }, [editing])

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
                        className="disabled:bg-white/50"
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
                    className="text-white border p-1 bg-slate-800 hover:bg-black"
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
    const list = useRef<HTMLTableSectionElement>(null)
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
        tasks.isLoading
        ? 'Loading...'
        : tasks.data === null ? 'Invalid todolist ID'
        : <>
            <button
                onClick={() => createTask.mutate(id)}
                className="mb-2 p-1 border bg-slate-800 hover:bg-black">
                    Create new task
            </button>
            <div className="border border-white h-[28rem] overflow-y-scroll">
                <table className={`text-black border-collapse border ${style.table}`}>
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
        </>
    )
    
}