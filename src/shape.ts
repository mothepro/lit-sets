import { LitElement, customElement, property, css, html } from 'lit-element'
import { Details } from 'sets-game-engine'

// Equilateral Triangle Ratio. Thanks Amima :)
const baseByHeight = Math.sqrt(3) / 3

/** Border width ratio */
const borderSize = 1 / 6

const y = borderSize * baseByHeight,
  x = Math.sqrt(borderSize ** 2 - y ** 2),
  b = baseByHeight - x

/**
 * A visiual representation for a shape in sets.
 * The size of the shape can be controlled by the `font-size` property.
 */
@customElement('sets-shape')
export default class extends LitElement {

  @property({ type: Number })
  opacity!: Details.Opacity

  @property({ type: Number })
  color!: Details.Color

  @property({ type: Number })
  shape!: Details.Shape

  static readonly styles = css`
  :host {
    display: inline-block;
    border-style: solid;
    border-color: transparent;
    width: ${1 - 2 * borderSize}em;
    height: ${1 - 2 * borderSize}em;
    border-width: ${borderSize}em;
  }
  :host([shape="${Details.Shape.SQUARE}"]) {
    border-radius: 0.25em;
  }
  :host([shape="${Details.Shape.CIRCLE}"]) {
    border-radius: 50%;
  }
  :host([shape="${Details.Shape.TRIANGLE}"]) {
    position: relative;
    width: 0;
    height: 0;
    border-width: 0 ${baseByHeight}em 1em;
  }
  :host([shape="${Details.Shape.TRIANGLE}"]) span {
    position: absolute;

    top: ${borderSize}em;
    left: ${-b}em;
    border-width: 0
      ${b}em
      ${1 - borderSize - y}em;

    border-style: solid;
    border-color: transparent;
    border-bottom-color: var(--color-bg, white);
  }`

  protected get myStyle() {
    if (this.shape == Details.Shape.TRIANGLE)
      return css`
        :host(sets-shape) {
          border-bottom-color: ${this.cssColor()};
        }
        :host span {
          opacity: ${this.opacity / 2};
        }`

    return css`
      :host(sets-shape) {
        border-color: ${this.cssColor()};
        background-color: ${this.cssColor(this.opacity / 2)};
      }`
  }

  private cssColor(opacity = 1) {
    switch (this.color) {
      case Details.Color.BLUE:
        return css`hsla(207, 90%, 58%, ${opacity})`
      case Details.Color.RED:
        return css`hsla(45, 100%, 50%, ${opacity})`
      case Details.Color.GREEN:
        return css`hsla(4, 90%, 58%, ${opacity})`
    }
  }

  protected readonly render = () => html`
    <style>${this.myStyle}</style>
    ${this.shape == Details.Shape.TRIANGLE
      ? html`<span></span>`
      : null}`
}
