import { State, sml } from 'succinct';

const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';
const CARDS = [...RANKS].map(rank => {
  return [...SUITS].map(suit => rank + suit);
}).flat();

function Hole(props, children) {
  let onClick = e => {
    props.focusedHole.value = props.descriptor;
  };

  let onDblClick = e => {
    props.selected.value = !(props.selected.value);
  };

  return (props, children) => {
    let classes = [];
    if(props.selected) classes.push('selected');
    if(props.focusedHole === props.descriptor) classes.push('focused');
    return sml`<td class=${ classes.join(' ') } onClick=${ onClick } onDblClick=${onDblClick}>${ props.descriptor }</td>`;
  };
}

function ComboSelector(props, children) {
  return (props, children) => {
    let combos = [];

    if(props.focusedHole.length === 2) {
      // Pairs
      for(let i = 0; i < SUITS.length - 1; i++) {
        for(let j = i + 1; j < SUITS.length; j++) {
          combos.push(props.focusedHole[0] + SUITS[i] + props.focusedHole[1] + SUITS[j]);
        }
      }
    } else if(props.focusedHole[2] === 's') {
      // Suited
      for(let i = 0; i < SUITS.length; i++) {
        combos.push(props.focusedHole[0] + SUITS[i] + props.focusedHole[1] + SUITS[i]);
      }
    } else if(props.focusedHole[2] === 'o') {
      // Off suit
      for(let i = 0; i < SUITS.length; i++) {
        for(let j = 0; j < SUITS.length; j++) {
          if(i != j) {
            combos.push(props.focusedHole[0] + SUITS[i] + props.focusedHole[1] + SUITS[j]);
          }
        }
      }
    }
    return sml`<section class='combo-selector'>
      <h1>${ props.focusedHole }</h1>
      ${ combos.join(', ') }
    </section>`;
  };
}

function Editor(props, children) {
  let descriptorMatrix = [];
  let range = {};
  let focusedHole = new State('');

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
      range[descriptor] = new State(false);
    }

    descriptorMatrix.push(columns);
  }

  return (properties, children) => {
    return sml`<section class='editor'>
      <table>${
        descriptorMatrix.map(row => sml`<tr>${
          row.map(column => sml`<${ Hole } descriptor=${ column } focusedHole:=${ focusedHole } selected:=${ range[column] }/>`)
        }</tr>`)
      }</table>
      <${ ComboSelector } focusedHole:=${ focusedHole } />
    </section>`;
  };
}

export { Editor };
