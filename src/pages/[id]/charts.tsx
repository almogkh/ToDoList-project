import { useRouter } from "next/router";
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { api } from "~/utils/api";

export default function Page() {
    const router = useRouter()
    const id = router.query.id as string

    const tasks = api.todolist.getTasks.useQuery(id)
    const data = tasks.data?.tasks.map((task, idx) => {
        let diff = task.dueDate.getTime() - new Date().getTime()
        diff = Number((diff / (1000 * 60 * 60 * 24)).toFixed(0))
        const data = {name: '' + idx, value: diff, desc: task.description}
        if (diff >= 0)
            return {...data, remaining: diff}
        else
            return {...data, overdue: diff}
    })

    return (
        <div className="flex flex-col items-center">
            <h2>ToDo list statistics</h2>
            <div className="flex flex-row justify-center w-full h-full">
                <div className="w-full h-full">
                    <ResponsiveContainer width={500} height={400}>
                        <BarChart data={data} width={400} height={300} >
                            <XAxis dataKey="name" />
                            <YAxis />
                            <ReferenceLine y={0} stroke="#fff" />
                            <Tooltip />
                            <Bar dataKey='remaining' fill='#40db3d' />
                            <Bar dataKey='overdue' fill='#db3d3d' />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}