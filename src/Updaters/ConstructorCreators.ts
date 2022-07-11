/**
 * @fileoverview This module includes helpers to create UpdaterConstructors.
 *
 * Example usage:
 * @example
 * const disabled: UpdaterConstructor<HTMLVideoElement, boolean> =
 *     createBooleanUpdaterConstructor('disabled')
 */
import { formula } from '@snapview/sunrise'
import {
    BooleanUpdaterConstructor,
    WithToStringUpdaterConstructor,
    UpdaterConstructor,
} from './Constructors'

type UpdateOptions =
    | { updateAttribute: true; updateProperty?: boolean }
    | { updateAttribute?: boolean; updateProperty: true }

export const createBooleanUpdaterConstructor: <E extends Element>(
    attrName: string,
    options: { truthyValue?: string } & UpdateOptions,
) => BooleanUpdaterConstructor<E> =
    (attrName, { truthyValue = '', updateProperty, updateAttribute }) =>
    (source) =>
    (element) => {
        formula((source) => {
            if (source) {
                if (updateAttribute) {
                    element.setAttribute(attrName, truthyValue)
                }
                if (updateProperty) {
                    Object.assign(element, { [attrName]: truthyValue || true })
                }
            } else {
                if (updateAttribute) {
                    element.removeAttribute(attrName)
                }
                if (updateProperty) {
                    Object.assign(element, { [attrName]: undefined })
                }
            }
        }, source)
    }

export const createStringUpdaterConstructor: <E extends Element>(
    attrName: string,
    options: UpdateOptions,
) => WithToStringUpdaterConstructor<E> =
    (attrName, { updateProperty, updateAttribute }) =>
    (source) =>
    (element) => {
        formula((source) => {
            if (updateAttribute) {
                element.setAttribute(attrName, source.toString())
            }
            if (updateProperty) {
                Object.assign(element, { [attrName]: source.toString() })
            }
        }, source)
    }

export const createPropertyUpdaterConstructor: <E extends Node, Source>(
    propName: keyof E,
) => UpdaterConstructor<E, Source> = (propName) => (s) => (element) =>
    formula((s) => Object.assign(element, { [propName]: s }), s)

// export const createPropertyUpdaterConstructorWithMapper: <E extends HTMLElement, Source, Result>(
//     propName: keyof E,
//     mapSource: (s: Source | UnwrapCell<Source>) => Result,
// ) => UpdaterConstructor<E, Source> = (propName, mapSource) => (s) => (element) =>
//     formula((s) => Object.assign(element, { [propName]: mapSource(s) }), s)
