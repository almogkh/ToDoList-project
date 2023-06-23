import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import { LayoutContext } from '~/utils/contexts'
import useCollapsable from '~/utils/use-collapsable'

export default function Layout({ children }: React.PropsWithChildren) {
  const [darkMode, setDarkMode] = useState('auto')
  const isDarkMode = darkMode.startsWith('dark')

  const router = useRouter()

  const [mobileMenuContent, setMobileMenuContent] = useState<null | React.JSX.Element>(null)

  const [themeOpen, setThemeOpen] = useState(false)
  const [mobileShow, setMobileShow] = useState(false)

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

  const menuIcon = (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path className="stroke-slate-500 dark:stroke-current" strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>)


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
    const handleRouteChange = () => {
      setMobileShow(false)
    }

    router.events.on('routeChangeStart', handleRouteChange)

    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  const [themeRef, themeId] = useCollapsable<HTMLUListElement>(setThemeOpen)
  const [mobileMenuRef, mobileMenuId] = useCollapsable<HTMLDivElement>(setMobileShow)

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="relative flex flex-col items-center min-h-screen max-w-[100vw] lg:max-w-none overflow-hidden dark:text-white bg-gradient-to-b from-slate-300 to-slate-50 dark:from-slate-950 dark:to-slate-800">
        <div className={`${mobileShow ? 'backdrop-blur-sm backdrop-brightness-50' : 'invisible backdrop-blur-none backdrop-brightness-100'} transition-all absolute overflow-hidden inset-0 z-30`} />
        <div ref={mobileMenuRef} data-collapsable={mobileShow && 'open'} className={`fixed overflow-hidden w-full max-w-xs rounded-lg shadow-lg text-base font-semibold text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-400 dark:highlight-white/5 top-4 right-4 z-40 flex flex-col space-y-4 p-4 transition-transform ${!mobileShow ? 'translate-x-[200%]' : ''}`}>
          <ul className="space-y-6">
            {mobileMenuContent}
          </ul>

          <div className={`flex items-center justify-between ${mobileMenuContent !== null ? 'border-t mt-6 pt-6' : ''} border-slate-200 dark:border-slate-200/10`}>
            <span className="text-slate-700 font-normal dark:text-slate-400">Switch theme</span>
            <div className="relative flex items-center ring-1 ring-slate-900/10 rounded-lg shadow-sm p-2 text-slate-700 font-semibold dark:bg-slate-600 dark:ring-0 dark:highlight-white/5 dark:text-slate-200">
              {themeIcon}
              <span className="ml-3">
                {darkMode.endsWith('auto') ? 'System' : darkMode.startsWith('dark') ? 'Dark' : 'Light'}
              </span>
              <select className="absolute appearance-none inset-0 w-full h-full opacity-0" onChange={(e) => {
                if (e.target.value === 'system') {
                  localStorage.theme = 'auto'
                  setDarkMode(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-auto' : 'light-auto')
                } else if (e.target.value === 'dark') {
                  localStorage.theme = 'dark'
                  setDarkMode('dark')
                } else {
                  localStorage.theme = 'light'
                  setDarkMode('light')
                }
              }}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>

        <header className="relative flex border-b border-black dark:border-white lg:border-none justify-center lg:justify-between w-full mt-2 mb-6 lg:ml-6">
          <button type="button" data-id={mobileMenuId} onClick={() => setMobileShow(!mobileShow)} className="block lg:hidden absolute top-0 right-4">
            {menuIcon}
          </button>
          <button type="button" data-id={themeId} onClick={() => setThemeOpen(!themeOpen)} className='hidden lg:block p-2 rounded-full h-fit bg-slate-700'>
            {themeIcon}
          </button>
          <ul ref={themeRef} data-collapsable={themeOpen && "open"} className={`${themeOpen ? '' : 'hidden'} absolute z-50 top-full left-0 bg-white rounded-lg ring-1 ring-slate-900/10 shadow-lg overflow-hidden w-36 py-1 text-sm text-slate-700 font-semibold dark:bg-slate-800 dark:ring-0 dark:highlight-white/5 dark:text-slate-300`}>
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
          </ul>
          <Link href="/" className="text-4xl lg:text-6xl font-extrabold tracking-tight dark:text-white">
            ToDo List
          </Link>
          <span></span>
        </header>

        <main className="flex-1 max-w-full">
          <LayoutContext.Provider value={{setMobileMenuContent}}>
            {children}
          </LayoutContext.Provider>
        </main>

        <footer className="w-10/12 text-center my-5 border-t pt-2 border-black dark:border-white dark:text-white">
          <span>Created by Almog Khaikin, Nir Betesh and Ofek Malka</span>
        </footer>
      </div>
    </div>
  )
}