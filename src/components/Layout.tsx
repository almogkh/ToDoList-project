import Link from 'next/link'
import React, { useState, useRef, useEffect } from 'react'

export default function Layout({ children }: React.PropsWithChildren) {
  const [darkMode, setDarkMode] = useState('auto')
  const isDarkMode = darkMode.startsWith('dark')

  const [themeOpen, setThemeOpen] = useState(false)
  const dialog = useRef<HTMLUListElement>(null)

  const auto = (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path className="stroke-sky-500 dark:stroke-current dark:fill-sky-500" strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>
  )
  const sun = (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path className="stroke-sky-500 dark:stroke-current dark:fill-sky-500" strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
  )
  const moon = (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path className="stroke-sky-500 dark:stroke-current dark:fill-sky-500" strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
  )

  const themeIcon = darkMode === 'light' ? sun :
    darkMode === 'dark' ? moon : auto

  useEffect(() => {
    let mode = ('theme' in localStorage) ? localStorage.theme as string : 'auto'
    const query = matchMedia('(prefers-color-scheme: dark)')
    if (mode === 'auto') {
      mode = query.matches ? 'dark-auto' : 'light-auto'
    }
    setDarkMode(mode)

    function handleChange(e: MediaQueryListEvent) {
      setDarkMode((curr) => {
        if (!curr.endsWith('auto'))
          return curr
        return e.matches ? 'dark-auto' : 'light-auto'
      })
    }
    query.addEventListener('change', handleChange)

    return () => {
      query.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!themeOpen)
      return
    
    function handleClick(e: MouseEvent) {
      if (!dialog.current?.contains(e.target as Node))
        setThemeOpen(false)
    }
    setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => {
      if (themeOpen)
        document.removeEventListener('click', handleClick)
    }
  }, [themeOpen])

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="relative flex flex-col flex-nowrap items-center min-h-screen overflow-hidden dark:text-white bg-gradient-to-b from-[#6705f0] to-[#7278eb] dark:from-[#2e026d] dark:to-[#15162c]">
        <header className="relative flex justify-between w-full mt-2 mb-12 ml-6">
          <button type="button" onClick={() => setThemeOpen((curr) => !curr)} className='p-2 rounded-full h-fit bg-slate-700'>
            {themeIcon}
          </button>
          {themeOpen && (<ul ref={dialog} className="absolute z-50 top-full left-0 bg-white rounded-lg ring-1 ring-slate-900/10 shadow-lg overflow-hidden w-36 py-1 text-sm text-slate-700 font-semibold dark:bg-slate-800 dark:ring-0 dark:highlight-white/5 dark:text-slate-300">
            <li
              onClick={() => {
                localStorage.theme = 'auto'
                setDarkMode(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-auto' : 'light-auto')
                setThemeOpen(false)
            }} 
              className="py-1 px-2 flex items-center cursor-pointer hover:bg-slate-50 hover:dark:bg-slate-600/30"
            >
              {auto}
              System
            </li>
            <li
              onClick={() => {
                localStorage.theme = 'light'
                setDarkMode('light')
                setThemeOpen(false)
              }}
              className="py-1 px-2 flex items-center cursor-pointer hover:bg-slate-50 hover:dark:bg-slate-600/30"
            >
              {sun}
              Light
            </li>
            <li
              onClick={() => {
                localStorage.theme = 'dark'
                setDarkMode('dark')
                setThemeOpen(false)
              }}
              className="py-1 px-2 flex items-center cursor-pointer hover:bg-slate-50 hover:dark:bg-slate-600/30"
            >
              {moon}
              Dark
            </li>
          </ul>)}
          <Link href="/" className="text-6xl font-extrabold tracking-tight dark:text-white">
            ToDo List
          </Link>
          <span></span>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="my-5 dark:text-white">
          <span>Created by Almog Khaikin, Nir Betesh and Ofek Malka</span>
        </footer>
      </div>
    </div>
  )
}