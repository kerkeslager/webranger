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

class StateList {
  #items;
  #subscribers;

  constructor(initial) {
    this.#items = initial;
    this.#subscribers = new Set();
  }

  subscribe(handlers) {
    console.assert(handlers.onSet);
    console.assert(handlers.onSplice);
    this.#subscribers.add(handlers);
  }

  unsubscribe(handlers) {
    this.#subscribers.remove(handlers);
  }

  getItem(index) {
    return this.#items[index];
  }

  setItem(index, newValue) {
    if(newValue !== this.#items[index]) {
      let oldValue = this.#items[index];
      this.#items[index] = newValue;
      this.#subscribers.forEach(s => s.onSet(index, newValue, oldValue));
    }
  }

  splice(start, deleteCount, ...items) {
    /*
     * We're choosing this interface because it's the most general-purpose
     * and it already exists in JS, not because it's good.
     */

    // Don't call handlers if this splice doesn't do anything
    if(deleteCount === items.length) {
      let changeFound = false;

      for(let i = 0; i < deleteCount; i++) {
        if(this.#items[i + start] !== items[i]) {
          changeFound = true;
          break;
        }
      }

      if(!changeFound) return;
    }

    let oldItems = this.#items.slice(start, start + deleteCount);

    this.#items.splice(start, deleteCount, ...items);
    this.#subscribers.forEach(s => s.onSplice(start, deleteCount, items, oldItems));
  }

  get length() {
    return this.#items.length;
  }

  forEach(f) {
    this.#items.forEach(f);
  }
}

class MappedStateList {
  #lists;
  #items;

  constructor(f, ...lists) {
    this.#lists = [];

    lists.forEach(l => {
      // In-place flatten the list
      for(let i = 0; i < l.length; i++) {
        while(Array.isArray(l[i])) {
          l.splice(i, 1, ...l[i]);
        }
      }

      // Pull any StateLists up a level while inserting
      let start = 0;
      let i = 0;
      for(; i < l.length; i++) {
        if(l[i].constructor.name === 'StateList') {
          if(i > start) {
            this.#lists.push(l.slice(start,i));
          }
          this.#lists.push(l[i]);
          start = i + 1;
        }
      }

      if(i > start) {
        this.#lists.push(l.slice(start,i));
      }
    });

    let items = [];

    this.#lists.forEach(l => l.forEach(i => items.push(i)));

    this.#items = new StateList(items);

    this.#lists.forEach(l,index => {
      if(l.constructor.name === 'StateList') {
        l.subscribe({
          onSet: (i, n, o) => {
            let indexModifier = 0;
            for(let j = 0; j < index; j++) indexModifier += this.#lists.length;
            this.#items.setItem(indexModifier + i, n);
          },
          onSplice: (s, dc, n, o) => {
            let indexModifier = 0;
            for(let j = 0; j < index; j++) indexModifier += this.#lists.length;
            this.#items.splice(indexModifier + s, dc, ...n);
          },
        });
      }
    });
  }

  getItem(i) {
    return this.#items.getItem(i);
  }

  subscribe(s) {
    this.#items.subscribe(s);
  }

  unsubscribe(s) {
    this.#items.unsubscribe(s);
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
          {
            let renderer = element.tag(element.properties, element.children);
            let rendererProps = getRendererProps(element);
            let dom = createDOM(renderer(rendererProps, element.children));

            // TODO We probably need to unsubscribe when this dom is replaced

            for(const watchedProp of element.watchlist) {
              console.assert(element.properties[watchedProp].constructor.name == 'State');
              element.properties[watchedProp].subscribe((newValue, oldValue) => {
                rendererProps[watchedProp] = newValue;

                // TODO This is a bit heavy-handed, we should optimize
                let newDom = createDOM(renderer(rendererProps, element.children));
                dom.replaceWith(newDom);
                dom = newDom;
              });
            }

            return dom;
          }

        case 'string':
          {
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

            for(const watchedProp of element.watchlist) {
              console.assert(element.properties[watchedProp].constructor.name == 'State');
              element.properties[watchedProp].subscribe((newValue, oldValue) => {
                let newDom = document.createElement(element.tag);

                rendererProps[watchedProp] = newValue;

                for(const [key, value] of Object.entries(rendererProps)) {
                  if(key.startsWith('on')) {
                    // TODO Enforce case convention
                    // TODO Do we need to remove these event listeners at some point?
                    let type = key.substring(2).toLowerCase();
                    newDom.addEventListener(type, value);
                  } else {
                    newDom.setAttribute(key, value);
                  }
                }

                // TODO This is a bit heavy-handed, we should optimize
                dom.replaceWith(newDom);
                dom = newDom;
              });
            }

            return dom;
          }

        default:
          throw `Unexpected tag type: '${ typeof element.tag }'`;
      }

    default:
      throw `Unexpected element type: '${ typeof element }'`;
  }
}

const SYMBOL_HEAD_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SYMBOL_TAIL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
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

        case '[':
          scanner.characterIndex++;
          console.assert(scanner.characterIndex < string.length);
          console.assert(string[scanner.characterIndex] === ']');
          scanner.characterIndex++;
          console.assert(scanner.characterIndex < string.length);
          console.assert(string[scanner.characterIndex] === '=');
          scanner.characterIndex++;
          return {
            type: 'listProp',
            data: null,
          };

        case "'":
        case '"':
          {
            let startChar = string[scanner.characterIndex];
            scanner.characterIndex++;

            let startIndex = scanner.characterIndex;

            for(; scanner.characterIndex < string.length; scanner.characterIndex++) {
              if(string[scanner.characterIndex] == startChar) {
                let data = string.substring(startIndex, scanner.characterIndex);

                scanner.characterIndex++;
                return {
                  type: 'expression',
                  data: data,
                };
              }
            }

            throw 'Unexpected end of source during string scanning';
          }

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
            throw `Unexpected character ${ string[scanner.characterIndex] } in '${ string }' at ${ scanner.characterIndex }`;
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
          let children = [];
          let isListComponent = false;

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
                children: children,
                watchlist: watchlist,
                isListComponent: isListComponent,
              };
            } else if(token.type === 'endTag') {
              let children = parseAll(tag);

              if(children.length > 0 && isListComponent) {
                throw 'Cannot define children in a list component';
              }

              return {
                tag: tag,
                properties: properties,
                children: children,
                watchlist: watchlist,
              };
            } else if(token.type === 'listProp') {
              if(isListComponent) {
                throw 'May not define more than one dynamic child list in a tag';
              }

              token = scan();
              console.assert(token.type === 'expression');
              console.assert(token.data.constructor.name === 'StateList');
              isListComponent = true;
              children = token.data;

              // TODO Enforce that a tag does not have both a listProp and children
              // TODO Maybe join the listProp and chilren into one variable since they
              // are similar?
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
