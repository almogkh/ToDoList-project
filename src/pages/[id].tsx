import { Task } from "@prisma/client";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

function ListItem(props: {task: Task}) {
    const { task } = props

    const [complete, setComplete] = useState(task.completed)
    const [description, setDescription] = useState(task.description)

    const editTask = api.todolist.editTask.useMutation({
        onMutate({id, data}) {
            if (data.completed)
                setComplete(data.completed)
        }
    })
    const deleteTask = api.todolist.deleteTask.useMutation()

    return (
        <tr>
            <td><input
                type='checkbox'
                checked={complete}
                onChange={(e) => {
                    const checked = e.currentTarget.checked
                    editTask.mutate({
                        id: task.id,
                        data: { completed: checked },
                    });
                }} />
            </td>
            <td>
                <select 
                    name='priority'
                    onChange={(e) => {
                        editTask.mutate({
                            id: task.id,
                            data: { priority: e.currentTarget.value as Priority }
                        })
                }}>
                    <option value='LOW'>Low</option>
                    <option value='MEDIUM'>Medium</option>
                    <option value='HIGH'>High</option>
                </select>
            </td>
            <td>
                <input
                    type='text'
                    value={description}
                    onChange={(e) => {
                        setDescription(e.currentTarget.value)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            editTask.mutate({
                              id: task.id,
                              data: { description },
                            })
                          }
                    }} />
            </td>
            <td>
                <button
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

    const tasks = api.todolist.getTasks.useQuery(id)
    return (
        <table>
            <tbody>
                {tasks.data?.tasks.map((task) => ( <ListItem key={task.id} task={task}/>))}
            </tbody>
        </table>
    )
    
}