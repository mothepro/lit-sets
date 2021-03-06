import { LitElement, customElement, property, html, css, PropertyValues, internalProperty } from 'lit-element'
import { Card } from 'sets-game-engine'
import { hasArrayChanged, milliseconds } from './helper.js'
import { ANIMATION_DURATION } from './card.js'

import '@material/mwc-fab' // <mwc-fab>
import './card.js'         // <sets-card>
import './leaderboard.js'  // <sets-leaderboard>

export type TakeEvent = CustomEvent<[number, number, number]>
export type IndexEvent = CustomEvent<{ index: number, selected: boolean }>

declare global {
  interface HTMLElementEventMap {
    take: TakeEvent
    selected: IndexEvent
  }
}

/** Max cards we would show on screen. */
export const MAX_CARDS_COUNT = 21

@customElement('lit-sets')
export default class extends LitElement {
  /** Cards in the market */
  @property({ type: Array, hasChanged: hasArrayChanged })
  cards: Card[] = []

  /** The cards that are labeled as hints */
  @property({ type: Array, hasChanged: hasArrayChanged, reflect: true })
  hint: number[] = []

  /** Indexes of the selected cards */
  @property({ type: Array, reflect: true })
  selected: number[] = []

  @property({ type: Boolean })
  shake = false

  @internalProperty()
  private display: {
    /** Whether the transition to remove should be run */
    remove: boolean
    /** Animation & transtion delay to use */
    delay: number
    /** Card to show */
    card: Card
  }[] = []

  /** The order the cards should be shown in, handled by CSS. */
  private cardOrder = [...Array(MAX_CARDS_COUNT).keys()] // this is not reset on difficulty change lol

  /** Indexes of the cards to shake */
  previousSelection?: Set<number>

  takeSet() {
    if (this.selected.length == 3) {
      this.dispatchEvent(new CustomEvent('take', { detail: this.selected }))
      this.previousSelection = new Set(this.selected)
      this.selected = []
    }
  }

  async rearrange() {
    // Hide Cards (Don't use updateDisplay, since it will reorder before hide)
    this.display = this.display.map(({ delay, card }) => ({ card, delay, remove: true }))
    await this.updateComplete
    await milliseconds(ANIMATION_DURATION)

    // Shuffle order indexs
    for (let i = this.cardOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cardOrder[i], this.cardOrder[j]] = [this.cardOrder[j], this.cardOrder[i]]
    }

    // Show again
    this.display = this.cards.map((card, index) => ({
      card,
      remove: false,
      // delay: -1, // show instantly (maybe just update display?)
      delay: index, // Randomly spots
      // delay: this.cardOrder[index], // Random duration
    }))
  }

  protected update(changed: PropertyValues) {
    if (changed.has('cards')) {
      this.selected = []
      if ((changed.get('cards') as Card[])?.length) { // Remove cards no longer in the deck
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
    await milliseconds(ANIMATION_DURATION)
    const cardsInDisplay = this.display.map(({ card: c }) => c)
    let next = 0
    this.display = this.cards.map(card => ({
      card,
      remove: false,
      delay: cardsInDisplay.includes(card) ? -1 : next++,
    }))
  }

  private toggleCard(index: number) {
    const selected = new Set(this.selected)
    if (selected.has(index))
      selected.delete(index)
    else
      selected.add(index)
    this.selected = [...selected]
    this.dispatchEvent(new CustomEvent('selected', { detail: { index, selected: selected.has(index) } }))
  }

  protected readonly render = () => this.display.map(({ remove, delay, card }, index) => html`
    <sets-card
      part="card card-${remove ? 'removal' : 'entrance'}"
      ?zoom=${remove || (delay >= 0 && !this.previousSelection)}
      index=${this.cardOrder[index]}
      delay=${delay}
      ?out=${remove}
      ?interactive=${!remove}
      ?selected=${this.selected.includes(index)}
      ?shake=${this.shake && this.previousSelection?.has(index)}
      ?hint=${this.hint.includes(index)}
      opacity=${card.opacity}
      color=${card.color}
      shape=${card.shape}
      quantity=${card.quantity}
      @click=${() => !remove && this.toggleCard(index)}
    ></sets-card>`)
}
