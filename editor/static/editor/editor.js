import { sml } from 'succinct';

const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';
const CARDS = [...RANKS].map(rank => {
  return [...SUITS].map(suit => rank + suit);
}).flat();

function Hole(props, children) {
  return (properties, children) => {
    return sml`<td>${ properties.descriptor }</td>`;
  };
}

function Editor(props, children) {
  let matrix = [];

  for(let i = 0; i < RANKS.length; i++) {
    let columns = [];

    for(let j = 0; j < RANKS.length; j++) {
      if(i < j) {
        columns.push(RANKS[i] + RANKS[j] + 's');
      } else if(i > j) {
        columns.push(RANKS[j] + RANKS[i] + 'o');
      } else {
        columns.push(RANKS[i] + RANKS[j]);
      }
    }

    matrix.push(columns);
  }

  return (properties, children) => {
    return sml`<table>${
      matrix.map(row => sml`<tr>${
        row.map(column => sml`<${ Hole } descriptor=${ column } />`)
      }</tr>`)
    }</table>`;
  };
}

export { Editor };
