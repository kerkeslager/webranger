import { Component, h } from 'preact';
import { default as htm } from 'htm';

const html = htm.bind(h);

const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';

class Hole extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return html`<div>${ this.props.name }</div>`;
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
