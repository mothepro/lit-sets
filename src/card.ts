import { LitElement, customElement, property, html, css } from 'lit-element'
import { Details } from 'sets-game-engine'
import '@material/mwc-button'
import './shape.js'

@customElement('sets-card')
export default class extends LitElement {

  @property({ type: Number })
  opacity!: Details.Opacity

  @property({ type: Number })
  color!: Details.Color

  @property({ type: Number })
  shape!: Details.Shape

  @property({ type: Number })
  quantity!: Details.Quantity

  @property({ type: Number })
  index = 0

  static readonly styles = css`
  @keyframes zoom-in {
    from { transform: scale(0) }
    to { transform: scale(1) }
  }

  :host {
    display: inline-block;
    padding: 1em;

    border: thin solid red;
  }

  :host sets-shape {
    font-size: 50px;
    margin: .2em;
  }

  :host([index]) {
    animation: 1s ease zoom-in both;
  }`

  /** This needs to override the value set. */
  protected get myStyle() { return css`
    :host {
      animation-delay: ${this.index * 500}ms !important;
    }`
  }

  protected readonly render = () => html`
    <style>${this.myStyle}</style>
<mwc-button raised>
    ${[...Array(1 + this.quantity)].map(() => html`
        <sets-shape
          opacity=${this.opacity}
          color=${this.color}
          shape=${this.shape}
        ></sets-shape>`)}
    </mwc-button>`
}
