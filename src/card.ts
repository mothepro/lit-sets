import { LitElement, customElement, property, html, css } from 'lit-element'
import type { Details } from 'sets-game-engine'
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

  @property({ type: Boolean, reflect: true })
  hint = false

  @property({ type: String })
  hintIcon = 'star'

  @property({ type: String })
  selectedIcon = 'done'

  static readonly styles = [css`
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

    .hint, .selected {
      pointer-events: none;
      position: absolute;
    }
    .hint {
      top: var(--sets-card-icon-spacing, 0.25em);
      left: var(--sets-card-icon-spacing, 0.25em);
      color: var(--sets-hint-color-fg);
    }
    .selected {
      bottom: var(--sets-card-icon-spacing, 0.25em);
      right: var(--sets-card-icon-spacing, 0.25em);
      color: var(--sets-selected-color-fg);
    }

    mwc-button {
      height: 100%;
    }
    sets-shape {
      font-size: var(--sets-shape-size, 50px);
      margin: var(--sets-shape-spacing, .2em);
    }`,

  // The animation delays
  ...[...Array(21).keys()].map(i => css`
    :host([index="${i}"]) {
      animation-delay: ${i * 500}ms !important;
    }`)]

  protected async firstUpdated() {
    await this.updateComplete

    // TODO since <mwc-card> isn't launched yet.
    //   https://github.com/material-components/material-components-web-components/issues/1504
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
    ${this.hint ? html`<mwc-icon class="hint" label="Hint">${this.hintIcon}</mwc-icon>` : ''}
    ${this.selected ? html`<mwc-icon class="selected" label="Selected">${this.selectedIcon}</mwc-icon>` : ''}`
}
