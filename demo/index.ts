import { LitElement, customElement, property, html, css } from 'lit-element'
import Game from 'sets-game-engine'
import type { TakeEvent } from '../index.js'

import '@mothepro/lit-clock'
import '../index.js'

@customElement('p2p-sets')
export default class extends LitElement {

  private engine = new Game

  /** The index of my player in the game. */
  me = 0

  static readonly styles = css``

  private takeSet({ detail }: TakeEvent) {
    this.engine.takeSet(this.engine.players[this.me], detail)
  }

  private getHint() {
    this.engine.takeHint(this.engine.players[this.me])
  }

  protected readonly render = () => html`
    <lit-sets
      ?hint-available=${this.engine.players[this.me].hintCards.length < 3}
      ?can-take=${!this.engine.players[this.me].isBanned}
      show-label
      .cards=${this.engine.cards}
      .hint=${this.engine.players[this.me].hintCards}
      @take=${this.takeSet}
      @hint=${this.getHint}
    ></lit-sets>
    <sets-leaderboard
      .players=${this.engine.players}
    ></sets-leaderboard>
    <lit-clock
      ?pause-on-blur=${this.engine.players.length == 1}
    ></lit-clock>`
}
