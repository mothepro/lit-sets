import type { Peer } from '@mothepro/fancy-p2p'
import type LitSets from '../index.js'
import type { TakeEvent } from '../index.js'
import type LitClock from '@mothepro/lit-clock'
import { LitElement, customElement, html, css, internalProperty, PropertyValues, property, query } from 'lit-element'
import Game, { Player, Details, Card, CardSet } from 'sets-game-engine'
import { milliseconds } from '../src/helper.js'
import { getNeededCard, linear, Status } from './util.js'

import 'lit-confetti'         // <lit-confetti>
import '@mothepro/lit-chart'  // <lit-chart>
import '@mothepro/lit-clock'  // <lit-chart>
import '../index.js'          // <lit-sets>

export type StartEvent = CustomEvent<void>
export type FinishEvent = CustomEvent<number>
export type DifficultyChangeEvent = CustomEvent<void>
export type GameTakeEvent = CustomEvent<boolean>
export type RearrangeEvent = CustomEvent<void>
export type RestartEvent = CustomEvent<void>
export type SelectedEvent = CustomEvent<void>
export type HintEvent = CustomEvent<boolean>

declare global {
  interface HTMLElementEventMap {
    'game-start': StartEvent
    'game-finish': FinishEvent
    'game-restart': RestartEvent
    'game-difficulty': DifficultyChangeEvent
    'game-rearrange': RearrangeEvent
    'game-take': GameTakeEvent
    'game-hint': HintEvent
    'game-selected': SelectedEvent
  }
}

const compliments = [
  'Good work',
  'Wow',
  'Nice Job',
  'Fantastic',
]
  
/**
 * Peer to Peer (and offline) version of the game of sets.
 * Should live inside a `<lit-p2p>`.
 */
@customElement('p2p-sets')
export default class extends LitElement {
  @property({ type: Boolean, reflect: true, attribute: 'show-clock'})
  showClock = false

  @property({ type: Boolean, reflect: true, attribute: 'easy-mode' })
  easyMode = false

  @property({ type: Number, reflect: true, attribute: 'score-gain-initial' })
  scoreGainInitial = 1

  @property({ type: Number, reflect: true, attribute: 'score-gain-increment' })
  scoreGainIncrement = 0

  @property({ type: Number, reflect: true, attribute: 'ban-timeout-initial' })
  banTimeoutInitial = 0

  @property({ type: Number, reflect: true, attribute: 'ban-timeout-increment' })
  banTimeoutIncrement = 0

  @property({ type: Number, reflect: true, attribute: 'hint-cost-initial' })
  hintCostInitial = 0

  @property({ type: Number, reflect: true, attribute: 'hint-cost-increment' })
  hintCostIncrement = 0

  @property({ type: Number, reflect: true, attribute: 'ban-cost-initial' })
  banCostInitial = 0

  @property({ type: Number, reflect: true, attribute: 'ban-cost-increment' })
  banCostIncrement = 0

  @internalProperty()
  protected confetti = 0

  @query('lit-clock')
  protected litClock?: LitClock

  /** Indexs of peers who wanna go again. If all p2p.peers are here, start the game again. */
  @internalProperty()
  protected wantRematch: number[] = []

  /** The sets game engine */
  engine!: Game

  /** Cached `instance` my player in the game engine */
  private mainPlayer!: Player

  /** Cached `index` my player in the game engine */
  private mainIndex!: number

  /** Scores of all the players every tick */
  private runningScores: number[][] = []

  /** The compliment to tell the user if they win */
  private compliment = ''

  private cardsLeft = 0
  
  protected takeFailed = false

  static readonly styles = [css`
    @keyframes fadeIn {
      from { opacity: 0; }
      to {   opacity: 1; }
    }
    mwc-fab[disabled] { /* Since mwc-fab[disabled] is not supported... SMH */
      pointer-events: none;
      cursor: default !important;
      --mdc-theme-on-secondary: var(--mdc-button-disabled-ink-color, rgba(0, 0, 0, 0.38));
      --mdc-theme-secondary: var(--mdc-button-disabled-fill-color, rgba(0, 0, 0, 0.12));
      --mdc-fab-box-shadow: none;
      --mdc-fab-box-shadow-hover: none;
      --mdc-fab-box-shadow-active: none;
      --mdc-ripple-fg-opacity: 0;
    }

    lit-confetti {
      position: fixed;
    }

    /* Easy mode icon should be a "slow" icon instead */
    [flipX] {
      transform: scaleX(-1);
    }

    /* Chart */
    ::part(line) {
      stroke-width: var(--chart-line-width, 2px);
    }

    ::part(circle) {
      r: var(--chart-circle-radius, 1);
      stroke-width: var(--chart-circle-width, 2px);
    }

    ::part(circle):hover {
      stroke-width: var(--chart-line-width-hover, 15px);
    }

    legend .block {
      display: inline-block;
      border: thin solid black;
      position: relative;
      width: 1em;
      height: 1em;
    }`,

  // CSS vars for the colors in the chart
  ...[...Array(10).keys()].map(i => css`
      ::part(for-${i}) {
        stroke: var(--chart-color-${i});
      }
      legend .for-${i} .block {
        background-color:  var(--chart-color-${i});
      }`)]

  get winnerText() { // this is a mess lol
    if (this.engine.filled.isAlive)
      return ''
    
    let ret = ''
    const winners: string[] = []

    for (const [index, { score }] of this.engine.players.entries())
      if (score == this.engine.maxScore)
        winners.push(p2p.peers[index].isYou
          ? 'You'
          : p2p.peers[index].name)
    
    if (winners[0] == 'You') // Compliment if you won
      ret += this.compliment + '! '
    
    if (this.engine.players.length > 1) // Multiplayer
      ret += winners.join(' & ')
        + ' Win'
        + (winners.length == 1 && winners[0] != 'You' ? 's' : '')
    return ret.trim()
  }

  protected firstUpdated() {
    // Update peers and restart the game
    addEventListener('p2p-update', () => p2p?.peers.map(this.bindPeer) && this.restartGame())
    
    // Update the final chart when when the screen resizes
    addEventListener('resize', () => p2p && this.engine && !this.engine.filled.isAlive && this.requestUpdate())

    // Refresh selected count and remove shake animation after selecting a card
    this.addEventListener('game-selected', () => this.takeFailed = this.requestUpdate() && false)

    // Start game and bind peers
    p2p?.peers.map(this.bindPeer)
  }

  protected updated(changed: PropertyValues) {
    if (changed.has('easyMode') && p2p.peers.length == 1) {
      this.restartGame()
        
      // Not first time & solo only
      if (typeof changed.get('easyMode') != 'undefined')
        this.dispatchEvent(new CustomEvent('game-difficulty'))
    }
  }

  private async restartGame() {
    if (p2p.peers.length != 1)
      this.easyMode = false
    
    // Make the players
    // For multiplayer uses generators defined at the top will be used.
    // TODO For singleplayer use the default rules... for now
    const players = [...Array(p2p.peers.length)].map(() =>
      new Player(
        p2p.peers.length == 1 ? undefined : linear(this.banTimeoutIncrement, this.banTimeoutInitial),
        p2p.peers.length == 1 ? undefined : linear(this.hintCostIncrement, this.hintCostInitial),
        p2p.peers.length == 1 ? undefined : linear(this.banCostIncrement, this.banCostInitial),
        p2p.peers.length == 1 ? undefined : linear(this.scoreGainIncrement, this.scoreGainInitial)))
    
    // Number of cards to make
    this.cardsLeft = this.easyMode
      // Easy mode - remove opacity
      // This is SAFE because opacity is the last feature that's incremented (most signifigant bit/feature)
      ? (Details.COUNT - 1) ** Details.SIZE
      // Normal mode - all cards
      : Details.COMBINATIONS
    
    // Makes all possible cards
    // Shuffle deck using shared RNG
    const deck = [...Array(this.cardsLeft)].map((_, i) => Card.make(i))
    
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.abs(p2p.random(true)) % i;
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }

    // Make the game :)
    this.engine = new Game(players, deck)

    // Cache these for the render method
    for (const [index, { isYou }] of p2p.peers.entries())
      if (isYou) {
        this.mainPlayer = this.engine.players[index]
        this.mainIndex = index
      }

    // Reset things
    this.runningScores = this.engine.players.map(() => [])
    if (this.litClock)
      this.litClock.ticks = 0
    this.wantRematch = []
    this.confetti = 0
    this.compliment = compliments[Math.trunc(Math.random() * compliments.length)] 

    // Refresh when market changes OR when the player performs some actions that could change score. */
    for (const player of this.engine.players) {
      player.ban.on(() => this.requestUpdate())
      player.unban.on(() => this.requestUpdate())
      player.take.on(() => this.requestUpdate())
      player.hintUpdate.on(() => this.requestUpdate())
    }

    // Shake when we are banned
    this.mainPlayer.ban.on(() => this.takeFailed = true)

    this.dispatchEvent(new CustomEvent('game-start'))
    for await (const _ of this.engine.filled)
      this.requestUpdate()
    
    // push the final scores and drop confetti
    this.engine.players.map(({ score }, index) => this.runningScores[index].push(Math.max(0, score)))
    this.dispatchEvent(new CustomEvent('game-finish', { detail: this.runningScores[0].length }))
    this.confetti = Math.trunc(Math.min(200, Math.max(35, document.body.clientWidth / 10))) // 35 <= width / 10 <= 200
    await milliseconds(10 * 1000)
    this.confetti = 0
  }

  /** Works on the engine on behalf of a peer & sets main player */
  private bindPeer = async ({ message, close, isYou, name }: Peer, index: number) => {
    try {
      for await (const data of message)
        if (data instanceof ArrayBuffer) {
          const view = new Uint8Array(data)
          switch (view.byteLength) {
            case 1: // Status Bit
              switch (view[0]) {
                case Status.HINT:
                  const detail = this.engine.takeHint(this.engine.players[index])
                  if (isYou)
                    this.dispatchEvent(new CustomEvent('game-hint', { detail }))
                  break
                
                case Status.REMATCH:
                  this.wantRematch = [...new Set(this.wantRematch).add(index)]
                  if (this.wantRematch.length == p2p.peers.length) {
                    this.restartGame()
                    this.dispatchEvent(new CustomEvent('game-restart'))
                  }
                  break
                
                default:
                  throw Error(`Unexpected status bit: 0x${view[0].toString(16).padStart(2, '0').toUpperCase()}`)
              }
              break

            case 3: // Take
              const indexs = new Set(view),
                // TODO: pack this to 1 (or 2) bytes, using `detail` as a boolean list
                // https://github.com/mothepro/sets-game/blob/master/src/messages.ts
                detail = this.engine.takeSet(
                  this.engine.players[index],
                  this.engine.cards.filter((_, i) => indexs.has(i)) as CardSet)
              
              if (isYou)
                this.dispatchEvent(new CustomEvent('game-take', { detail }))

              if (detail) // allows new cards to zoom in again
                (this.renderRoot.firstElementChild as LitSets).previousSelection = undefined
              break

            default:
              throw Error(`${view.byteLength} unexpected bytes: 0x${[...view]
                .map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' 0x')}`)
          }
        } else
          throw Error(`Expected an ArrayBuffer but got a ${typeof data}: ${JSON.stringify(data)} "${data}"`)
    } catch (error) {
      error.peer = name
      this.dispatchEvent(new ErrorEvent('p2p-error', { error, bubbles: true, composed: true }))
    }
    // Ensure the connection is closed. Dont care if this throws :)
    try {
      close()
    } catch { } 

    if (!isYou) {
      // These can't stack anymore... wtf
      // https://github.com/angular/components/issues/9860
      const notification = document.createElement('mwc-snackbar')
      notification.setAttribute('open', '')
      notification.setAttribute('labelText', `${name} disconnected.`)
      notification.addEventListener('MDCSnackbar:closed', () => document.body.removeChild(notification))
      document.body.appendChild(notification)
    }
  }

  // TODO cache this
  private getSelectedCard(index: number) {
    const litSets = this.renderRoot.firstElementChild as LitSets | null
    return litSets?.cards[ litSets.selected[index] ]
  }

  private get selectedCount() {
    return (this.renderRoot.firstElementChild as LitSets | null)?.selected?.length ?? 0
  }

  protected readonly render = () => p2p && this.engine && (this.engine.filled.isAlive
    // In game
    ? html`
      <lit-sets
        part="sets"
        ?shake=${this.takeFailed}
        .cards=${this.engine.cards}
        .hint=${this.mainPlayer.hintCards.map(card => this.engine.cards.indexOf(card))}
        @take=${({ detail }: TakeEvent) => p2p.broadcast(new Uint8Array(detail))}
        @selected=${() => this.dispatchEvent(new CustomEvent('game-selected'))}
      ></lit-sets>
      <lit-clock
        part="clock"
        ?hidden=${!this.showClock}
        ?pause-on-blur=${this.engine.players.length == 1}
        @tick=${() => this.engine.players
          .map(({ score }, index) => this.engine.filled.isAlive && this.runningScores[index].push(Math.max(0, score)))}
      ></lit-clock>
      <mwc-fab
        part="bottom-btn clock-toggle"
        mini
        icon=${this.showClock ? 'timer_off' : 'timer'}
        label=${this.showClock ? 'Hide time' : 'Show time'}
        title=${this.showClock ? 'Hide time' : 'Show time'}
        @click=${() => this.showClock = !this.showClock}
      ></mwc-fab>
      <mwc-fab
        part="bottom-btn hint"
        mini
        ?disabled=${this.mainPlayer.hintCards.length >= 3}
        icon="lightbulb"
        label="Get Hint"
        title="Get a hint"
        @click=${() => p2p.broadcast(new Uint8Array([Status.HINT]))}
      ></mwc-fab>
      <mwc-fab
        part="bottom-btn rearrange"
        mini
        icon="shuffle"
        label="Rearrange cards"
        title="Rearrange cards on screen"
        @click=${() => {
          (this.renderRoot.firstElementChild as LitSets | null)?.rearrange()
          this.dispatchEvent(new CustomEvent('game-rearrange'))
        }}></mwc-fab>
      ${p2p.peers.length == 1 ? html`
        <mwc-fab
          part="bottom-btn difficulty"
          mini
          icon="speed"
          ?flipX=${!this.easyMode}
          label=${this.easyMode ? 'Standard' : 'Easy'}
          title=${this.easyMode ? 'Switch to standard mode' : 'Switch to easy mode'}
          @click=${() => this.easyMode = !this.easyMode}
        ></mwc-fab>` : ''}
      <mwc-fab
        part="bottom-btn take"
        extended
        icon="done_outline"
        label="Take Set"
        ?disabled=${this.mainPlayer.isBanned || this.selectedCount != 3}
        @click=${() => (this.renderRoot.firstElementChild as LitSets | null)?.takeSet()}
      ></mwc-fab>
      ${this.engine.players.length > 1 || this.engine.players[0].score > 0 ? html`
        <sets-leaderboard
          part="leaderboard leaderboard-${this.engine.players.length == 1 ? 'simple' : 'full'}"
          .max=${Math.trunc(this.cardsLeft / 3)}
          .scores=${this.engine.players.map(({ score }) => score)}
          .isBanned=${this.engine.players.map(({isBanned}) => isBanned)}
          .names=${p2p.peers?.map(peer => peer.name) ?? []}
        ></sets-leaderboard>` : ''}${
      
      // Big hint
      this.easyMode
        && this.selectedCount == 2
        // Cache these cards for the render below
        && (firstCard = this.getSelectedCard(0)!)
        && (secondCard = this.getSelectedCard(1)!)
        && (nextCard = getNeededCard(firstCard, secondCard)) ? html`
        <div part="tip">
          <slot name="pre-tip-text"></slot>
          <span part="tip-text">
            ${firstCard.color    == secondCard.color    ? 'the same color'    : 'different colors'},
            ${firstCard.shape    == secondCard.shape    ? 'the same shape'    : 'different shapes'}, and
            ${firstCard.quantity == secondCard.quantity ? 'the same quantity' : 'different quantities'}.
          </span>
          <slot name="post-tip-text"></slot>
          <sets-card
            part="tip-card"
            zoom
            opacity=${nextCard.opacity}
            shape=${nextCard.shape}
            quantity=${nextCard.quantity}
            color=${nextCard.color}
          ></sets-card>
        </div>` : ''}${
      
      // Mini guide
      // TODO show this as default as the child of a leaderboard slot
      this.engine.players.length == 1
        && this.engine.players[0].score == 0
        && this.selectedCount < 2
      ? html`<slot name="no-singleplayer-score"></slot>` : ''}`

    // Game over
    : html`
      <lit-confetti gravity="1" count=${this.confetti}></lit-confetti>
      <h2 part="title">${this.winnerText}</h2>
      <mwc-fab
        part="rematch"
        extended
        ?disabled=${this.wantRematch.includes(this.mainIndex)}
        icon="replay"
        label=${p2p.peers.length == 1 ? 'Play again' : 'Rematch'}
        @click=${() => p2p.broadcast(new Uint8Array([Status.REMATCH]))}
      ></mwc-fab>
      <lit-clock
        part="clock"
        pause
        ticks=${this.runningScores[0].length}
      ></lit-clock>
      <div part="chart-holder">
        <lit-chart
          part="chart"
          width=${Math.trunc(Math.min(1024, document.body.clientWidth - 16 - 16) - 20 - 20)}
          height=${Math.trunc((4 / 9) * Math.min(1024, document.body.clientWidth - 16 - 16) - 20 - 20)}
          .data=${this.runningScores}
        ></lit-chart>
        <div part="axis-x">Time</div>
        <div part="axis-y">${p2p.peers.length > 1 ? 'Score' : 'Sets Taken'}</div>
        ${this.engine.players.length > 1 ? /* TODO legend should live inside the chart */ html`
          <legend part="legend">${p2p.peers.map(({ name }, index) => html`
            <div part="legend-for legend-for-${index}" class="for for-${index}">
              <div part="legend-block" class="block"></div>
              ${name}
            </div>`)}
          </legend>` : ''}
      </div>
      <slot name="game-over"></slot>`)
}

// TODO update temp vars (used to create solution) to getters?
let nextCard, firstCard, secondCard
