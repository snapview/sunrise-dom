/**
 * @fileoverview This module includes helpers to work with HTML elements.
 *
 * Example usage:
 * @example
 * div([
 *     className('hello-there'),
 *     children([
 *         div([className('just-a-div')]),
 *         span([className('just-a-span')]),
 *     ]),
 * ])
 *
 * @example
 * const indexTest = cell(0)
 *
 * div([
 *     className('hello-there'),
 *     children([
 *         button([
 *             text('increase!'),
 *             onClick(() => swap(ind => ind + 1, indexTest)),
 *         ]),
 *         Cell.map(ind => div([text(ind)]), indexTest),
 *     ]),
 * ])
 */
import { formula, history, Value } from '@snapview/sunrise'
import type * as CSS from 'csstype'

/**
 * Property is just a mutable transformation over HTMLElement
 * This property doesn't have any relationships with HTML properties,
 * it can set HTML attribute, property, attach handler or do any other
 * sort of effects
 */
export type Property<T extends HTMLElement> = (element: T) => void

export type ReactiveNode = Value<Node>
export type Children = Value<ReactiveNode[]>

export type PropertyWithToString<E extends HTMLElement> = <S extends { toString: () => string }>(
    withToString: Value<S | null>,
) => Property<E>

// -- Property constructors --

const createBooleanProperty =
    (attrName: string, truthyValue: string) =>
    (truthy: Value<boolean>) =>
    (element: HTMLElement) => {
        formula((isSelected) => {
            if (isSelected) {
                element.setAttribute(attrName, truthyValue)
            } else {
                element.removeAttribute(attrName)
            }
        }, truthy)
    }

const createStringAttr: <E extends HTMLElement>(attrName: string) => PropertyWithToString<E> =
    (attrName: string) => (s) => (element) =>
        formula((s) => element.setAttribute(attrName, s?.toString() ?? ''), s)

// -- Some useful properties --

export const className =
    <E extends { classList: DOMTokenList }>(name: Value<string>) =>
    (element: E) =>
        formula(([newClassName, oldClassName]) => {
            oldClassName?.split(' ')?.forEach((cn) => element.classList.remove(cn))
            newClassName.split(' ').forEach((cn) => cn && element.classList.add(cn))
        }, history(name))

export const styles =
    <T extends { style: { cssText: string } }>([txt]: TemplateStringsArray) =>
    (element: T) =>
        formula((txt) => (element.style.cssText = txt), txt)

export const style =
    <Key extends keyof CSS.Properties>(key: Key, value: Value<CSS.Properties[Key]>) =>
    (element: HTMLElement) =>
        formula((value) => {
            const properties: CSS.Properties = {
                [key]: value,
            }
            Object.assign(element.style, properties)
        }, value)

export const cssText: PropertyWithToString<HTMLElement> = (text) => (element) =>
    formula((text) => (element.style.cssText = text?.toString() ?? ''), text)

export const src: PropertyWithToString<HTMLImageElement> = (src) => (element) =>
    formula((src) => (element.src = src?.toString() ?? ''), src)

export const classList =
    <E extends { classList: DOMTokenList }>(classes: { [key: string]: Value<boolean> }) =>
    (element: E) => {
        for (const [name, val] of Object.entries(classes)) {
            formula((value) => {
                if (value) {
                    element.classList.add(name)
                } else {
                    element.classList.remove(name)
                }
            }, val)
        }
    }

export const muted: (isMuted: Value<boolean>) => Property<HTMLVideoElement> =
    (isMuted) => (element) => {
        formula((isMuted) => {
            if (isMuted) {
                element.setAttribute('muted', '')
                element.muted = true
            } else {
                element.removeAttribute('muted')
                element.muted = false
            }
        }, isMuted)
    }

export const autoplay: (shouldAutoplay: Value<boolean>) => Property<HTMLVideoElement> =
    createBooleanProperty('autoplay', '')

export const playsinline: (truthy: Value<boolean>) => Property<HTMLVideoElement> =
    createBooleanProperty('playsinline', '')

export const TEST_ID_ATTRIBUTE = 'data-testid'

export const testId = createStringAttr<HTMLElement>(TEST_ID_ATTRIBUTE)

export const id: <E extends { id: string }>(idVal: Value<string>) => (element: E) => void =
    (idVal) => (element) =>
        formula((idVal) => (element.id = idVal.toString()), idVal)

export const hide = (shouldBeHidden: Value<boolean>) => classList({ hide: shouldBeHidden })

export const selected: (isSelected: Value<boolean>) => Property<HTMLElement> =
    createBooleanProperty('selected', '')

export const disabled: (isDisabled: Value<boolean>) => Property<HTMLElement> =
    createBooleanProperty('disabled', '')

export const on: (
    eventName: string,
    listener: Value<EventListenerOrEventListenerObject>,
    options?: boolean | AddEventListenerOptions,
) => Property<HTMLElement> = (eventName, listener, options) => (element) =>
    formula(([newListener, oldListener]) => {
        if (oldListener) element.removeEventListener(eventName, oldListener, options)

        element.addEventListener(eventName, newListener, options)
    }, history(listener))

export const onClick: (fn: Value<((ev: MouseEvent) => void) | null>) => Property<HTMLElement> =
    (fn) => (element) =>
        formula((fn) => (element.onclick = fn), fn)

export const onChange: (
    fn: Value<(evt: Event) => void>,
) => Property<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement> = (fn) => (element) =>
    formula((fn) => (element.onchange = fn), fn)

export const onInput: (
    fn: Value<(evt: Event) => void>,
) => Property<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement> = (fn) => (element) =>
    formula((fn) => (element.oninput = fn), fn)

function removeAllContent(element: HTMLElement) {
    while (element.lastChild) {
        element.removeChild(element.lastChild)
    }
}

function updateChild(element: HTMLElement, newChild?: Node, oldChild?: Node) {
    if (newChild && oldChild) element.replaceChild(newChild, oldChild)
    else if (oldChild) element.removeChild(oldChild)
    else if (newChild) element.appendChild(newChild)
}

// FIXME: this property is not efficient
export function children(childrenValue: Children): Property<HTMLElement> {
    return (element) => {
        formula((childList) => {
            removeAllContent(element)

            childList.forEach((child) => {
                const childHistoryUpdater = history(child)
                return formula(([newChild, oldChild]) => {
                    /* Imagine such situation (you can check it out in the tests):

                     const c1 = cell(...)
                     const c2 = cell(...)

                     return div([children(
                     map(() => {
                     const staticPart = div([text('STATIC DIV')])
                     const dynamicPart = map(() => div([text('DYNAMIC DIV')]), c2)

                     const childList = [
                     staticPart,
                     dynamicPart,
                     ]

                     return childList
                     }, c1)
                     )])

                     // Each time when `c1` is changed, we re-create `dynamicPart` and then add it to the `childList`.
                     // The problem is that we actually provide a new `dynamicPart` every time, but we don't `destroy` the old one.
                     // And as the `children` function subscribes at every element of `childList`,
                     // it'll still be subscribed on the old `dynamicPart`.
                     // So we'll actually have as many subscriptions as the `c1` changes
                     */
                    if (
                        oldChild &&
                        !oldChild.parentElement &&
                        !Array.isArray(childHistoryUpdater)
                    ) {
                        return childHistoryUpdater.destroy()
                    }

                    updateChild(element, newChild, oldChild)
                }, childHistoryUpdater)
            })
        }, childrenValue)
    }
}

export const srcObject: (value: Value<MediaStream | undefined>) => Property<HTMLVideoElement> =
    (value) => (element) => {
        formula((value) => (element.srcObject = value ?? null), value)
    }

export const value: (
    val: Value<string | undefined>,
) => Property<HTMLSelectElement | HTMLOptionElement | HTMLInputElement | HTMLTextAreaElement> =
    (val) => (element) =>
        formula((val) => (element.value = val ?? ''), val)

export const text: PropertyWithToString<HTMLElement> = (innerText) => (element) =>
    formula((innerText) => (element.innerText = innerText?.toString() ?? ''), innerText)

export const textContent: PropertyWithToString<HTMLElement> = (txt) => (element) =>
    formula((txt) => (element.textContent = txt?.toString() ?? ''), txt)

export const placeholder: PropertyWithToString<HTMLInputElement | HTMLTextAreaElement> =
    (txt) => (element) =>
        formula((txt) => (element.placeholder = txt?.toString() ?? ''), txt)

export const inputType: (t: Value<HTMLInputElement['type']>) => Property<HTMLInputElement> =
    (t) => (element) =>
        formula((t) => (element.type = t), t)

export const min: (t: Value<HTMLInputElement['min']>) => Property<HTMLInputElement> =
    (t) => (element) =>
        formula((t) => (element.min = t), t)

export const max: (t: Value<HTMLInputElement['max']>) => Property<HTMLInputElement> =
    (t) => (element) =>
        formula((t) => (element.max = t), t)

export const step: (t: Value<HTMLInputElement['step']>) => Property<HTMLInputElement> =
    (t) => (element) =>
        formula((t) => (element.step = t), t)

export const checked: (c: Value<boolean>) => Property<HTMLInputElement> = (c) => (element) =>
    formula((c) => (element.checked = c), c)

export const onloadeddata: (fn: Value<(ev: Event) => void>) => Property<HTMLVideoElement> =
    (fn) => (element) =>
        formula((fn) => (element.onloadeddata = fn), fn)

export const htmlFor: PropertyWithToString<HTMLLabelElement> = (id) => (element) =>
    formula((id) => (element.htmlFor = id?.toString() ?? ''), id)
