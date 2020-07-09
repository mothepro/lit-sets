import { LitElement, customElement, property, html, css, internalProperty, PropertyValues } from 'lit-element'
import Game, { Player } from 'sets-game-engine'
import type { peers, broadcast, random } from 'lit-p2p'
import type { TakeEvent } from '../index.js'

import 'lit-p2p'
import 'lit-confetti'
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

  /** The sets game engine */
  private engine!: Game

  /** The instance my player in the game engine */
  mainPlayer!: Player

  static readonly styles = css`
    lit-confetti {
      position: fixed;
    }`

  updated(changed: PropertyValues) {
    if (changed.has('peers') && this.peers) {
      this.peers.map(this.bindPeer)
      delete this.engine // We need to remake this thing
    }

    if (!this.engine && this.peers)
      this.bindEngine()
  }

  /** Updates this element when the engine changes. */
  private async bindEngine() {
    this.engine = new Game

    this.bindMainPlayer()

    for await (const _ of this.engine.filled)
      this.requestUpdate()
    this.confetti = 100
    setTimeout(() => this.confetti = 0, 10 * 1000)
  }

  /** Sets main player & updates this element when the player performs some actions. */
  private async bindMainPlayer() {
    for (let i = 0; i < this.peers.length; i++)
      if (this.peers[i].isYou)
        this.mainPlayer = this.engine.players[i]

    this.mainPlayer.hintUpdate.on(() => console.log(this.requestUpdate()))
    this.mainPlayer.unban.on(() => this.requestUpdate())
    this.mainPlayer.ban.on(() => this.requestUpdate())
  }

  /** Works on the engine on behalf of a peer */
  private bindPeer = async ({ isYou, message }: peers[0], index: number) => {
    try {
      for await (const data of message) {
        console.log(data)
        if (data == 'hint')
          this.engine.takeHint(this.mainPlayer)
        else
          this.engine.takeSet(this.mainPlayer, data)
      }
    } catch (error) {
      this.dispatchEvent(new ErrorEvent('p2p-error', { error }))
    }
    close()
  }

  private takeSet({ detail }: TakeEvent) {
    this.broadcast(detail)
  }

  private getHint() {
    this.broadcast('hint')
  }

  protected readonly render = () => this.engine && this.mainPlayer && html`
    <lit-sets
      ?hint-available=${this.mainPlayer.hintCards.length < 3}
      ?can-take=${!this.mainPlayer.isBanned}
      show-label
      .cards=${this.engine.cards}
      .hint=${this.mainPlayer.hintCards}
      @take=${this.takeSet}
      @hint=${this.getHint}
    ></lit-sets>
    <sets-leaderboard
      .players=${this.engine.players}
      .names=${this.peers?.map(peer => peer.name) ?? []}
    ></sets-leaderboard>
    <lit-clock ?pause-on-blur=${this.engine.players.length == 1}></lit-clock>
    <lit-confetti gravity=1 count=${this.confetti}></lit-confetti>`
}
