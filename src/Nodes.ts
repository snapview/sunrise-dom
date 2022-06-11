import { map, Value } from '@snapview/sunrise'
import { Updater } from './Updaters/Constructors'

export interface Component<T extends Element> {
    readonly element: T
}

export function node<K extends keyof HTMLElementTagNameMap>(
    tag: K,
): (updaters: Updater<HTMLElementTagNameMap[K]>[]) => HTMLElementTagNameMap[K] {
    return function (updaters) {
        const element = document.createElement(tag)
        for (const updater of updaters) {
            updater(element)
        }
        return element
    }
}

export function wrap<T extends Element>(el: T): (updaters: Updater<T>[]) => Element {
    return function (updaters) {
        for (const updater of updaters) {
            updater(el)
        }
        return el
    }
}

// TODO: put `cell` as the first argument (like in Elm)
export function renderIf<T, E extends Node>(
    renderFunction: ((val: T) => E) | E,
    cell: Value<T | null>,
): E {
    const emptyNode = getEmptyNode() as E
    let el = emptyNode

    map((val) => {
        /*
         * In tests context, due to the async nature of cells, the document could not be undefined at the point of execution.
         * We don't currently have a way to release cells, so for now we just return and skip the rest of the function.
         */
        if (!document) return

        const newEl = val
            ? typeof renderFunction === 'function'
                ? renderFunction(val as T)
                : renderFunction
            : emptyNode
        el.parentElement?.replaceChild(newEl, el)
        el = newEl
    }, cell)

    return el
}

export const getEmptyNode: () => Node = () => document.createTextNode('')

export const div = node('div')
export const video = node('video')
export const select = node('select')
export const option = node('option')
export const button = node('button')
export const span = node('span')
export const img = node('img')
export const hr = node('hr')
export const br = node('br')
export const input = node('input')
export const textarea = node('textarea')
export const label = node('label')
export const ul = node('ul')
export const li = node('li')
export const b = node('b')
