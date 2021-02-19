import { LitElement, customElement, property, html, css, PropertyValues } from 'lit-element'
import { hasArrayChanged } from './helper.js'

import '@material/mwc-list' // <mwc-list>

@customElement('sets-leaderboard')
export default class extends LitElement {

  @property({ type: Array, reflect: true, hasChanged: hasArrayChanged })
  scores: number[] = []

  @property({ type: Array, reflect: true, hasChanged: hasArrayChanged })
  isBanned: boolean[] = []

  @property({ type: Array, reflect: true, hasChanged: hasArrayChanged })
  names: string[] = []

  /** Changes to scores from the last update. */
  private diff: number[] = []

  static readonly styles = css`
  @keyframes positive {
    from {
      bottom: 0; 
      opacity: 1;
    }
    to { 
      bottom: 1em;
      opacity: 0;
    }
  }
  @keyframes negative {
    from { 
      top: 0; 
      opacity: 1;
    }
    to { 
      top: 1em;
      opacity: 0;
    }
  }

  :host, [slot="meta"] {
    position: relative;
  }
    
  [part~="diff"] {
    position: absolute;
    z-index: 2;
    pointer-events: none;
    user-select: none;

    font: var(--leaderboard-diff-font, bold 15px monospace);
    animation-duration: var(--leaderboard-diff-duration, 3s);
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }
  [part~="diff-1"] {
    animation-name: var(--leaderboard-diff-positive-animation, positive);
    color: var(--leaderboard-diff-positive-color-fg, limegreen);
  }
  [part~="diff--1"] {
    animation-name: var(--leaderboard-diff-negative-animation, negative);
    color: var(--leaderboard-diff-negative-color-fg, red);
  }
  [part~="diff-0"] { display: none; }`

  protected update(changed: PropertyValues) {
    if (changed.has('scores')) {
      this.diff = this.scores.map((score, i) => score - ((changed.get('scores') as number[] ?? [])[i] ?? 0))

      // Restart any animations
      this.updateComplete.then(() =>
        (this.shadowRoot!.querySelectorAll('[part~="diff"]') as NodeListOf<HTMLElement>).forEach(diff => {
          diff.style.animationName = 'none'
          diff.offsetHeight // Causes reflow, refreshing the animation without need for a microtick
          diff.style.animationName = ''
        }))
    }

    return super.update(changed)
  }

  protected readonly render = () => this.scores.length == 1
    ? html`
      Your score is 
      <span part="diff diff-${Math.sign(this.diff[0])}">
        ${this.diff[0] > 0 ? '+' : ''}${this.diff[0]}
      </span>
      ${this.scores[0]}.`
    : html`<mwc-list roottabble>${this.scores.map((score, index) => html`
      ${index != 0 ? html`<li divider padded role="separator"></li>` : ''}
      <mwc-list-item
        noninteractive
        hasMeta
        ?disabled=${this.isBanned[index]}>
        ${this.names[index]}
        <span slot="meta">
          <span part="diff diff-${Math.sign(this.diff[index])}">
            ${this.diff[index] > 0 ? '+' : ''}${this.diff[index]}
          </span>
          ${score}
        </span>
      </mwc-list-item>
    `)}</mwc-list>`
}
