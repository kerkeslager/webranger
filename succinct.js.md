# succinct.js

`succinct.js` is a component *library* (not a framework). It's inspired by React,
but looking to avoid some of what I find frustrating about React.

## Quickstart

`succinct.js` a single file with no dependencies, and no build step. Add it to your static
files and then add the following to your HTML:

```
  <script type='importmap'>
    {
      "imports": {
        "succinct": "path/to/succinct.js"
      }
    }
  </script>
```

Now you can use it like this in your HTML:

```
<header id='greeting'></header>

<script type='module'>
  import { render, sml } from 'succinct';
  render(sml`<h1>Hello, world</h1>`, document.getElementById('greeting'));
</script>
```

## Overview

`succinct.js` provides three basic elements:

1. `render(element, target)` which renders a succinct element into a target DOM
   node.
2. `State` which is an element of observable state. Unlike React, state in
  `succinct.js` is not coupled with a component.
3. `sml` (Succinct Markup Language) which is a templating language for creating
  succinct elements. Unlike JSX, it doesn't require a build step, and unlike
  HTM it diverges from HTML significantly to provide syntactic sugar for state
  management.

## SML
`SML` is a markup language for creating components. You can write HTML in it
and it generally works:

```
sml`<h1>Hello, world</h1>`
```

Currently property values have to be templated values (this will change in
future `succinct.js` versions):

```
sml`<h1 style=${ 'color: magenta;' }>Hello, world</h1>`
```

Properties passed in the normal HTML way do not trigger a refresh:

```
let style = 'color: magenta;';

function makeGreen() {
  style = 'color: green;';
}

// Pressing this button does nothing
let greeting = sml`<button style=${ style } onClick=${ makeGreen }>
  Make me green
</button>`;
```

If we want the elements to re-render when a property changes, we make
the property a `State`, and we indicate that the element should watch
that state with the `:=` operator:

```
let styleState = new State('color: magenta;');

function makeGreen() {
  styleState.value = 'color: green;';
}

// Pressing this button turns it green
let greeting = sml`<button style:=${ styleState } onClick=${ makeGreen }>
  Make me green
</button>`;
```

Instead of an HTML tag, we can pass in a component function:

```
function Greeter(props, children) {
  return (props, children) => sml`<h1>Hello, ${ props.name }</h1>`;
}

let greeting = sml`<${ Greeter } name=${ 'Alice' } />`;
```

Note first that the *component function* returns a *render function*. The component
function is called once, while the render function is called every time
the component is re-rendered due to a State change. The component function receives
all props, including observed states, which are passed in as `State` objects,
so if you want to get or set them, you do so through their `.value` property.
The render function is passed only the values of the state, not the `State` itself,
as a convenience. This is to discourage setting states within the render function.

Note next that `children` is passed in as a separate argument from props--it's not
defined like a property so why would it be a property?

## Future

A future idea is list components. These take no children, but take a special list
property which takes a list state that has observability points for adding,
removing, and changing items. The component function must return two
render functions: one for rendering the list's outer parent component, and
one for rendering each item. It could look something like this:

```
let evenNumbers = new StateList([2,4,6,8]);

function NumberSequence(props, list) {
  return [
    (props, renderedItems) => sml`<ol style=${ props.style }>${ renderedItems }</ol>`,
    (props, item) => sml`<li>${ item }</li>`,
  ];
}

let component = sml`<${ NumberSequence }[]=${ evenNumbers } style='color: magenta;'/>

## Philosophy

`succinct.js` will never make any attempt to be on NPM or participate in the
larger JS ecosystem. If someone else wants to package `succinct.js` and put it
on NPM, they are licensed to do so under the AGPL. But I'll not do anything to
support that effort.

I would be open to participating in a JS ecosystem that views JS as a client-
side language only. I'd like to be able to minify my JS without downloading a
million brittle dependencies. I do not need or want that to be built in JS:
there are dozens of languages more suited to that task. Beyond that, browsers
are very capable virtual machines: we can serve them JS files and import
between them.

`succinct.js` is not for creating single-page applications (SPAs). `succinct.js`
for building components that sit nicely within an HTML page, not a framework
that slowly blights the whole page. HTML and CSS are extremely capable nowadays,
and we encourage you to use them. `succinct.js` (and JS in general) is our
weapon of last resort.

`succinct.js` believes there is a correct number of points of coupling, and
that number is 1. I've written code that's coupled all over the place,
and that's hard. I've also written code that uses reflection to magically
sew together parts without ever explicitly saying which parts are tied
together, and that's also pretty hard because you can't trace the code. We
aim to give you good paradigms and syntax that let you build what you want
with effective single-point coupling that is both easy to trace and
clear what it's doing.

`succinct.js` borrows the Python philosophy that there should be only one
obvious way to do things. I think people drastically underestimate the cost
of multiparadigm programming creating a bunch of abstractions that aren't
really compatible with each other. Inevitably this creates duplication of
functionality--the same functionality implemented in different paradigms--
which is both inobvious, and hard to remove because the paradigms can't
interface with each other well.

This means we have to get the paradigm we choose right, so I want to develop
`succinct.js` slowly.

We'll break backwards compatibility if we have to, but not very often, and
I hope that once a version is supported it will always be supported, though.
