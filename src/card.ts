import { LitElement, customElement, property, html, css } from 'lit-element'
import { Details } from 'sets-game-engine'
import injectStyle from './injectStyle.js'
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

  @property({ type: Boolean })
  selected = false

  static readonly styles = css`
    @keyframes zoom-in {
      from { transform: scale(0) }
      to { transform: scale(1) }
    }

    :host {
      display: inline-block;
    }

    :host([index]) {
      animation: 1s ease zoom-in both;
    }

    :host sets-shape {
      font-size: 50px;
      margin: .2em;
    }`

  /** This needs to override the value set. */
  protected get myStyle() {
    return css`
    :host {
      animation-delay: ${this.index * 500}ms !important;
    }` }

  protected async firstUpdated() {
    await this.updateComplete
    const mwcRoot = this.shadowRoot?.getElementById('mwc-button')?.shadowRoot
    if (mwcRoot)
      injectStyle(mwcRoot, css`#button { height: auto }`)
    addEventListener('click', console.warn)
  }

  protected readonly render = () => html`${
    // There has gotta be a better way to do this
    this.index ? html`<style>${this.myStyle}</style>` : ''}
    <mwc-button raised id="mwc-button" @click=${() => this.selected = !this.selected}>
      ${[...Array(1 + this.quantity)].map(() => html`
        <sets-shape
          opacity=${this.opacity}
          color=${this.color}
          shape=${this.shape}
        ></sets-shape>`)}
    </mwc-button>`
}
