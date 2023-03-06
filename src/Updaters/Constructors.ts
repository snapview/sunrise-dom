/**
 * @fileoverview This module includes helpers to work with HTML elements.
 *
 * Example usage:
 * @example
 * const inputTypeText = inputType('text')  // `inputType` – is an `UpdaterConstructor`
 * const inputTypeCheckbox = inputType('checkbox')`  // the result of calling `UpdaterConstructor` is an `Updater`
 * const inputTypeSubmit = inputType('submit')`  // these updaters are based on static values, so they don't change anything
 *
 * form([
 *     children([
 *         input([
 *             inputTypeText,  // sets a `type` attribute and never changes that
 *         ]),
 *         input([inputTypeText]),
 *         input([inputTypeCheckbox]),
 *         input([inputTypeSubmit]),
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
import difference from 'lodash/difference'
import {
    createBooleanUpdaterConstructor,
    createPropertyUpdaterConstructor,
    createStringUpdaterConstructor,
} from './ConstructorCreators'

/**
 * `Updater` is just a mutable transformation over `HTMLElement`
 * It can set HTML attributes or properties, attach handlers or do any other
 * sort of effects
 *
 * Most of the time `Updater` uses `Source` to change provided `element`.
 * `Source` comes from the scope (see `UpdaterConstructor`)
 */
export type Updater<T extends Node> = (element: T) => void

/*
 * A function which provides an `Updater` based on the given `Source`.
 * `Source` might be a `Cell` or a plain static value, like string or number.
 * So as an example:
 *
 * div([
 *   className(  // this is `UpdaterConstructor`
 *     'container'  // this is `Source` (it might have been `cell('container')`)
 *   ),  // the result of that call is an `Updater`
 * ])
 * */
export type UpdaterConstructor<E extends Node, RequiredSource> = <Source extends RequiredSource>(
    source: Value<Source>,
) => Updater<E>

type WithToString = { toString: () => string }

export type WithToStringUpdaterConstructor<E extends Node> = UpdaterConstructor<E, WithToString>
export type BooleanUpdaterConstructor<E extends Node> = UpdaterConstructor<E, boolean>

/* --

   Common

----- */

export const inputType: UpdaterConstructor<
    | HTMLAnchorElement
    | HTMLButtonElement
    | HTMLEmbedElement
    | HTMLFieldSetElement
    | HTMLInputElement
    | HTMLLIElement
    | HTMLLinkElement
    | HTMLOListElement
    | HTMLObjectElement
    | HTMLOutputElement
    | HTMLParamElement
    | HTMLScriptElement
    | HTMLSelectElement
    | HTMLSourceElement
    | HTMLStyleElement
    | HTMLTextAreaElement
    | HTMLUListElement,
    string
> = createPropertyUpdaterConstructor('type')

export const min: UpdaterConstructor<HTMLInputElement | HTMLMeterElement, string> =
    createPropertyUpdaterConstructor('min')

export const max: UpdaterConstructor<
    HTMLInputElement | HTMLMeterElement | HTMLProgressElement,
    string
> = createPropertyUpdaterConstructor('max')

export const step: UpdaterConstructor<HTMLInputElement, string> =
    createPropertyUpdaterConstructor('step')

export const onloadeddata: UpdaterConstructor<HTMLVideoElement, (ev: Event) => void> =
    createPropertyUpdaterConstructor('onloadeddata')

export const onClick: UpdaterConstructor<HTMLElement, ((evt: Event) => void) | null> =
    createPropertyUpdaterConstructor('onclick')

export const onChange: UpdaterConstructor<
    HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement,
    (evt: Event) => void
> = createPropertyUpdaterConstructor('onchange')

export const onInput: UpdaterConstructor<HTMLElement, (evt: Event) => void> =
    createPropertyUpdaterConstructor('oninput')

export const placeholder: WithToStringUpdaterConstructor<HTMLInputElement | HTMLTextAreaElement> =
    createStringUpdaterConstructor('placeholder', { updateProperty: true })

export const text: WithToStringUpdaterConstructor<HTMLElement> = createStringUpdaterConstructor(
    'innerText',
    { updateProperty: true },
)

export const textContent: WithToStringUpdaterConstructor<Element> = createStringUpdaterConstructor(
    'textContent',
    { updateProperty: true },
)

export const src: WithToStringUpdaterConstructor<
    | HTMLImageElement
    | HTMLInputElement
    | HTMLMediaElement
    | HTMLScriptElement
    | HTMLSourceElement
    | HTMLTrackElement
    | HTMLEmbedElement
    | HTMLIFrameElement
> = createStringUpdaterConstructor('src', { updateAttribute: true })

export const id: WithToStringUpdaterConstructor<Element> = createStringUpdaterConstructor('id', {
    updateProperty: true,
})

export const htmlFor: WithToStringUpdaterConstructor<HTMLLabelElement> =
    createStringUpdaterConstructor('htmlFor', { updateProperty: true })

export const checked: BooleanUpdaterConstructor<HTMLInputElement> = createBooleanUpdaterConstructor(
    'checked',
    { updateProperty: true },
)

export const muted: BooleanUpdaterConstructor<HTMLVideoElement> = createBooleanUpdaterConstructor(
    'muted',
    { updateProperty: true, updateAttribute: true },
)

export const autoplay: BooleanUpdaterConstructor<HTMLElement> = createBooleanUpdaterConstructor(
    'autoplay',
    { updateAttribute: true },
)

export const playsinline: BooleanUpdaterConstructor<HTMLElement> = createBooleanUpdaterConstructor(
    'playsinline',
    { updateAttribute: true },
)

export const selected: BooleanUpdaterConstructor<HTMLElement> = createBooleanUpdaterConstructor(
    'selected',
    { updateAttribute: true },
)

export const disabled: BooleanUpdaterConstructor<HTMLElement> = createBooleanUpdaterConstructor(
    'disabled',
    { updateAttribute: true },
)

/* --

   Uncommon

 ----- */

export const srcObject: UpdaterConstructor<HTMLVideoElement, MediaStream | undefined> =
    (value) => (element) => {
        formula((value) => (element.srcObject = value ?? null), value)
    }

export const value: UpdaterConstructor<
    HTMLSelectElement | HTMLOptionElement | HTMLInputElement | HTMLTextAreaElement,
    string | undefined
> = (source) => (element) => formula((source) => (element.value = source ?? ''), source)

export const on: (
    eventName: string,
    listener: Value<EventListenerOrEventListenerObject>,
    options?: boolean | AddEventListenerOptions,
) => Updater<Element> = (eventName, listener, options) => (element) =>
    formula(([newListener, oldListener]) => {
        if (oldListener) element.removeEventListener(eventName, oldListener, options)

        element.addEventListener(eventName, newListener, options)
    }, history(listener))

export const className: UpdaterConstructor<Element, string> = (name) => (element) =>
    formula(([newClassName, oldClassName]) => {
        const oldNames = oldClassName?.split(' '),
            newNames = newClassName.split(' ').filter((n) => n !== '') // to prevent errors

        const namesToRemove = oldNames && difference(oldNames, newNames),
            namesToAdd = oldNames ? difference(newNames, oldNames) : newNames

        namesToRemove?.forEach((n) => element.classList.remove(n))
        namesToAdd.forEach((n) => element.classList.add(n))
    }, history(name))

/** Be careful, it can only have the source as a primitive `String` and not a `Cell`
 @example
 div([
     styles`
         position:fixed;
         top:0;
         right:0;
         z-index:1000;
         display: flex;
         max-width: 100%;
     `,
    children(...),
 ])
 *  */
export const styles: <T extends { style: { cssText: string } }>([txt]: TemplateStringsArray) => (
    element: T,
) => void =
    ([txt]: TemplateStringsArray) =>
    (element) =>
        (element.style.cssText = txt)

// TODO: implement several `keys`
export const style: <Key extends keyof CSS.Properties>(
    key: Key,
    source: Value<CSS.Properties[Key]>,
) => Updater<HTMLElement> = (key, source) => (element) =>
    formula((source) => {
        const properties: CSS.Properties = {
            [key]: source,
        }
        Object.assign(element.style, properties)
    }, source)

export const cssText: WithToStringUpdaterConstructor<HTMLElement> = (text) => (element) =>
    formula((text) => (element.style.cssText = text.toString()), text)

export const classList: <E extends Element>(classes: {
    [key: string]: Value<boolean>
}) => Updater<E> = (classes) => (element) => {
    for (const [name, source] of Object.entries(classes)) {
        formula((source) => {
            if (source) {
                element.classList.add(name)
            } else {
                element.classList.remove(name)
            }
        }, source)
    }
}

export type ReactiveNode = Value<Node>
export type Children = Value<ReactiveNode[]>

function removeAllContent(element: Element) {
    while (element.lastChild) {
        element.removeChild(element.lastChild)
    }
}

function updateChild(element: Element, newChild?: Node, oldChild?: Node) {
    if (newChild && oldChild) element.replaceChild(newChild, oldChild)
    else if (oldChild) element.removeChild(oldChild)
    else if (newChild) element.appendChild(newChild)
}

// FIXME: this property-constructor is not efficient
export function children(childrenValue: Children): Updater<Element> {
    return (element) => {
        formula((childList) => {
            removeAllContent(element)

            childList.forEach((child) => {
                const childHistoryUpdater = history(child)
                return formula(([newChild, oldChild]) => {
                    /* Imagine such a situation (you can check it out in tests):

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
