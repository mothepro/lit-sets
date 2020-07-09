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

  @property({ type: Boolean, reflect: true })
  selected = false

  static readonly styles = css`
    @keyframes zoom-in {
      from { transform: scale(0) }
      to { transform: scale(1) }
    }

    :host {
      display: inline-block;
      position: relative;
      margin-bottom: 5px;
    }

    :host([index]) {
      animation: 1s ease zoom-in both;
    }

    :host:before {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      background-color: var(--selected-color-bg, black);
      content: "";
      pointer-events: none;
      opacity: 0;
      border-radius: 5px;
    }

    :host([selected]):before {
      opacity: 0.15;
    }

    sets-shape {
      font-size: var(--sets-shape-size, 50px);
      margin: var(--sets-shape-spacing, .2em);
    }`

  /** This needs to override the value set. */
  protected get myStyle() {
    return css`
    :host {
      animation-delay: ${this.index * 500}ms !important;
    }` }

  protected async firstUpdated() {
    await this.updateComplete

    // TODO since <mwc-card> isn't launched yet.
    const mwcRoot = this.shadowRoot?.firstElementChild?.shadowRoot
    if (mwcRoot)
      injectStyle(mwcRoot, css`#button { height: auto }`)
  }

  protected readonly render = () => html`
    <mwc-button raised fullwidth  @click=${() => this.selected = !this.selected}>
      ${[...Array(1 + this.quantity)].map(() => html`
        <sets-shape
          opacity=${this.opacity}
          color=${this.color}
          shape=${this.shape}
        ></sets-shape>`)}
    </mwc-button>
    ${this.index ? html`<style>${this.myStyle}</style>` : '' /* There has gotta be a better way to do this */}`
}
