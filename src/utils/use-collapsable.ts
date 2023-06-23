import { useEffect, type RefObject, useRef, useId } from "react"

type Setter = (show: boolean) => void
type Handler<T extends HTMLElement> = {element: RefObject<T>, setter: Setter, id: string}

const collapsables: Handler<HTMLElement>[] = []

export default function useCollapsable<T extends HTMLElement>(setter: Setter,): [RefObject<T>, string] {
    const ref = useRef<T>(null)
    const id = useId()

    useEffect(() => {
        const handler = {element: ref, setter, id}
        collapsables.push(handler)

        return () => {
            const index = collapsables.indexOf(handler)
            if (index >= 0) {
                collapsables.splice(index, 1)
            }
        }
    }, [setter, id])

    return [ref, id]
}

if (typeof window !== "undefined") {
    document.addEventListener('click', (e) => {
        for (const handler of collapsables) {
            if (!handler.element.current) continue
            if (handler.element.current.dataset.collapsable !== 'open') continue
            if (!(e.target instanceof HTMLElement)) continue

            if (e.target.dataset.id !== handler.id && !handler.element.current.contains(e.target as Node)) {
                handler.setter(false)
            }
        }
    }, true)
}
