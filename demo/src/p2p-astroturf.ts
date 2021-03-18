import type litP2P from 'lit-p2p'
import type P2PSets from './p2p-sets'
import type { Peer } from '@mothepro/fancy-p2p'

import { customElement, html, internalProperty, LitElement, property } from 'lit-element'
import { foreverStrings } from '@mothepro/emojis'
import { MockPeer } from '@mothepro/fancy-p2p'
import { random, milliseconds } from './util.js'
import AstroPeer, { Tuple } from './AstroPeer.js'

const
  litP2pElement = document.querySelector('lit-p2p')! as litP2P,
  p2pDemoElemeent = document.querySelector('p2p-sets')! as P2PSets


@customElement('p2p-astroturf')
export default class extends LitElement {
  @property({ type: Array, attribute: 'player-names' })
  names: string[] = []

  @property({ type: String, attribute: 'player-name-prefix' })
  namePrefix: string = 'Anonymous'

  @property({ type: Number, attribute: 'player-name-chance' })
  playerNameChance = 0

  @property({ type: Number, attribute: 'player-add-delay' })
  playerAddDelay: Tuple = [500, 1000]

  @property({ type: Number, attribute: 'player-add-initial-scale' })
  playerAddInitialScale = 1

  @property({ type: Number, attribute: 'player-remove-delay' })
  playerRemoveDelay: Tuple = [10000, 20000]

  @property({ type: Number, attribute: 'player-max' })
  playerMax = 10

  @property({ type: Array, attribute: 'delay-scale' })
  delayScale: Tuple = [1, 1]

  @property({ type: Array, attribute: 'round-delay' })
  roundDelay: Tuple = [0, 0]

  // Taking a bad set
  @property({ type: Array, attribute: 'failure-rate' })
  failureRate: Tuple = [0, 1]

  @property({ type: Array, attribute: 'failure-rate-2' })
  failureAgainRate: Tuple = [0, 1]

  @property({ type: Array, attribute: 'failure-delay-1' })
  failureDelay1: Tuple = [0, 0]

  @property({ type: Array, attribute: 'failure-delay-2' })
  failureDelay2: Tuple = [0, 0]

  // Taking a hint
  @property({ type: Array, attribute: 'hint-rate' })
  hintRate: Tuple = [0, 1]

  @property({ type: Array, attribute: 'hint-delay-1' })
  hintDelay1: Tuple = [0, 0]

  @property({ type: Array, attribute: 'hint-delay-2' })
  hintDelay2: Tuple = [0, 0]

  @property({ type: Array, attribute: 'hint-delay-3' })
  hintDelay3: Tuple = [0, 0]

  @internalProperty()
  private players: string[] = []

  @internalProperty()
  private selected: Set<number> = new Set

  private backupNames = foreverStrings()

  private get canMake() {
    return litP2pElement.minPeers < this.selected.size && this.selected.size < litP2pElement.maxPeers 
  }

  protected async firstUpdated() {
    await milliseconds(this.playerAddInitialScale * random(this.playerAddDelay))
    while (true) {
      await milliseconds(random(this.playerAddDelay))
      this.addPlayer(Math.random() < this.playerNameChance
        ? this.names[Math.trunc(Math.random() * this.names.length)]
        : `${this.namePrefix} ${this.backupNames.next().value}`.trim(),
        random(this.playerRemoveDelay))
    }
  }

  private async addPlayer(name: string, ms = 0) {
    if (this.players.length >= this.playerMax)
      return
    
    this.players = [...new Set(this.players).add(name)]
    if (ms) {
      await milliseconds(ms)
      this.selected.delete(this.players.indexOf(name))
      this.players = this.players.filter(player => player != name)
    }
  }

  private async makeGroup() {
    if (!this.canMake)
      return
    
    // The peers (before going offline)... should shuffle, ideally
    const peers: Peer[] = [
      new MockPeer(litP2pElement.getAttribute('name') ?? 'Me')
    ]

    for (const index of this.selected)
      peers.push(new AstroPeer(
        p2pDemoElemeent,
        this.players[index],
        {
          failure: random(this.failureRate),
          failureAgain: random(this.failureAgainRate),
          hint: random(this.hintRate),
        }, {
          scale: random(this.delayScale),
          round: this.roundDelay,
          failure: [this.failureDelay1, this.failureDelay2],
          hint: [this.hintDelay1, this.hintDelay2, this.hintDelay3]
        },
      ))
    
    // TODO wait a bit to make it feel real
    // await milliseconds(1000 + 4000 * Math.random())

    // Hide online/offline
    document.querySelectorAll('[toggle-online]')
      .forEach(e => e.toggleAttribute('hidden', true))

    // Go offline and wait for complete disconnection
    litP2pElement.setAttribute('state', 'astroturf')
    await new Promise<void>(resolve => new MutationObserver(() => litP2pElement.getAttribute('state') == '-1' && resolve())
      .observe(litP2pElement, { attributes: true, attributeFilter: ['state'] }))
    
    p2p = {
      peers,
      broadcast: peers[0].send,
      random: p2p.random,
    }

    dispatchEvent(new CustomEvent('p2p-astroturf'))
  }

  protected render = () => this.players.length
    // Show the list of "players"
    ? html`
    <mwc-list
      part="client-list"
      rootTabbable
      multi
      @selected=${({ detail: { index } }: CustomEvent<{ index: Set<number> }>) => this.selected = index}
    >${[...this.players].map((player, index) => html`
      <mwc-check-list-item
        ?selected=${this.selected.has(index)}
      >${player}</mwc-check-list-item>`)}
    </mwc-list>
    ${this.canMake ? html`
      <mwc-fab
        part="make-group"
        icon="done"
        label="Make Group"
        @click=${this.makeGroup}
      ></mwc-fab>`: ''}`

    // Show the default
    :  html`<slot></slot>`
}

