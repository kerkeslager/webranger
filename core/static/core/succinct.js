/*
 * This file will later be split out to create a component library.
 */

class State {
  #value;
  #subscribers;

  constructor(initial) {
    this.#value = initial;
    this.#subscribers = new Set();
  }

  get value() {
    return this.#value;
  }

  set value(newValue) {
    if(newValue !== this.#value) {
      let oldValue = this.#value;
      this.#value = newValue;
      this.#subscribers.forEach(f => f(newValue, oldValue));
    }
  }

  subscribe(changeHandler) {
    this.#subscribers.add(changeHandler);
  }

  unsubscribe(changeHandler) {
    this.#subscribers.remove(changeHandler);
  }
}

function render(element, target) {
  if(!element) return;

  if(Array.isArray(element)) {
    for(const item of element) {
      render(item, target);
    }
    return;
  }

  let dom = createDOM(element);

  target.appendChild(dom);
}

function getRendererProps(element) {
  let result = {};

  for(const [key, value] of Object.entries(element.properties)) {
    if(element.watchlist.has(key)) {
      console.assert(value.constructor.name === 'State');
      result[key] = value.value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

function createDOM(element) {
  switch(typeof element) {
    case 'string':
      return document.createTextNode(element);

    case 'object':
      switch(typeof element.tag) {
        case 'function':
          let renderer = element.tag(element.properties, element.children);
          let rendererProps = getRendererProps(element);
          return createDOM(renderer(rendererProps, element.children));

        case 'string':
          let dom = document.createElement(element.tag);

          if(element.properties) {
            let rendererProps = getRendererProps(element);
            for(const [key, value] of Object.entries(rendererProps)) {
              if(key.startsWith('on')) {
                // TODO Enforce case convention
                // TODO Do we need to remove these event listeners at some point?
                let type = key.substring(2).toLowerCase();
                dom.addEventListener(type, value);
              } else {
                dom.setAttribute(key, value);
              }
            }
          }

          render(element.children, dom);

          return dom;

        default:
          throw `Unexpected tag type: '${ typeof element.tag }'`;
      }

    default:
      throw `Unexpected element type: '${ typeof element }'`;
  }
}

const SYMBOL_HEAD_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwzyz';
const SYMBOL_TAIL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwzyz0123456789';
const WHITESPACE_CHARS = ' \t\n\r\v';

function sml(strings, ...expressions) {
  let scanner = {
    stringIndex: 0,
    characterIndex: 0,
    inTag: false,
    lookaheads: [],
  };

  function consumeWhitespace() {
    let string = strings[scanner.stringIndex];

    while(scanner.characterIndex < string.length) {
      if(WHITESPACE_CHARS.includes(string[scanner.characterIndex])) {
        scanner.characterIndex++;
      } else {
        break;
      }
    }
  }

  function scan() {
    if(scanner.lookaheads.length > 0) {
      return scanner.lookaheads.shift();
    }

    if(scanner.inTag) {
      consumeWhitespace();

      let string = strings[scanner.stringIndex];

      if(scanner.characterIndex === string.length) {
        if(scanner.stringIndex < expressions.length) {
          let result = {
            type: 'expression',
            data: expressions[scanner.stringIndex],
          };

          scanner.stringIndex++;
          scanner.characterIndex = 0;

          return result;
        } else {
          return {
            type: 'end',
            data: null,
          };
        }
      }

      switch(string[scanner.characterIndex]) {
        case '/':
          scanner.characterIndex++;
          return {
            type: 'slash',
            data: null,
          };

        case '>':
          scanner.inTag = false;
          scanner.characterIndex++;
          return {
            type: 'endTag',
            data: null,
          };

        case '=':
          scanner.characterIndex++;
          return {
            type: 'equals',
            data: null,
          };

        case ':':
          scanner.characterIndex++;
          console.assert(scanner.characterIndex < string.length);
          console.assert(string[scanner.characterIndex] == '=');
          scanner.characterIndex++;
          return {
            type: 'stateEquals',
            data: null,
          };

        default:
          if(SYMBOL_HEAD_CHARS.includes(
            string[scanner.characterIndex]
          )) {
            let start = scanner.characterIndex;
            scanner.characterIndex++;

            while(
              scanner.characterIndex < string.length
              && SYMBOL_TAIL_CHARS.includes(string[scanner.characterIndex])
            ) {
              scanner.characterIndex++;
            }

            return {
              type: 'symbol',
              data: string.substring(start, scanner.characterIndex),
            };
          } else {
            throw `Unexpected character ${ string[scanner.characterIndex] }`;
          }
      }
    } else {
      let string = strings[scanner.stringIndex];
      let start = scanner.characterIndex;

      while(scanner.characterIndex < string.length) {
        if(string[scanner.characterIndex] === '<') {
          let result = {
            type: 'string',
            data: string.substring(start, scanner.characterIndex),
          };

          scanner.lookaheads.push({
            type: 'startTag',
            data: null,
          });

          scanner.inTag = true;
          scanner.characterIndex++;
          return result;
        } else {
          scanner.characterIndex++;
        }
      }

      let result = {
        type: 'string',
        data: string.substring(start),
      };

      if(scanner.stringIndex < expressions.length) {
        scanner.lookaheads.push({
          type: 'expression',
          data: expressions[scanner.stringIndex],
        });

        scanner.stringIndex++;
        scanner.characterIndex = 0;
      } else {
        scanner.lookaheads.push({
          type: 'end',
          data: null,
        });
      }

      return result;
    }
  }

  function peek() {
    if(scanner.lookaheads) {
      return scanner.lookaheads[0];
    }

    let result = scan();
    scanner.lookaheads.unshift(result);
    return result;
  }

  function parseAll(expectedClose) {
    let result = [];

    while(true) {
      let node = parse();

      switch(typeof node) {
        case 'string':
          if(node.length > 0) result.push(node);
          break;

        case 'object':
          switch(node.tag) {
            case '__closeSentinel__':
              console.assert(expectedClose != null);
              console.assert(expectedClose === node.closing);
              return result;

            case '__endSentinel__':
              console.assert(expectedClose === null);
              return result;

            default:
              result.push(node);
              break;
          } break;
      }
    }
  }

  function parse() {
    let token = scan();

    switch(token.type) {
      case 'expression':
      case 'string':
        return token.data;

      case 'end':
        return {
          tag: '__endSentinel__',
        };

      case 'startTag':
        {
          let tagToken = scan();

          if(tagToken.type === 'slash') {
            tagToken = scan();
            console.assert(tagToken.type === 'symbol' || tagToken.type === 'expression');
            let closing = tagToken.data;
            tagToken = scan();
            console.assert(tagToken.type === 'endTag');
            return {
              tag: '__closeSentinel__',
              closing: closing,
            };
          }

          console.assert(tagToken.type === 'symbol' || tagToken.type === 'expression');

          let tag = tagToken.data;
          let properties = {};
          let watchlist = new Set();

          while(true) {
            let token = scan();

            if(token.type === 'symbol') {
              let key = token.data;
              token = scan();

              if(token.type === 'stateEquals') {
                watchlist.add(key);
              } else {
                console.assert(token.type === 'equals');
              }

              token = scan();
              console.assert(token.type === 'expression');
              let value = token.data;
              properties[key] = value;
            } else if(token.type === 'slash') {
              token = scan();
              console.assert(token.type === 'endTag');
              return {
                tag: tag,
                properties: properties,
                children: [],
                watchlist: watchlist,
              };
            } else if(token.type === 'endTag') {
              let children = parseAll(tag);

              return {
                tag: tag,
                properties: properties,
                children: children,
                watchlist: watchlist,
              };
            }
          }
        } break;
      default:
        throw `Unexpected token of type ${ token.type }`;
    }
  }

  // TODO It's a bit awkward that we always return an array, can we optimize it?
  let result = parseAll(null);

  if(result.length != 1) {
    throw `An sml expression must contain exactly 1 element, found ${ result.length }`;
  }

  return result[0];
}

export { State, render, sml };
