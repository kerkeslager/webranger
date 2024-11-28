import { Component, h } from 'preact';
import { default as htm } from 'htm';

const html = htm.bind(h);

const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';
const CARDS = [...RANKS].map(rank => {
  return [...SUITS].map(suit => rank + suit);
}).flat();

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

    this.state = {
      combos: combos,
      isSelected: false,
    };
  }

  render() {
    let onClick = e => {
      this.setState({ isSelected: !this.state.isSelected });
      this.props.onClick();
    };

    let onContextMenu = e => {
      e.preventDefault();
      this.props.onContext();
    };

    let selectionClass = null;
    if(this.state.isSelected) {
      selectionClass = 'selected';
    }

    return html`
      <td class='${selectionClass}' onclick=${ onClick } oncontextmenu=${ onContextMenu }>
        ${ this.props.name }
      </td>
    `;
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

    this.state = {};

    for(let i = 0; i < CARDS.length - 1; i++) {
      for(let j = i + 1; j < CARDS.length; j++) {
        this.state[CARDS[i] + CARDS[j]] = 0;
      }
    }
  }

  render() {
    let rows = [...RANKS].map((rankI, i) => {
      let columns = [...RANKS].map((rankJ, j) => {
        let rankI = RANKS.charAt(i);

        let name = null;
        let combos = null;

        if(i < j) {
          name = rankI + rankJ + 's';
          combos = [...SUITS].map(suit => {
            return rankI + suit + rankJ + suit;
          });
        } else if(i > j) {
          name = rankJ + rankI + 'o';
          combos = [...SUITS].map((suitJ, j) => {
            return [...SUITS].filter((suit, i) => i != j).map((suitI, i) => {
              return rankJ + suitJ + rankI + suitI;
            });
          }).flat();
        } else {
          name = rankI + rankJ;
          combos = [...SUITS].slice(0, SUITS.length - 1).map((suitI, index) => {
            return [...SUITS].slice(index + 1).map(suitJ => {
              return rankI + suitI + rankJ + suitJ;
            });
          }).flat();
        }

        let onClick = () => {
          let transition = {};
          combos.forEach(combo => {
            transition[combo] = this.state[combo] === 0 ? 1 : 0;
          });
          this.setState(transition);
        };

        let onContext = () => { };

        return html`<${Hole}
          name=${ name }
          onClick=${ onClick }
          onContext=${ onContext }/>`;
      });

      return html`<tr>${ columns }</tr>`;
    });

    return html`
      <section class='editor'>
        <table>${ rows }</table>
        <section class='contextmenu'>Hello, world</section>
      </section>
    `;
  }
}

export { Editor };
