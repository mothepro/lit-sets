import { LitElement, customElement, property, html, css, PropertyValues, internalProperty } from 'lit-element'
import type { Card } from 'sets-game-engine'
import { hasArrayChanged, milliseconds } from './helper.js'
import { ANIMATION_DURATION } from './card.js'

import '@material/mwc-fab' // <mwc-fab>
import './card.js'         // <sets-card>
import './leaderboard.js'  // <sets-leaderboard>

export type TakeEvent = CustomEvent<[number, number, number]>
export type HintEvent = CustomEvent<void>
export type RearrangeEvent = CustomEvent<void>

declare global {
  interface HTMLElementEventMap {
    take: TakeEvent
    hint: HintEvent
    rearrange: RearrangeEvent
  }
}

/** Max cards we would show on screen. */
export const MAX_CARDS_COUNT = 21

@customElement('lit-sets')
export default class extends LitElement {

  /** Whether enough cards are selected to take */
  @property({ type: Boolean, attribute: 'can-take', reflect: true })
  protected canTake = false

  /** Whether can request a hint */
  @property({ type: Boolean, attribute: 'hint-allowed' })
  hintAllowed = false

  /** Whether can take a set */
  @property({ type: Boolean, attribute: 'take-allowed' })
  takeAllowed = false

  /** Sentence to inlcude to simplify (excludes opacity) */
  @property({ type: Boolean, attribute: 'helper-text' })
  helperText = false

  /** Cards in the market */
  @property({ type: Array, hasChanged: hasArrayChanged })
  cards: Card[] = []

  /** The cards that are labeled as hints */
  @property({ type: Array, hasChanged: hasArrayChanged, reflect: true })
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

  /** The order the cards should be shown in, handled by CSS. */
  private cardOrder = [...Array(MAX_CARDS_COUNT).keys()] // not reset on difficulty change lol

  static readonly styles = css`
  .grid {
    display: grid;
    grid-template-columns: var(--sets-grid-template-columns, repeat(3, minmax(200px, 1fr)));
    gap: var(--sets-gap, 2em);
    justify-content: center;
    justify-items: stretch;
    align-items: stretch;
  }`

  takeSet() {
    if (this.takeAllowed && this.canTake) {
      this.dispatchEvent(new CustomEvent('take', { detail: this.selected }))
      this.selected = []
    }
  }

  takeHint() {
    this.dispatchEvent(new CustomEvent('hint'))
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
    this.dispatchEvent(new CustomEvent('rearrange'))
  }

  protected update(changed: PropertyValues) {
    if (changed.has('selected'))
      this.canTake = this.selected.length == 3
    
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
  }

  protected readonly render = () => html`
    <div class="grid">${this.display.map(({ remove, delay, card }, index) => html`
      <sets-card
        part="card card-${remove ? 'removal' : 'entrance'}"
        zoom
        index=${this.cardOrder[index]}
        delay=${delay}
        ?out=${remove}
        ?interactive=${!remove}
        ?selected=${this.selected.includes(index)}
        ?hint=${this.hint.includes(index)}
        opacity=${card.opacity}
        color=${card.color}
        shape=${card.shape}
        quantity=${card.quantity}
        @click=${() => !remove && this.toggleCard(index)}
      ></sets-card>`)}
    </div>
    ${this.helperText && this.selected.length == 2 ? html`
      <span part="helper-text">
        The selected cards have
        ${this.cards[this.selected[0]].color == this.cards[this.selected[1]].color ? 'the same color' : 'different colors'},
        ${this.cards[this.selected[0]].shape == this.cards[this.selected[1]].shape ? 'the same shape' : 'different shapes'}, and
        ${this.cards[this.selected[0]].quantity == this.cards[this.selected[1]].quantity ? 'the same quantity' : 'different quantities'}.
      </span>
      <span part="solution-text">
        To complete the set, the next card must also be
        ${this.cards[this.selected[0]].color == this.cards[this.selected[1]].color ? 'the same color' : 'a different color'},
        ${this.cards[this.selected[0]].shape == this.cards[this.selected[1]].shape ? 'the same shape' : 'a different shape'}, and
        ${this.cards[this.selected[0]].quantity == this.cards[this.selected[1]].quantity ? 'the same quantity' : 'a different quantity'}
        from the selected cards.
      </span>` : ''}
    <slot name="take" @click=${this.takeSet}></slot>
    <slot name="hint" @click=${this.takeHint}></slot>
    <slot name="rearrange" @click=${this.rearrange}></slot>`
}
