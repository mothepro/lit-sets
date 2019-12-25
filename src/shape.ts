import { LitElement, customElement, property, css, html } from 'lit-element'
import { Details } from 'sets-game-engine'

// Equilateral Triangle Ratio. Thanks Amima :)
const baseByHeight = Math.sqrt(3) / 3

@customElement('sets-shape')
export default class extends LitElement {

  @property({ type: Number })
  opacity!: Details.Opacity

  @property({ type: Number })
  color!: Details.Color

  @property({ type: Number })
  shape!: Details.Shape

  @property({ type: Number })
  size = 1

  static readonly styles = css`
  :host {
    display: inline-block;
    border-style: solid;
    border-color: transparent;
  }
  :host([shape="${0}"]) {
    border-radius: 8px;
  }
  :host([shape="${1}"]) {
    border-radius: 50%;
  }
  :host([shape="${2}"]) {
    position: relative;
    width: 0;
    height: 0;
  }
  :host([shape="${2}"]) span {
    position: absolute;
    border-style: solid;
    border-color: transparent;
    border-bottom-color: var(--background-color, white);
  }
  `

  protected get myStyle() {
    if (this.shape == 2)
      return html`<style>
        :host(sets-shape) {
            border-bottom-color: ${ this.cssColor() };
            border-bottom-width: ${ this.size }em;
            border-right-width:  ${ this.size * baseByHeight }em;
            border-left-width:   ${ this.size * baseByHeight }em;
        }
        :host span {
          opacity:             ${ this.opacity / 2 };
          top:                 ${ this.size / 6 /* actual border width */}em;
          left:                ${ -(this.size - this.size / 3) * baseByHeight }em;
          border-bottom-width: ${ (this.size - this.size / 3) }em;
          border-right-width:  ${ (this.size - this.size / 3) * baseByHeight }em;
          border-left-width:   ${ (this.size - this.size / 3) * baseByHeight }em;
        }   
      </style>`
    return html`<style>
    :host(sets-shape) {
      width:        ${this.size}em;
      height:       ${this.size}em;
      border-width: ${this.size / 6}em;

      border-color:     ${this.cssColor()};
      background-color: ${this.cssColor(this.opacity / 2)};
    }
    </style>`
  }

  private cssColor(opacity = 1) {
    switch (this.color) {
      case 0:
        return css`hsla(207, 90%, 58%, ${opacity})`
      case 1:
        return css`hsla(45, 100%, 50%, ${opacity})`
      case 2:
        return css`hsla(4, 90%, 58%, ${opacity})`
    }
  }

  protected readonly render = () => html`
    ${this.myStyle}
    <span></span>
  `
}
