import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react"

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const mut = api.todolist.createTodolist.useMutation();
  const router = useRouter()
  const [existingId, setExistingId] = useState('')
  const handleCreate = async () => {
    if (mut.isLoading)
      return
    const id = (await mut.mutateAsync()).id
    router.push(`/${id}`)
  }

  return (
    <>
      <Head>
        <title>Todo List</title>
        <meta name="description" content="A todo list to manage tasks" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 max-w-4xl">
          <div
            className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 cursor-pointer"
            onClick={handleCreate}>
            <h3 className="text-2xl font-bold">Create a new ToDo list</h3>
            <div className="text-lg">
              If you don't have any ToDo lists yet or you want to create a new one
            </div>
          </div>
          <div
            className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
            <h3 className="text-2xl font-bold">Existing ToDo list</h3>
            <div className="text-lg flex flex-col">
              Open an existing ToDo list by opening your saved URL or enter your ToDo list ID<br />
              <div className="space-x-4 self-center justify-center flex flex-nowrap w-full mt-4">
                <input
                  className="w-8/12 text-center text-black"
                  type="text"
                  value={existingId}
                  placeholder="6469157b303eb0c0f8820a32"
                  onChange={(e) => setExistingId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')
                      router.push(`/${existingId}`)
                  }} />
                <button
                  className="border border-white bg-slate-800 hover:bg-black disabled:bg-slate-800 py-1 px-3"
                  disabled={existingId === ''}
                  onClick={() => router.push(`/${existingId}`)}>
                    Open
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
