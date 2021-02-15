import { LitElement, customElement, property, html, css, PropertyValues, internalProperty } from 'lit-element'
import type { Card } from 'sets-game-engine'
import { hasArrayChanged, milliseconds } from './helper.js'
import { animationDuration } from './card.js'

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
  @property({ type: Array, hasChanged: hasArrayChanged })
  cards: Card[] = []

  /** The cards that are labeled as hints */
  @property({ type: Array, reflect: true })
  hint: number[] = []

  /** Indexes of the selected cards */
  @property({ type: Array, reflect: true })
  selected: number[] = []

  @internalProperty()
  private display: {
    /** Whether the transition to remove should be run */
    remove: boolean
    /** Animation & transtion delay to use */
    delay: number
    /** Card to show */
    card: Card
  }[] = []

  firstUpdated() {
    // TODO do not select a card
    addEventListener('keypress', (event: KeyboardEvent) => {
      if (this.takeOnKey && event.code == this.takeOnKey) {
        event.preventDefault()
        this.takeSet()
      }
    })
  }

  update(changed: PropertyValues) {
    if (changed.has('cards')) {
      if (changed.get('cards')) { // Remove cards no longer in the deck
        this.display = this.display.map(({ card }) => ({
          card,
          delay: -1,
          remove: !this.cards.includes(card),
        }))
        this.updateDisplay()
      } else // We werent displaying anything before... nothing to remove!
        this.display = this.cards.map((card, delay) => ({ card, delay, remove: false }))
    }

    super.update(changed)
  }

/** Makes the display match the `cards`, updating their delay to match the new order. */
  // TODO move to `updated`
  private async updateDisplay() {
    await this.updateComplete
    await milliseconds(animationDuration)
    let next = 0
    this.display = this.cards.map(card => ({
      card,
      remove: false,
      delay: this.display.map(({ card: c }) => c).includes(card) ? -1 : next++,
    }))
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
    <div class="grid">${this.display.map(({ remove, delay, card }, index) => html`
      <sets-card
        part="card card-${remove ? 'removal' : 'entrance'}"
        zoom
        index=${index}
        delay=${delay}
        ?out=${remove}
        ?interactive=${!remove}
        ?selected=${this.selected.includes(index)}
        ?hint=${this.hint.includes(index)}
        opacity=${card.opacity}
        color=${card.color}
        shape=${card.shape}
        quantity=${card.quantity}
        @click=${!remove && this.selectCard(index)}
      ></sets-card>`)}
    </div>
    <mwc-fab
      part="hint"
      class="hint"
      mini
      ?disabled=${!this.hintAvailable}
      @click=${() => this.dispatchEvent(new CustomEvent('hint'))}
      icon="lightbulb"
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
