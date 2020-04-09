import { CSSResult } from 'lit-element'

/**
 * Add styles directly to an underlying shadow dom.
 * This must be done after the `updateComplete` promise is resolved.
 * 
 * Here we inject a class style element since
 * `adoptedStyleSheets` isn't supported in all browsers
 */
export default function (root: ShadowRoot, { cssText }: CSSResult) {
  const style = document.createElement('style')
  style.textContent = cssText
  root.appendChild(style)
}
