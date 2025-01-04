import { sml } from 'succinct';

const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';
const CARDS = [...RANKS].map(rank => {
  return [...SUITS].map(suit => rank + suit);
}).flat();

function Hole() {
  return (properties, children) => {
    return sml`<td>${ properties.descriptor }</td>`;
  };
}

function Editor() {
  return (properties, children) => {
    let rows = [];

    for(let i = 0; i < RANKS.length; i++) {
      let columns = [];

      for(let j = 0; j < RANKS.length; j++) {
        if(i < j) {
          columns.push(sml`<${ Hole() } descriptor=${ RANKS[i] + RANKS[j] + 's' } />`);
        } else if(i > j) {
          columns.push(sml`<${ Hole() } descriptor=${ RANKS[j] + RANKS[i] + 'o' } />`);
        } else {
          columns.push(sml`<${ Hole() } descriptor=${ RANKS[i] + RANKS[j] } />`);
        }
      }

      rows.push(sml`<tr>${ columns }</tr>`);
    }

    return sml`<table>${ rows }</table>`;
  };
}

export { Editor };
