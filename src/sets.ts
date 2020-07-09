import { LitElement, customElement, property, html, css } from 'lit-element'
import type { Card, CardSet } from 'sets-game-engine'

import '@material/mwc-fab'
import './card.js'
import './leaderboard.js'

export type TakeEvent = CustomEvent<CardSet>
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
    // TODO arrow key support
    this.addEventListener('keypress', ({ key }: KeyboardEvent) => this.takeOnKey && key == this.takeOnKey && this.takeSet())
  }

  static readonly styles = css`
    mwc-fab[disabled] {
      pointer-events: none;
      --mdc-theme-secondary: lightgrey;
      --mdc-fab-box-shadow: none;
      --mdc-fab-box-shadow-hover: none;
      --mdc-fab-box-shadow-active: none;
    }`

  private selectCard(index: number) {
    return ({ detail }: MouseEvent) => {
      // Do not select if they press "Enter"
      if (this.takeOnKey && !detail)
        return

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
      this.dispatchEvent(new CustomEvent('take', {
        detail: this.selected.map(i => this.cards[i])
      }))
      this.selected = []
    }
  }

  protected readonly render = () => html`
    ${this.cards.map((card, index) => html`
      <sets-card
        part="card card-${index}"
        ?selected=${this.selected.includes(index)}
        ?hint=${this.hint.includes(card)}
        opacity=${card.opacity}
        color=${card.color}
        shape=${card.shape}
        quantity=${card.quantity}
        index=${index}
        @click=${this.selectCard(index)}
      ></sets-card>`)}
    <mwc-fab
      part="hint"
      mini
      ?extended=${this.showLabel}
      ?disabled=${!this.hintAvailable}
      @click=${() => this.dispatchEvent(new CustomEvent('hint'))}
      icon="help_outline"
      label="Get Hint"></mwc-fab>
    <mwc-fab
      part="take"
      ?extended=${this.showLabel}
      ?disabled=${!this.canTake || this.selected.length != 3}
      @click=${this.takeSet}
      icon="done_outline"
      label="Take Set"></mwc-fab>`
}
