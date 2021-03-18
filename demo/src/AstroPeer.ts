import type P2PSets from './p2p-sets.js'

import Game from 'sets-game-engine'
import { MockPeer } from '@mothepro/fancy-p2p'
import { Status, random, milliseconds } from './util.js'
import { ANIMATION_DURATION } from '../../src/card.js'

export type Tuple<T = number> = [T, T]

export default class extends MockPeer<ArrayBuffer> {
  // @ts-ignore Turns out mocks can be for others too!
  readonly isYou = false

  constructor(
    p2pElement: P2PSets,
    name: string,
    readonly rate: {
      /** [0,1] probability to take a bad set. */
      failure: number
      /** [0,1] probability to take a bad set again in the same round. */
      failureAgain: number
      /** [0,1] probability to take a hint. */
      hint: number
    },
    readonly delay: {
      /** Factor to adjust all delay timing calculations. */
      scale: number
      /** "Thinking" milliseconds to wait before round start. */
      round: Tuple
      /** "Embarassment" milliseconds to wait after taking a bad set. */
      failure: [Tuple, Tuple]
      /** "Considering" milliseconds to wait after a hint is used */
      hint: [Tuple, Tuple, Tuple]
    }) {
    super(name)
    p2pElement.addEventListener('game-start', async () => {
      for await (const _ of p2pElement.engine.filled)
        this.round(p2pElement.engine.filled.count, p2pElement.engine)

      // Rematch!
      await milliseconds(random(3000, 8000))
      this.send(new Uint8Array([Status.REMATCH]))
    })
  }

  private scaledRandom = ([min, max]: Tuple) => this.delay.scale * random(min, max)

  private sendVerifySameRound(round: number, engine: Game, ...bytes: number[]) {
    if (round == engine.filled.count && engine.filled.isAlive)
      this.send(new Uint8Array(bytes))
  }

  /** New cards are on the field... time to astroturf 😈 */
  private async round(round: number, engine: Game) {
    await milliseconds(engine.cards.length * ANIMATION_DURATION)

    // Dummy took a bad set! (this is early to kinda rush the player)
    if (Math.random() < this.rate.failure) {
      await milliseconds(this.scaledRandom(this.delay.failure[0]))
      // This is the "bad" set (which may be valid) lol
      this.sendVerifySameRound(round, engine, 1, 2, 3)
    }

    // "Thinking..." Wait a bit before doing anything
    await milliseconds(this.scaledRandom(this.delay.round))

    // Hints, increased likelyhood the higher the difficulty
    let skill = -this.rate.hint
    // 1st hint
    skill += Math.random()
    if (skill < 0) {
      this.sendVerifySameRound(round, engine, Status.HINT)
      await milliseconds(this.scaledRandom(this.delay.hint[0]))
    }

    // Dummy took a bad set, even with a possible hint!
    if (Math.random() < this.rate.failureAgain) {
      this.sendVerifySameRound(round, engine, 1, 2, 3)
      await milliseconds(this.scaledRandom(this.delay.failure[1]))
    }

    // 2nd hint
    skill += Math.random()
    if (skill < 0) {
      this.sendVerifySameRound(round, engine, Status.HINT)
      await milliseconds(this.scaledRandom(this.delay.hint[1]))
    }

    // 3rd hint
    skill += Math.random()
    if (skill < 0) {
      this.sendVerifySameRound(round, engine, Status.HINT)
      await milliseconds(this.scaledRandom(this.delay.hint[2]))
    }

    // Finally take the right set
    const cards = engine.solution
    if (cards)
      this.sendVerifySameRound(round, engine, ...cards.map(card => engine.cards.indexOf(card)))
  }

  toJSON = () => ({
    name: this.name,
    rate: this.rate,
    delay: this.delay,
  })
}
