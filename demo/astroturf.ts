import type { List } from '@material/mwc-list'
import type { Fab } from '@material/mwc-fab'
import type litP2P from 'lit-p2p'
import type P2PSets from './p2p-sets'
import type Game from 'sets-game-engine'
import type { Peer } from '@mothepro/fancy-p2p'

import { foreverStrings } from '@mothepro/emojis'
import { MockPeer } from '@mothepro/fancy-p2p'
import { Emitter } from 'fancy-emitter'
import { Status, random } from './util.js'
import { milliseconds } from '../src/helper.js'
import { ANIMATION_DURATION } from '../src/card.js'

type Tuple<T = number> = [T, T]

function config<T>(attribute: string, fallback: T): T {
  return document.body.hasAttribute(`astroturf-${attribute}`)
    ? JSON.parse(document.body.getAttribute(`astroturf-${attribute}`)!)
    : fallback
}

const
  names = config('names', [] as string[]),
  backupNames = foreverStrings(),
  playerAddDelay = config('player-delay', [0, 0] as Tuple),
  playersToAdd = Math.ceil(random(config('player-count', [0, 0]))),

  // CPU Difficulty (slowness)
  roundDelay = config('round-delay', [0, 0] as Tuple),
  delayScale = config('delay-scale', [1, 1] as Tuple),

  // Taking a bad set
  failureRate = config('failure-rate', [0, 1] as Tuple),
  failureDelay = config('failure-delay', [0, 0] as Tuple),
  failureDelay1 = config('failure-delay-1', failureDelay),
  failureDelay2 = config('failure-delay-2', failureDelay),

  // Taking a hint
  hintRate = config('hint-rate', [0, 1] as Tuple),
  hintDelay = config('hint-delay', [0, 0] as Tuple),
  hintDelay1 = config('hint-delay-1', hintDelay),
  hintDelay2 = config('hint-delay-2', hintDelay),
  hintDelay3 = config('hint-delay-3', hintDelay),

  // Elements
  litP2pElement = document.querySelector('lit-p2p')! as litP2P,
  p2pDemoElement = document.querySelector('p2p-sets')! as P2PSets,
  defaultAstros = document.querySelectorAll('[slot="p2p-alone"].astroturf-default') as unknown as HTMLElement[],
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]') as unknown as HTMLElement[],
  clientList = document.querySelector('mwc-list[slot="p2p-alone"]') as List,
  makeGroupBtn = document.querySelector('mwc-fab[slot="p2p-alone"]') as Fab

// For my best friend
if (Math.random() < 0.1)
  names.push('Max ⭐️')
else if (Math.random() > 0.9)
  names.push('🐯boy')

// stuff on change If someone leaves and joins, this will not do anything
if (document.body.hasAttribute('astroturf'))
  new MutationObserver(async () => {
    clientList.innerHTML = ''
    if (litP2pElement.getAttribute('state') == '1') {
      // Fill player list
      // TODO leave in groups too!
      for (let i = 0; i < playersToAdd; i++) {
        await milliseconds(random(playerAddDelay))
        clientList.innerHTML +=
          '<mwc-check-list-item>' +
            (names.splice(Math.trunc(Math.random() * names.length), 1)[0] ?? `Anonymous ${backupNames.next().value}`) +
          '</mwc-check-list-item>'
        
        // Hide default slots and actually show the list!
        defaultAstros.forEach(e => e.toggleAttribute('hidden', true))
        clientList.toggleAttribute('hidden', false)
      }
    } else { // reset after a bit, so name changes don't look jank
      await milliseconds(2000)
      if (litP2pElement.getAttribute('state') != '1') {
        defaultAstros.forEach(e => e.toggleAttribute('hidden', false))
        makeGroupBtn.setAttribute('selected', '0')
        clientList.toggleAttribute('hidden', true)
        clientList.innerHTML = ''
      }
    }
  }).observe(litP2pElement, { attributes: true, attributeFilter: ['state'] })

// @ts-ignore Ensure button count matches the selection from list
clientList.addEventListener('selected', ({ detail: { index } }: CustomEvent<{ index: Set<number> }>) =>
  makeGroupBtn.setAttribute('selected', index.size.toString()))

// Start astroturf'd game
makeGroupBtn.addEventListener('click', async () => {
  if (typeof clientList.index == 'number'
    || clientList.index.size < litP2pElement.minPeers
    || clientList.index.size > litP2pElement.maxPeers)
    return
  
  // The peers (before going offline)... should shuffle, ideally
  const peers: Peer[] = [
    new MockPeer(litP2pElement.getAttribute('name') ?? 'Me')
  ]

  for (const index of clientList.index)
    peers.push(new AstroPeer(
      clientList.children[index].textContent!.trim(),
      random(failureRate),
      random(hintRate),
      random(delayScale),
    ))
  
  makeGroupBtn.setAttribute('selected', '0')
  // TODO wait a bit to make it feel real
  // await milliseconds(1000 + 4000 * Math.random())

  // Hide online/offline
  toggleOnlineBtns.forEach(e => e.toggleAttribute('hidden', true))

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
})

class AstroPeer implements MockPeer<ArrayBuffer> {
  // @ts-ignore Turns out mocks can be for others too!
  readonly isYou = false
  readonly ready = Promise.resolve(true)

  readonly message = new Emitter<ArrayBuffer>()
  readonly close = this.message.cancel
  readonly send = (data: ArrayBuffer | ArrayBufferView) =>
    this.message.activate(ArrayBuffer.isView(data) ? data.buffer : data)
  
  private engine!: Game

  constructor(
    readonly name: string,
    /** [0,1] probability to take a bad set. */
    readonly failureRate: number,
    /** [0,1] probability to take a hint. */
    readonly hintRate: number,
    /** Positive factor to adjust delay timing calculations. */
    readonly delayScale = 1,
  ) {
    p2pDemoElement.addEventListener('game-start', async () => {
      this.engine = p2pDemoElement.engine
    
      for await (const _ of this.engine.filled)
        this.round(this.engine.filled.count)

      // Rematch!
      dispatchEvent(new CustomEvent('game-finish-astroturf'))
      await milliseconds(3000 + 5000 * Math.random())
      this.send(new Uint8Array([Status.REMATCH]))
    })
  }

  private sendVerify(round: number, ...bytes: number[]) {
    if (round == this.engine.filled.count && this.engine.filled.isAlive)
      this.send(new Uint8Array(bytes))
  }

  /** New cards are on the field... time to astroturf 😈 */
  // TODO pass in times thru generator
  private async round(round: number) {
    await milliseconds(this.engine.cards.length * ANIMATION_DURATION)

    // Dummy took a bad set! (this is early to kinda rush the player)
    if (Math.random() < this.failureRate) {
      await milliseconds(this.delayScale * random(failureDelay1))
      this.sendVerify(round, 1, 2, 3) // This is the "random" set 
    }

    // "Thinking..." Wait a bit before doing anything
    await milliseconds(this.delayScale * random(roundDelay))

    // Hints, increased likelyhood the higher the difficulty
    let skill = -this.hintRate
    // 1st hint
    skill += Math.random()
    if (skill < 0) {      
      this.sendVerify(round, Status.HINT)
      await milliseconds(this.delayScale * random(hintDelay1))
    }

    // Dummy took a bad set, even with a possible hint!
    if (Math.random() < this.failureRate * 2 / 3) {
      this.sendVerify(round, 1, 2, 3)
      await milliseconds(this.delayScale * random(failureDelay2))
    }

    // 2nd hint
    skill += Math.random()
    if (skill < 0) {      
      this.sendVerify(round, Status.HINT)
      await milliseconds(this.delayScale * random(hintDelay2))
    }

    // 3rd hint
    skill += Math.random()
    if (skill < 0) {      
      this.sendVerify(round, Status.HINT)
      await milliseconds(this.delayScale * random(hintDelay3))
    }

    // Finally take the right set
    const cards = this.engine.solution
    if (cards)
      this.sendVerify(round, ...cards.map(card => this.engine.cards.indexOf(card)))
  }
}
