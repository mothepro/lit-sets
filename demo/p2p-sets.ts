import { LitElement, customElement, html, css, internalProperty, PropertyValues, property } from 'lit-element'
import Game, { Player, Details, Card, CardSet } from 'sets-game-engine'
import type { TakeEvent } from '../index.js'
import { milliseconds } from '../src/helper.js'

import 'lit-confetti'         // <lit-confetti>
import '@mothepro/lit-chart'  // <lit-chart>
import '@mothepro/lit-clock'  // <lit-chart>
import '../index.js'          // <lit-sets>

/**
 * Peer to Peer (and offline) version of the game of sets.
 * Should live inside a `<lit-p2p>`.
 */
@customElement('p2p-sets')
export default class extends LitElement {
  @property({ type: Boolean, reflect: true, attribute: 'show-clock'})
  showClock = false

  @internalProperty()
  protected confetti = 0

  @internalProperty()
  protected restartClock = false

  /** The sets game engine */
  private engine!: Game

  /** The instance my player in the game engine */
  private mainPlayer!: Player

  /** Scores of all the players every tick */
  private runningScores: number[][] = []

  static readonly styles = [css`
    lit-confetti {
      position: fixed;
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

  protected async firstUpdated() {
    addEventListener('p2p-update', this.go)
    // Update the final chart when when the screen resizes
    addEventListener('resize', () => p2p && this.engine && this.mainPlayer && !this.engine.filled.isAlive && this.requestUpdate())
    this.go()
  }

  updated(changed: PropertyValues) {
    if (changed.has('restartClock') && this.restartClock)
      this.restartClock = false
  }

  private go = async () => {
    // Shuffle all cards using shared p2p RNG
    const cards: Card[] = [...Array(Details.COMBINATIONS)].map((_, i) => Card.make(i))
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.abs(p2p.random(true)) % i;
      [cards[j], cards[i]] = [cards[i], cards[j]]
    }

    // Make the game engine! And bind each peer to a player
    // TODO add parameters to the Player to change how timeouts, bans, hints and taking sets affect the score.
    this.engine = new Game([...Array(p2p.peers.length)].map(() => new Player), cards)
    p2p.peers.map(this.bindPeer)

    // Reset running scores
    this.runningScores = this.engine.players.map(() => [])
    this.restartClock = true

    // Refresh when market changes OR when the player performs some actions that could change score. */
    for (const player of this.engine.players) {
      player.ban.on(() => this.requestUpdate())
      player.unban.on(() => this.requestUpdate())
      player.take.on(() => this.requestUpdate())
      player.hintUpdate.on(() => this.requestUpdate())
    }
      
    for await (const _ of this.engine.filled)
      this.requestUpdate()
    this.confetti = 100
    await milliseconds(10 * 1000)
    this.confetti = 0
  }

  /** Works on the engine on behalf of a peer & sets main player */
  private bindPeer = async ({ message, close, isYou, name }: typeof p2p.peers[0], index: number) => {
    if (isYou)
      this.mainPlayer = this.engine.players[index]

    try {
      for await (const data of message)
        if (data instanceof ArrayBuffer)
          switch (data.byteLength) {
            case 1: // Hint
              this.engine.takeHint(this.engine.players[index])
              break

            case 3: // Take
              const indexs = new Set(new Uint8Array(data))
              // TODO: pack this to 1 (or 2) bytes, using `detail` as a boolean list
              // https://github.com/mothepro/sets-game/blob/master/src/messages.ts
              this.engine.takeSet(
                this.engine.players[index],
                this.engine.cards.filter((_, i) => indexs.has(i)) as CardSet)
              break

            default:
              throw Error(`Unexpected data from ${name}: ${data}`)
          }
    } catch (error) {
      error.peer = name
      this.dispatchEvent(new ErrorEvent('p2p-error', { error, bubbles: true, composed: true }))
    }
    close()
  }

  private get winnerText() {
    const winners: string[] = []
    for (const [index, { score }] of this.engine.players.entries())
      if (score == this.engine.maxScore)
        winners.push(p2p.peers[index].isYou
          ? 'You'
          : p2p.peers[index].name)
    return `${winners.join(' & ')} Win${winners.length == 1 && winners[0] != 'You' ? 's' : ''}`
  }

  protected readonly render = () => p2p && this.engine && this.mainPlayer && (this.engine.filled.isAlive
    // In game
    ? html`
      <lit-sets
        part="sets"
        ?hint-available=${this.mainPlayer.hintCards.length < 3}
        ?can-take=${!this.mainPlayer.isBanned}
        show-label
        take-on-key="Enter"
        hint-on-key="h"
        .cards=${this.engine.cards}
        .hint=${this.mainPlayer.hintCards.map(card => this.engine.cards.indexOf(card))}
        @take=${({ detail }: TakeEvent) => p2p.broadcast(new Uint8Array(detail))}
        @hint=${() => p2p.broadcast(new Uint8Array([0]))}
      ></lit-sets>
      <sets-leaderboard
        part="leaderboard ${`leaderboard-${this.engine.players.length == 1 ? 'simple' : 'full'}`}"
        .scores=${this.engine.players.map(({score}) => score)}
        .isBanned=${this.engine.players.map(({isBanned}) => isBanned)}
        .names=${p2p.peers?.map(peer => peer.name) ?? []}
      ></sets-leaderboard>
      <lit-clock
        part="clock"
        .ticks=${this.restartClock ? 0 : null}
        ?hidden=${!this.showClock}
        ?pause-on-blur=${this.engine.players.length == 1}
        @tick=${() => this.engine.players
          .map(({ score }, index) => this.engine.filled.isAlive && this.runningScores[index].push(score))}
      ></lit-clock>
      <mwc-fab
        part="clock-toggle"
        class="clock-toggle"
        mini
        @click=${() => this.showClock = !this.showClock}
        icon=${this.showClock ? 'timer_off' : 'timer'}
        label=${this.showClock ? 'Hide time' : 'Show time'}
        title=${this.showClock ? 'Hide time' : 'Show time'}
      ></mwc-fab>`

    // Game over
    : html`
      <lit-confetti gravity=1 count=${this.confetti}></lit-confetti>
      ${this.engine.players.length > 1 ? html`<h2 part="title">${this.winnerText}!</h2>` : ''}
      Finished ${this.runningScores[0].length} seconds!<br/>
      <lit-chart
        part="chart"
        width=${document.body.clientWidth}
        height=${Math.floor(document.body.clientWidth * 4 / 9)}
        .data=${this.runningScores}
      ></lit-chart>
      ${this.engine.players.length > 1 // TODO legend should live inside the chart
        ? html`
        <legend part="legend">${p2p.peers.map(({ name }, index) => html`
          <div part="legend-for legend-for-${index}" class="for for-${index}">
            <div class="block"></div>
            ${name}
          </div>`)}
        </legend>` : ''}`)
}
