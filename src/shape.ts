import { LitElement, customElement, property, css, html } from 'lit-element'
import { Details } from 'sets-game-engine'

// Equilateral Triangle Ratio. Thanks Amima :)
const baseByHeight = Math.sqrt(3) / 3

/** Border width ratio */
const borderSize = 1 / 6

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
    width: 1em;
    height: 1em;
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
    left: ${-baseByHeight + 2 * borderSize}em;
    border-width: 0
      ${baseByHeight - 2 * borderSize}em
      ${1 - 2 * borderSize}em;

    border-style: solid;
    border-color: transparent;
    border-bottom-color: var(--background-color, white);
  }`

  protected get myStyle() {
    if (this.shape == Details.Shape.TRIANGLE)
      return css`
        :host(sets-shape) {
          border-bottom-color: ${ this.cssColor() };
        }
        :host span {
          opacity: ${ this.opacity / 2 };
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
    throw Error(`Unexpected color ${this.color}`)
  }

  protected readonly render = () => html`
    <style>${this.myStyle}</style>
    ${this.shape == Details.Shape.TRIANGLE
      ? html`<span></span>`
      : null }`
}
