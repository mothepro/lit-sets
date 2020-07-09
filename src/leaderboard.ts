import { LitElement, customElement, property, html, css } from 'lit-element'
import { Player } from 'sets-game-engine'

import '@material/mwc-list'

@customElement('sets-leaderboard')
export default class extends LitElement {

  @property({type: Array})
  players: Player[] = []

  @property({ type: Array })
  names: string[] = []

  static readonly styles = css`
    aside {
      float: right;
    }`
  
  protected updated() {
    for (const player of this.players) {
      player.ban.on(() => this.requestUpdate())
      player.unban.on(() => this.requestUpdate())
      player.take.on(() => this.requestUpdate())
      player.hintUpdate.on(() => this.requestUpdate())
    }
  }

  protected readonly render = () => this.players.length == 1
    ? html`Your score is ${this.players[0].score}.`
    : html`<mwc-list roottabble>${this.players.map((player, index) => html`
      <mwc-list-item
        noninteractive
        ?disabled=${player.isBanned}>
        ${this.names[index]}
        <aside>${player.score}</aside>
      </mwc-list-item>
    `)}</mwc-list>`
}
