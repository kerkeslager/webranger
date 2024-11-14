import { Component, h } from 'preact';
import { default as htm } from 'htm';

const html = htm.bind(h);

const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';

class Hole extends Component {
  constructor(props) {
    super(props);

    let name = this.props.name;
    let combos = {};

    if(this.isPair()) {
      for(let i = 0; i < SUITS.length - 1; i++) {
        for(let j = i + 1; j < SUITS.length; j++) {
          combos[name[0] + SUITS[i] + name[1] + SUITS[j]] = 0;
        }
      }
    } else if(this.isSuited()) {
      for(let i = 0; i < SUITS.length; i++) {
        combos[name[0] + SUITS[i] + name[1] + SUITS[i]] = 0;
      }
    } else {
      for(let i = 0; i < SUITS.length; i++) {
        for(let j = 0; j < SUITS.length; j++) {
          if(i != j) {
            combos[name[0] + SUITS[i] + name[1] + SUITS[j]] = 0;
          }
        }
      }
    }

    console.log(combos);

    this.state = {
      combos: combos,
    };
  }

  render() {
    return html`<div>${ this.props.name }</div>`;
  }

  isPair() {
    return this.props.name.length === 2;
  }

  isSuited() {
    return this.props.name.length === 3 && this.props.name[2] === 's';
  }
}

class Editor extends Component {
  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    let rows = [];

    for(var i = 0; i < RANKS.length; i++) {
      let columns = [];

      for(var j = 0; j < RANKS.length; j++) {
        let rankI = RANKS.charAt(i);
        let rankJ = RANKS.charAt(j);

        if(i < j) {
          columns.push(html`<td><${Hole} name=${ rankI + rankJ + 's' }/></td>`);
        } else if(i > j) {
          columns.push(html`<td><${Hole} name=${ rankJ + rankI + 'o' }/></td>`);
        } else {
          columns.push(html`<td><${Hole} name=${ rankI + rankJ }/></td>`);
        }
      }

      rows.push(html`<tr>${ columns }</tr>`);
    }

    return html`
      <table class='editor'>${ rows }</table>
    `;
  }
}

export { Editor };
