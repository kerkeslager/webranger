import { State, sml } from 'succinct';

const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';
const CARDS = [...RANKS].map(rank => {
  return [...SUITS].map(suit => rank + suit);
}).flat();

function Hole(props, children) {
  let onClick = e => {
    console.log(props.descriptor + ' clicked');
  };

  return (properties, children) => {
    return sml`<td onClick=${onClick}>${ properties.descriptor }</td>`;
  };
}

function Editor(props, children) {
  let descriptorMatrix = [];
  let rangeStates = {};

  for(let i = 0; i < RANKS.length; i++) {
    let columns = [];

    for(let j = 0; j < RANKS.length; j++) {
      let descriptor = null;

      if(i < j) {
        descriptor = RANKS[i] + RANKS[j] + 's';
      } else if(i > j) {
        descriptor = RANKS[j] + RANKS[i] + 'o';
      } else {
        descriptor = RANKS[i] + RANKS[j];
      }

      columns.push(descriptor);
      rangeStates[descriptor] = new State(false);
    }

    descriptorMatrix.push(columns);
  }

  return (properties, children) => {
    return sml`<table>${
      descriptorMatrix.map(row => sml`<tr>${
        row.map(column => sml`<${ Hole } descriptor=${ column } />`)
      }</tr>`)
    }</table>`;
  };
}

export { Editor };
