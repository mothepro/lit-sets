import { CSSResult, css } from 'lit-element'
import { Details } from 'sets-game-engine'

/** Whether an array has actually changed */
export const hasArrayChanged = (newVals: any[], oldVals: any[] = []) =>
  !oldVals
  || oldVals.length != newVals.length
  || !oldVals.every((card, index) => card == newVals[index])

/**
 * Add styles directly to an underlying shadow dom.
 * This must be done after the `updateComplete` promise is resolved.
 * 
 * Here we inject a class style element since
 * `adoptedStyleSheets` isn't supported in all browsers
 */
export function injectStyle(root: ShadowRoot, { cssText }: CSSResult) {
  const style = document.createElement('style')
  style.textContent = cssText
  root.appendChild(style)
}

/** Convert a Color and opacity into */
export function cssColor(color: Details.Color, opacity = Details.Opacity.SOLID) {
  switch (color) {
    case Details.Color.BLUE:
      return css`hsla(var(--sets-shape-blue-hsl, 207, 90%, 58%), ${1 - opacity / 2})`
    case Details.Color.RED:
      return css`hsla(var(--sets-shape-red-hsl, 45, 100%, 50%), ${1 - opacity / 2})`
    case Details.Color.GREEN:
      return css`hsla(var(--sets-shape-green-hsl, 4, 90%, 58%), ${1 - opacity / 2})`
  }
}

/** Equilateral Triangle Ratio. Thanks Amima :) */
export const baseByHeight = Math.sqrt(3) / 3
/** Border width ratio */
export const borderSize = 1 / 6
/** Top part of border? */
export const borderSizeByHeight = borderSize * baseByHeight
/** Left side of border? */
export const hypotnousSize = baseByHeight - Math.sqrt(borderSize ** 2 - borderSizeByHeight ** 2)
