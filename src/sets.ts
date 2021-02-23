import { LitElement, customElement, property, html, css, PropertyValues, internalProperty } from 'lit-element'
import type { Card } from 'sets-game-engine'
import { hasArrayChanged, milliseconds } from './helper.js'
import { animationDuration } from './card.js'

import '@material/mwc-fab' // <mwc-fab>
import './card.js'         // <sets-card>
import './leaderboard.js'  // <sets-leaderboard>

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

  /** Whether enough cards are selected to take */
  @property({ type: Boolean, attribute: 'can-take', reflect: true })
  protected canTake = false

  /** Whether can request a hint */
  @property({ type: Boolean, attribute: 'hint-allowed' })
  hintAllowed = false

  /** Whether can take a set */
  @property({ type: Boolean, attribute: 'take-allowed' })
  takeAllowed = false

  /** Key to press to take a set. */
  @property({ type: String, attribute: 'take-on-key' })
  takeOnKey = ''

  /** Key to press to take a hint. */
  @property({ type: String, attribute: 'hint-on-key' })
  hintOnKey = ''

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

  static readonly styles = css`
    .grid {
      display: grid;
      grid-template-columns: var(--sets-grid-template-columns, repeat(3, minmax(200px, 1fr)));
      gap: var(--sets-gap, 2em);
      justify-content: center;
      justify-items: stretch;
      align-items: stretch;
    }`

  firstUpdated() {
    // TODO move to global keybinds
    addEventListener('keypress', (event: KeyboardEvent) => {
      if (this.takeOnKey && event.key == this.takeOnKey) {
        event.preventDefault() // Don't select card
        this.takeSet()
      }
      else if (this.hintOnKey && event.key == this.hintOnKey && this.hintAllowed) {
        event.preventDefault()
        this.dispatchEvent(new CustomEvent('hint'))
      }
    })
  }

  update(changed: PropertyValues) {
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
    await milliseconds(animationDuration)
    let next = 0
    this.display = this.cards.map(card => ({
      card,
      remove: false,
      delay: this.display.map(({ card: c }) => c).includes(card) ? -1 : next++,
    }))
  }

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
    if (this.takeAllowed && this.canTake) {
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
    <slot name="take" @click=${this.takeSet}></slot>
    <slot name="hint" @click=${() => this.dispatchEvent(new CustomEvent('hint'))}></slot>`
}
