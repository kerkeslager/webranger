/*
 * This file will later be split out to create a component library.
 */

function render(element, target) {
  switch(typeof element) {
    case 'string':
      {
        let node = document.createTextNode(element);
        target.appendChild(node);
      } break;

    case 'object':
      {
        if(Array.isArray(element)) {
          for(const item of element) {
            render(item, target);
          }
        } else if(typeof (element.tag) == 'function') {
          let renderer = element.tag(element.properties, element.children);

          render(renderer(element.properties, element.children), target);
        } else {
          let node = document.createElement(element.tag);

          if(element.properties) {
            for(const [key, value] of Object.entries(element.properties)) {
              node.setAttribute(key, value);
            }
          }

          if(element.children) {
            for(const child of element.children) {
              render(child, node);
            }
          }

          target.appendChild(node);
        }
      } break;
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
          result.push(node);
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

          while(true) {
            let token = scan();

            if(token.type === 'symbol') {
              let key = token.data;
              token = scan();
              console.assert(token.type === 'equals');
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
              };
            } else if(token.type === 'endTag') {
              let children = parseAll(tag);

              return {
                tag: tag,
                properties: properties,
                children: children,
              };
            }
          }
        } break;
      default:
        throw `Unexpected token of type ${ token.type }`;
    }
  }

  return parseAll(null);
}

export { render, sml };
