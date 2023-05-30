import Link from 'next/link'
import React from 'react'

export default function Layout({children}: React.PropsWithChildren) {
    return (
        <div className="relative flex flex-col flex-nowrap items-center min-h-screen overflow-hidden text-white bg-gradient-to-b from-[#2e026d] to-[#15162c]">
            <header className="mt-2 mb-12">
                <Link href="/" className="text-6xl font-extrabold tracking-tight text-white">
                    ToDo List
                </Link>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="my-5 text-white">
                <span>Created by Almog Khaikin, Nir Betesh and Ofek Malka</span>
            </footer>
        </div>
    )
}