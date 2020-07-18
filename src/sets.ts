import { LitElement, customElement, property, html, css } from 'lit-element'
import type { Card } from 'sets-game-engine'

import '@material/mwc-fab'
import './card.js'
import './leaderboard.js'

export type TakeEvent = CustomEvent<[number, number, number]>
export type HintEvent = CustomEvent<void>

declare global {
  interface HTMLElementEventMap {
    take: TakeEvent
    hint: HintEvent
  }
}

@customElement('lit-sets')
export default class extends LitElement {

  /** Whether can request a hint */
  @property({ type: Boolean, attribute: 'hint-available' })
  hintAvailable = false

  /** Whether can take a set */
  @property({ type: Boolean, attribute: 'can-take' })
  canTake = false

  /** Whether to show labels on fabs */
  @property({ type: Boolean, attribute: 'show-label' })
  showLabel = false

  /** Key to press to take a set. */
  @property({ type: String, attribute: 'take-on-key' })
  takeOnKey = ''

  /** Cards in the market */
  @property({ type: Array })
  cards: Card[] = []

  /** The cards that are labeled as hints */
  @property({ type: Array })
  hint: Card[] = []

  /** Indexes of the selected cards */
  @property({ type: Array, reflect: true })
  selected: number[] = []

  firstUpdated() {
    // TODO do not select a card
    addEventListener('keypress', (event: KeyboardEvent) => {
      if (this.takeOnKey && event.code == this.takeOnKey) {
        event.preventDefault()
        this.takeSet()
      }
    })
  }

  static readonly styles = css`
  .grid {
    display: grid;
    grid-template-columns: var(--sets-grid-template-columns, repeat(3, minmax(200px, 1fr)));
    gap: var(--sets-gap, 2em);
    
    justify-content: center;
    justify-items: stretch;
    align-items: stretch;
  }

  mwc-fab {
    position: var(--sets-fab-position, fixed);
    bottom: 1rem;
  }
  mwc-fab.take {
    right: 1rem;
  }
  mwc-fab.hint {
    left: 4rem;
  }

  /* Should be built in tbh... */
  mwc-fab[disabled] {
    pointer-events: none;
    cursor: default !important;
    --mdc-theme-on-secondary:  white;
    --mdc-theme-secondary:  lightgrey;
    --mdc-fab-box-shadow:  none;
    --mdc-fab-box-shadow-hover:  none;
    --mdc-fab-box-shadow-active:  none;
    --mdc-ripple-fg-opacity:  0;
  }`

  private selectCard(index: number) {
    return () => {
      const selected = new Set(this.selected)
      if (selected.has(index))
        selected.delete(index)
      else
        selected.add(index)
      this.selected = [...selected]
    }
  }

  private takeSet() {
    if (this.canTake && this.selected.length == 3) {
      this.dispatchEvent(new CustomEvent('take', { detail: this.selected }))
      this.selected = []
    }
  }

  protected readonly render = () => html`
    <div class="grid">${this.cards.map((card, index) => html`
      <sets-card
        part="card card-${index}"
        interactive
        ?selected=${this.selected.includes(index)}
        ?hint=${this.hint.includes(card)}
        opacity=${card.opacity}
        color=${card.color}
        shape=${card.shape}
        quantity=${card.quantity}
        zoom-in=${index}
        @click=${this.selectCard(index)}
      ></sets-card>`)}
    </div>
    <mwc-fab
      part="hint"
      class="hint"
      mini
      ?disabled=${!this.hintAvailable}
      @click=${() => this.dispatchEvent(new CustomEvent('hint'))}
      icon="help_outline"
      label="Get Hint"
      title="Get a hint"
    ></mwc-fab>
    <mwc-fab
      part="take"
      class="take"
      ?extended=${this.showLabel}
      ?disabled=${!this.canTake || this.selected.length != 3}
      @click=${this.takeSet}
      icon="done_outline"
      label="Take Set"
    ></mwc-fab>`
}
