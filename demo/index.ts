import { LitElement, customElement, property, html, css, internalProperty, PropertyValues } from 'lit-element'
import Game, { Player, Details, Card } from 'sets-game-engine'
import type { peers, broadcast, random } from 'lit-p2p'
import { TakeEvent, card } from '../index.js'

import 'lit-p2p'
import 'lit-confetti'
import '@mothepro/lit-chart'
import '@mothepro/lit-clock'
import '../index.js'

/**
 * Peer to Peer (and offline) version of the game of sets.
 * Must live inside a `<p2p-switch>` with the `slot="p2p"` attribute.
 */
@customElement('p2p-sets')
export default class extends LitElement {

  @property({ attribute: false })
  peers!: peers

  @property({ attribute: false })
  broadcast!: broadcast

  @property({ attribute: false })
  random!: random

  @internalProperty()
  protected confetti = 0

  @internalProperty()
  protected showClock = true

  /** The sets game engine */
  private engine!: Game

  /** The instance my player in the game engine */
  mainPlayer!: Player

  /** Scores of all the players every tick */
  runningScores: number[][] = []

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
  ...[...Array(10)].map((_, i) => css`
      ::part(for-${i}) {
        stroke: var(--chart-color-${i});
      }
      legend .for-${i} .block {
        background-color:  var(--chart-color-${i});
      }`)]

  updated(changed: PropertyValues) {
    if (changed.has('peers') && this.peers) {
      this.peers.map(this.bindPeer)
      delete this.engine // We need to remake this game
    }

    if (!this.engine && this.peers && this.random) {
      // Shuffle cards
      const cards = [...Array(Details.COMBINATIONS)].map((_, i) => Card.make(i))
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * i)
          ;[cards[j], cards[i]] = [cards[i], cards[j]]
      }

      this.engine = new Game([...Array(this.peers.length)].map(() => new Player), cards)

      // Set main player
      for (const [index, { isYou }] of this.peers.entries())
        if (isYou)
          this.mainPlayer = this.engine.players[index]

      // Reset running scores
      this.runningScores = this.engine.players.map(() => [])

      // Refresh when market changes OR when the player performs some actions. */
      this.engine.filled
        .on(() => this.requestUpdate())
        .then(() => {
          this.confetti = 100
          setTimeout(() => this.confetti = 0, 10 * 1000)
        })
      this.mainPlayer.hintUpdate.on(() => this.requestUpdate())
      this.mainPlayer.unban.on(() => this.requestUpdate())
      this.mainPlayer.ban.on(() => this.requestUpdate())
    }
  }

  /** Works on the engine on behalf of a peer */
  private bindPeer = async ({ message, close }: peers[0], index: number) => {
    try {
      for await (const data of message)
        switch ((data as ArrayBuffer).byteLength ?? 0) {
          case 1: // Hint
            this.engine.takeHint(this.engine.players[index])
            break

          case 3: // Take
            //TODO: pack this to 1 (or 2) bytes, using `detail` as a boolean list
            this.engine.takeFromMarket(
              this.engine.players[index],
              [...new Uint8Array(data as ArrayBuffer)] as [number, number, number])
            break

          default:
            throw Error(`Unexpected data from ${name}: ${data}`)
        }
    } catch (error) {
      this.dispatchEvent(new ErrorEvent('p2p-error', { error }))
      console.error('Lost connection with', name, error)
    }
    close()
  }

  private get winnerText() {
    const winners: string[] = []
    for (const [index, { score }] of this.engine.players.entries())
      if (score == this.engine.maxScore)
        winners.push(this.peers[index].isYou
          ? 'You'
          : this.peers[index].name)
    return `${winners.join(' & ')} Win${winners.length == 1 && winners[0] != 'You' ? 's' : ''}`
  }

  protected readonly render = () => this.engine && this.mainPlayer && (
    this.engine.filled.isAlive
      // In game
      ? html`
      <lit-sets
        part="sets"
        ?hint-available=${this.mainPlayer.hintCards.length < 3}
        ?can-take=${!this.mainPlayer.isBanned}
        show-label
        take-on-key="Enter"
        .cards=${this.engine.cards}
        .hint=${this.mainPlayer.hintCards}
        @take=${({ detail }: TakeEvent) => this.broadcast(new Uint8Array(detail))}
        @hint=${() => this.broadcast(new Uint8Array([0]))}
      ></lit-sets>
      <sets-leaderboard
        part="leaderboard ${`leaderboard-${this.engine.players.length == 1 ? 'simple' : 'full'}`}"
        .players=${this.engine.players}
        .names=${this.peers?.map(peer => peer.name) ?? []}
      ></sets-leaderboard>
      <lit-clock
        part="clock"
        ?hidden=${!this.showClock}
        ?pause-on-blur=${this.engine.players.length == 1}
        @tick=${() => this.engine.players.map(({ score }, index) => this.runningScores[index].push(score))}
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
      ${console.log(this.engine, this.mainPlayer, this.engine.filled.isAlive)}
      <lit-confetti gravity=1 count=${this.confetti}></lit-confetti>
      ${this.engine.players.length > 1
          ? html`<h2 part="title">${this.winnerText}!</h2>` : ''}
      <lit-chart
        part="chart"
        width="500"
        height="300"
        .data=${this.runningScores}
      ></lit-chart>
      ${this.engine.players.length > 1 // TODO legend should live inside the chart
          ? html`
        <legend part="legend">${this.peers.map(({ name }, index) => html`
          <div part="legend-for legend-for-${index}" class="for for-${index}">
            <div class="block"></div>
            ${name}
          </div>`)}
        </legend>` : ''}`)
}
