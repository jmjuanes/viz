# viz

**Viz** is a JavaScript plotting library for the web, designed to simplify the process of creating visualizations. It follows a declarative approach and is rooted in the principles of the Grammar of Graphics, making it intuitive and powerful for users of all levels.

## Try it

We are working on a playground pp that you can use to try **viz**.

## Getting Started

### Installation

You can add it to your project using YARN or NPM:

```bash
## Install using NPM
$ npm install --save viz-js

## Install using YARN
$ yarn add viz-js
```

### Usage

```javascript
import viz from "viz-js";

// 1. Get the element where the plot will be displayed
const parent = document.getElementById("root");

// 2. Create your plot
const data = [1, 5, 2, 3, 9, 5, 6, 3, 4];
const plot = viz.plot({
    width: 600,
    height: 400,
    margin: 50,
    grid: true,
    x: {
        scale: "linear",
        domain: [0, data.length - 1]
    },
    y: {
        scale: "linear",
        domain: [0, 10],
    },
    geoms: [
        viz.geom.curve(data, {x: (d, i) => i, y: d => d}),
    ],
});

// 3. Display your plot
parent.appendChild(plot);
```

## API

This is still a work in progress.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
