# VizJar

**VizJar** is a JavaScript plotting library for the web, designed to simplify the process of creating visualizations. It follows a declarative approach and is rooted in the principles of the Grammar of Graphics, making it intuitive and powerful for users of all levels.

## Try it

We are working on a playground app that you can use to try **vizjar**.

## Getting Started

### Installation

You can add it to your project using YARN or NPM:

```bash
## Install using NPM
$ npm install --save vizjar

## Install using YARN
$ yarn add vizjar
```

### Usage

```javascript
import viz from "vizjar";

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

**Note**: this is still a work in progress.

### Transforms

Transforms are plain functions that, given a configuration object, returns a new function that generates derived data. These transforms provide a powerful way to manipulate and extract information from your dataset.

Transforms can be applied in two ways:

- Using the `vizjar.data.transform(data, transforms)` function. It takes your data as the first argument and an array of transforms as the second argument, and returns a derived dataset with the specified transformations applied.

- Using the `transform` field in each geom. Each geom in your visualization can specify its own transformations using the transform option.


#### Transforms API

##### vizjar.transform.pivot(options)

The pivot transform allows you to reshape and reorganize your dataset, converting long-format data into a more convenient wide-format. This transformation is particularly useful for improving data analysis and visualization, especially when dealing with categorical variables.

The `options` object of the pivot transform accepts the following keys:

- `field` (**mandatory**): the field to pivot on. This field determines the categories or groups for the new columns in the pivoted data.

- `value` (**mandatory**): the field to populate the pivoted fields. Values from this field will be used to fill in the cells of the pivoted data.

- `groupby` (optional): An array of data fields to group by before applying the pivot. If not specified, a single group containing all data objects will be used.

- `op` (optional): the operation to apply to grouped `value` field values. The default operation is `sum``. This option allows you to specify how to aggregate or combine values when they share the same category in the pivoted data.

Example:

```javascript
const data = [
    {time: "2022-01-01", measurement: "temperature", value: 25},
    {time: "2022-01-01", measurement: "humidity", value: 50},
    {time: "2022-01-02", measurement: "temperature", value: 26},
    {time: "2022-01-02", measurement: "humidity", value: 48},
];
const pivotedData = vizjar.data.transform(data, [
    vizjar.transforms.pivot({
        groupby: "time",
        field: "measurement",
        value: "value",
    }),
]);
// pivotedData = [
//     {time: "2022-01-01", temperature: 25, humidity: 50},
//     {time: "2022-01-02", temperature: 26, humidity: 48},
// ]
```

##### vizjar.transform.selectFirst()

A transform function that returns a new dataset containing only the first item of your data.

```javascript
const data = [1, 2, 3, 4];
const newData = vizjar.data.transform(data, [
    vizjvar.transform.selectFirst(),
]);
// newData = [1]
```

##### vizjar.transform.selectLast()

A transform function that returns a new dataset containing only the last item of your data.

```javascript
const data = [1, 2, 3, 4];
const newData = vizjar.data.transform(data, [
    vizjvar.transform.selectLast(),
]);
// newData = [4]
```

##### vizjar.transform.selectMin(options)

Returns a new dataset containing only the item that has the minimum value in the specified field. The `options` argument is an object that accepts the following parameters: 

- `field` (**mandatory**): The field based on which the minimum value is determined.

##### vizjar.transform.selectMax(options)

Returns a new dataset containing only the item that has the maximum value in the specified field. The `options` argument is an object that accepts the following parameters:

- `field` (**mandatory**): The field based on which the maximum value is determined.

##### vizjar.transform.stack(options)

The stack transform transforms your dataset into a stacked representation suitable for creating stacked visualizations. This transform computes a layout by stacking groups of values and adds two properties to each item of your data, indicating the starting and ending stack values. The stack transform options accepts the following keys:

- `field` (**mandatory**): the field on which to stack the data. This field represents the categories (X-axis) for the stacked visualization.

- `groupby` (optional): an array of data fields to group by before applying the stack. If not specified, a single group containing all data objects will be used.

- `as` (optional): an array containing the names of the fields where the starting and ending stack values will be saved. Default is `[y0, y1]`.

Example of a stack transform:

```javascript
const data = [
    {time: "2022-01-01", value: 100},
    {time: "2022-01-01", value: 80},
    {time: "2022-01-02", value: 110},
    {time: "2022-01-02", value: 90},
];

const stackedData = vizjar.data.transform(data, [
    vizjar.transforms.stack({
        groupby: "time",
        field: "value",
    }),
]);
// stackedData = [
//    {time: "2022-01-01", value: 100, y0: 0, y1: 100},
//    {time: "2022-01-01", value: 80, y0: 100, y1: 180},
//    {time: "2022-01-02", value: 110, y0: 0, y1: 110},
//    {time: "2022-01-02", value: 90, y0: 110, y1: 200},
// ];
```

##### vizjar.transform.summarize(options)

The Summarize transform facilitates grouping and summarizing your data, for example for computing counts, sums, averages, and other descriptive statistics over groups of data objects. The summarize transform accepts the following options:

- `fields` (optional): an array of data fields for which to compute aggregate functions. This array should align with the `ops` and `as` arrays. If no fields and ops are specified, a count aggregation will be used by default.

- `ops` (optional): an array of aggregation operations to apply to the fields, such as sum, average, or count. If no `ops` are specified, a count aggregation will be used by default.

- `as` (optional): an array of output field names to use for each aggregated field in fields. If not specified, names will be automatically generated based on the operation and field names.

- `groupby` (optional): an array of data fields to group by. If not specified, a single group containing all data objects will be used.

Example of using the summarize transform:

```javascript
const summarizedData = vizjar.data.transform(data, [
    vizjar.transforms.summarize({
        fields: ["value"],
        ops: ["sum"],
        as: ["totalValue"],
    }),
]);
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
