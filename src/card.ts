import { LitElement, customElement, property, html, css } from 'lit-element'
import type { Details } from 'sets-game-engine'
import { injectStyle } from './helper.js'

import '@material/mwc-button'
import './shape.js'

/** Number of milliseconds to complete animation/transition */
export const animationDuration = 1000

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

  @property({ type: Boolean, reflect: true })
  interactive = false

  @property({ type: Boolean, reflect: true })
  selected = false

  @property({ type: Boolean, reflect: true })
  hint = false

  // TODO transtitions as CSS vars
  static readonly styles = [css`
    @keyframes zoom {
      from { transform: scale(0) }
      to { transform: scale(1) }
    }

    :host {
      position: relative;
      margin-bottom: 5px;
    }
    /* Animations are used to bring cards into view, since these must happen ASAP. */
    :host([zoom]) {
      animation: ${animationDuration}ms ease zoom both;
      transition: opacity ${animationDuration}ms ease;
    }
    /* Transitions are easier to use, so they are to remove elements. */
    :host([zoom][out]) {
      animation-name: none;
      opacity: 0;
    }

    mwc-icon {
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
    :host([zoom][delay="${i}"]) {
      animation-delay: calc(var(--sets-card-animation-delay, 100ms) * ${i});
    }`)]

  protected async firstUpdated() {
    await this.updateComplete

    // TODO since <mwc-card> isn't launched yet.
    //   https://github.com/material-components/material-components-web-components/issues/1504
    const mwcRoot = this.shadowRoot?.firstElementChild?.shadowRoot
    if (mwcRoot)
      injectStyle(mwcRoot, css`#button { height: auto }`)
  }

  private toggle(e: Event) {
    if (!this.interactive) {
      e.stopPropagation()
      e.preventDefault()
    } else
      this.selected = !this.selected
  }

  protected readonly render = () => html`
    <mwc-button
      raised
      fullwidth
      ?disabled=${!this.interactive}
      @click=${this.toggle}>
      ${[...Array(1 + this.quantity)].map(() => html`
        <sets-shape
          opacity=${this.opacity}
          color=${this.color}
          shape=${this.shape}
        ></sets-shape>`)}
    </mwc-button>
    ${this.hint ? html`
      <slot name="hint">
        <mwc-icon class="hint" label="Hint">star</mwc-icon>
      </slot>` : ''}
    ${this.selected ? html`
      <slot name="selected">
        <mwc-icon class="selected" label="Selected">done</mwc-icon>
      </slot>` : ''}`
}
