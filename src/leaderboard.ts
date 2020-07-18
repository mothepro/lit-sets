import { LitElement, customElement, property, html, css } from 'lit-element'
import { Player } from 'sets-game-engine'

import '@material/mwc-list'

@customElement('sets-leaderboard')
export default class extends LitElement {

  @property({ type: Array, reflect: true })
  scores: number[] = []
  
  @property({ type: Array, reflect: true })
  isBanned: boolean[] = []

  @property({ type: Array, reflect: true })
  names: string[] = []

  protected readonly render = () => this.scores.length == 1
    ? html`Your score is ${this.scores[0]}.`
    : html`<mwc-list roottabble>${this.scores.map((score, index) => html`
      ${index != 0 ? html`<li divider padded role="separator"></li>` : ''}
      <mwc-list-item
        noninteractive
        hasMeta
        ?disabled=${this.isBanned[index]}>
        ${this.names[index]}
        <span slot="meta">${score}</span>
      </mwc-list-item>
    `)}</mwc-list>`
}
