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
          render(element.tag(element.properties, element.children), target);
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

function sml(strings, ...expressions) {
  let stack = [];

  let tag = null;
  let properties = null;
  let children = [];

  function emit(e) {
    // TODO We usually know the type of e at the call site, so maybe move this first
    // check out of this function.
    if(typeof e === 'string' && children.length > 0 && typeof children[children.length - 1] === 'string') {
      children[children.length - 1] = children[children.length - 1] + e;
    } else {
      children.push(e);
    }
  }

  for(let i = 0; i < expressions.length; i++) {
    emit(strings[i]);
    emit(expressions[i]);
  }

  emit(strings[strings.length - 1]);

  console.assert(tag === null);
  console.assert(properties === null);
  console.assert(length === 0);

  return children;
}

export { render, sml };
