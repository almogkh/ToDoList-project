import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { Bar, BarChart, Cell, Label, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { api } from "~/utils/api";
import { LayoutContext } from "~/utils/contexts";

export default function Page() {
  const router = useRouter()
  const id = router.query.id as string

  const tasks = api.todolist.getTasks.useQuery(id)
  const dataBar = tasks.data?.tasks
    .filter((task) => !task.completed)
    .map((task, idx: number) => {
      let diff = task.dueDate.getTime() - new Date().getTime()
      diff = Number((diff / (1000 * 60 * 60 * 24)).toFixed(0))
      const data = { name: (idx + 1).toString(), value: diff, desc: task.description }
      if (diff >= 0)
        return { ...data, remaining: diff }
      else
        return { ...data, overdue: diff }
    })
  const dataPie = [
    { name: "Completed", value: 0 },
    { name: "Overdue", value: 0 },
    { name: "Pending", value: 0 }
  ]
  if (tasks.data) {
    for (const task of tasks.data?.tasks) {
      if (task.completed && dataPie[0])
        dataPie[0].value += 1
      else if (task.dueDate.getTime() < new Date().getTime() && dataPie[1])
        dataPie[1].value += 1
      else if (dataPie[2])
        dataPie[2].value += 1
    }
  }

  const {setMobileMenuContent} = useContext(LayoutContext)
  useEffect(() => {
    if (!setMobileMenuContent) return
    setMobileMenuContent((
      <>
        <li>
          <Link href={`/${id}`} className="hover:text-sky-500 dark:hover:text-sky-400">Return to TodoList</Link>
        </li>
      </>
    ))

    return () => {
      setMobileMenuContent(null)
    }
  }, [id, setMobileMenuContent])

  return (
    <>
      <Head>
        <title>Todo List</title>
        <meta name="description" content="A todo list to manage tasks" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col items-center">
        <Link href={`/${id}`} className="hidden lg:inline text-xl font-bold text-red-900 hover:text-red-800 dark:text-teal-400 dark:hover:text-teal-200">
          Return to ToDo list
        </Link>
        <h2 className="text-3xl">ToDo list statistics</h2>
        <div className="flex flex-col lg:flex-row place-content-center mt-6 w-full h-full gap-20">
          <ResponsiveContainer width={380} aspect={1}>
            <BarChart data={dataBar} width={400} height={300} >
              <XAxis dataKey="name" stroke="white">
                <Label value="Task number" position="insideBottom" offset={-5} stroke="white" />
              </XAxis>
              <YAxis stroke="white">
                <Label value="Days" position="insideLeft" offset={-6} stroke="white" />
              </YAxis>
              <ReferenceLine y={0} stroke="#fff" />
              <Tooltip />
              <Bar dataKey='remaining' fill='#40db3d' />
              <Bar dataKey='overdue' fill='#db3d3d' />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-4 items-center">
            <span className="text-lg">Task evaluation</span>
            <ResponsiveContainer width={380} aspect={1}>
              <PieChart width={400} height={400}>
                <Pie
                  dataKey="value"
                  data={dataPie}
                  label>
                  {dataPie.map((entry, idx) =>
                    <Cell key={`cell-${idx}`} fill={entry.name === 'Completed'
                      ? "#42d93d"
                      : entry.name === "Overdue"
                        ? "#d93d3f"
                        : "#cfcc17"} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}