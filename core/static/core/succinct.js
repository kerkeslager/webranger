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
        if(typeof (element.tag) == 'function') {
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

export { render };
