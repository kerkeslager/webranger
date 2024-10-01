import { Component } from 'preact';
import { html } from 'htm/preact';

const RANKS = 'AKQJT98765432';

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
          columns.push(html`<td>${ rankI + rankJ + 's' }</td>`);
        } else if(i > j) {
          columns.push(html`<td>${ rankJ + rankI + 'o' }</td>`);
        } else {
          columns.push(html`<td>${ rankI + rankJ }</td>`);
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
