/**
 * @jest-environment jsdom
 */
import { cell, deref, map, reset } from '@snapview/sunrise'
import { div } from '../Nodes'
import { children, ReactiveNode, text } from './Constructors'

describe('Properties', () => {
    it('should clean the subscriptions on the same re-created dynamic children when their source is changed', () => {
        const childListSource = cell(false)
        const childSource = cell(false)

        const staticPart = div([text('STATIC DIV')])
        const dynamicPart = map(() => div([text('DYNAMIC DIV')]), childSource)

        div([
            children(
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

        const staticPart = div([text('STATIC DIV')])
        const dynamicPart = map(() => div([text('DYNAMIC DIV')]), childSource)

        div([
            children(
                map((shouldAddDynamicPart) => {
                    const content: ReactiveNode[] = [staticPart]
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
})
