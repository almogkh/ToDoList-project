import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  //const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const mut = api.todolist.createTodolist.useMutation();
  const router = useRouter()
  const handleCreate = async () => {
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            ToDo List
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <div
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20">
              <h3 className="text-2xl font-bold">Create a new ToDo List</h3>
              <div className="text-lg">
                If you don't have any ToDo lists yet or you want to create a new one, click here:
              </div>
              <button onClick={handleCreate} disabled={mut.isLoading}>Create new ToDo List</button>
            </div>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Documentation →</h3>
              <div className="text-lg">
                Learn more about Create T3 App, the libraries it uses, and how
                to deploy it.
              </div>
            </Link>
          </div>
          <p className="text-2xl text-white">
            {/*hello.data ? hello.data.greeting : "Loading tRPC query..."*/}
          </p>
        </div>
      </main>
    </>
  );
};

export default Home;
