const RANKS = 'AKQJT98765432';
const SUITS = 'cdhs';
const CARDS = [...RANKS].map(rank => {
  return [...SUITS].map(suit => rank + suit);
}).flat();

function Editor(properties, children) {
  return {
    tag: 'table',
    children: RANKS.split('').map((rank0, i0) => {
      return {
        tag: 'tr',
        children: RANKS.split('').map((rank1, i1) => {
          if(i0 < i1) {
            return {
              tag: 'td',
              children: [ rank0 + rank1 + 's' ],
            };
          } else if(i0 > i1) {
            return {
              tag: 'td',
              children: [ rank1 + rank0 + 'o' ],
            };
          } else {
            return {
              tag: 'td',
              children: [ rank0 + rank1 ],
            };
          }
        }),
      };
    }),
  };
}

export { Editor };
