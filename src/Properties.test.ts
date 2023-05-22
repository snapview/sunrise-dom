/**
 * @jest-environment jsdom
 */
import { cell, deref, map, reset } from '@snapview/sunrise'
import { div, img } from './Nodes'
import * as Props from './Properties'

describe('Properties', () => {
    it('should clean the subscriptions on the same re-created dynamic children when their source is changed', () => {
        const childListSource = cell(false)
        const childSource = cell(false)

        const staticPart = div([Props.text('STATIC DIV')])
        const dynamicPart = map(() => div([Props.text('DYNAMIC DIV')]), childSource)

        div([
            Props.children(
                map(() => {
                    return [staticPart, dynamicPart]
                }, childListSource),
            ),
        ])

        const RUN_COUNT = 3
        for (let _ = 0; _ < RUN_COUNT; _++) {
            reset(!deref(childListSource), childListSource)
        }
        expect(dynamicPart.subscribers.size).toBe(1 + RUN_COUNT)

        reset(!deref(childSource), childSource)
        expect(dynamicPart.subscribers.size).toBe(1)
    })
    it('should clean the subscriptions on the children which are no longer in childList when their source is changed', () => {
        const childListSource = cell(false)
        const childSource = cell(false)

        const staticPart = div([Props.text('STATIC DIV')])
        const dynamicPart = map(() => div([Props.text('DYNAMIC DIV')]), childSource)

        div([
            Props.children(
                map((shouldAddDynamicPart) => {
                    const content: Props.ReactiveNode[] = [staticPart]
                    if (shouldAddDynamicPart) {
                        content.push(dynamicPart)
                    }
                    return content
                }, childListSource),
            ),
        ])

        expect(dynamicPart.subscribers.size).toBe(0) // because we didn't add dynamic part to the childList

        reset(true, childListSource)
        expect(dynamicPart.subscribers.size).toBe(1)

        reset(false, childListSource)
        expect(dynamicPart.subscribers.size).toBe(1)

        reset(!deref(childSource), childSource)
        expect(dynamicPart.subscribers.size).toBe(0)
    })
    describe('should not throw an error when a formula cell resolves to a null value', () => {
        it('when setting an image `src`', () => {
            // this is an example flow how we might end up with a `null` formula
            const srcPath = cell('example.jpg')
            img([Props.src(srcPath)])
            reset(null, srcPath)
            img([Props.src(srcPath)])
        })

        const properties: Array<[string, Props.PropertyWithToString<any>]> = [
            Props.cssText,
            Props.htmlFor,
            Props.placeholder,
            Props.text,
            Props.textContent,
        ].map((fn) => [fn.name, fn])
        it.each(properties)('when setting`%s`', (_name, fn) => {
            div([fn(cell(null))])
        })
    })
})
