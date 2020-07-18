import { LitElement, customElement, property, css, html } from 'lit-element'
import { Details } from 'sets-game-engine'
import { borderSize, baseByHeight, borderSizeByHeight, hypotnousSize, cssColor } from './helper.js'

/** All possible colors */
const colors = [Details.Color.RED, Details.Color.GREEN, Details.Color.BLUE]
/** All possible opacities */
const opacities = [Details.Opacity.EMPTY, Details.Opacity.HALF, Details.Opacity.SOLID]

/**
 * A visiual representation for a shape in sets.
 * The size of the shape can be controlled by the `font-size` property.
 */
@customElement('sets-shape')
export default class extends LitElement {

  @property({ type: Number })
  opacity!: Details.Opacity

  @property({ type: Number })
  color!: Details.Color

  @property({ type: Number })
  shape!: Details.Shape

  static readonly styles = [css`
  :host {
    display: inline-block;
    border-style: solid;
    border-color: transparent;
    width: ${1 - 2 * borderSize}em;
    height: ${1 - 2 * borderSize}em;
    border-width: ${borderSize}em;
  }
  :host([shape="${Details.Shape.SQUARE}"]) {
    border-radius: 0.1em;
  }
  :host([shape="${Details.Shape.CIRCLE}"]) {
    border-radius: 50%;
  }
  :host([shape="${Details.Shape.TRIANGLE}"]) {
    position: relative;
    width: 0;
    height: 0;
    border-width: 0 ${baseByHeight}em 1em;
  }
  :host([shape="${Details.Shape.TRIANGLE}"]) span {
    position: absolute;

    top: ${borderSize}em;
    left: ${-hypotnousSize}em;
    border-width: 0
      ${hypotnousSize}em
      ${1 - borderSize - borderSizeByHeight}em;

    border-style: solid;
    border-color: transparent;
    border-bottom-color: var(--mdc-theme-primary, white);
  }`,

  // Shape border
  ...colors.map(color => css`
    :host([shape="${Details.Shape.SQUARE}"][color="${color}"]),
    :host([shape="${Details.Shape.CIRCLE}"][color="${color}"]) {
      border-color: ${cssColor(color)};
    }
    :host([shape="${Details.Shape.TRIANGLE}"][color="${color}"]) {
      border-bottom-color: ${cssColor(color)};
    }`),

  // Inner triangle
  ...opacities.map(opacity => css`
    :host([opacity="${opacity}"]) span {
      opacity: ${opacity / 2};
    }`),

  // Inner square and circle
  ...colors.flatMap(color => opacities.map(opacity => css`
    :host([shape="${Details.Shape.SQUARE}"][color="${color}"][opacity="${opacity}"]),
    :host([shape="${Details.Shape.CIRCLE}"][color="${color}"][opacity="${opacity}"]) {
        background-color: ${cssColor(color, opacity)};
    }`))]

  protected readonly render = () =>
    this.shape == Details.Shape.TRIANGLE
      ? html`<span></span>`
      : null
}
