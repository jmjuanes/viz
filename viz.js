// Just a tiny utility to create SVG elements
const createNode = (tag, parent) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (parent) {
        parent.appendChild(element);
    }
    return element;
};

// Tiny utility to get the value from a data
const getValueOf = (getValue, datum, index, defaultValue = null) => {
    if (typeof getValue === "function") {
        return getValue(datum, index);
    }
    else if (typeof getValue === "string" && datum !== null) {
        return datum[getValue];
    }
    return getValue ?? defaultValue;
};

// Basic point geom
const pointGeom = (data, options = {}) => {
    return (parent, draw) => {
        (data || []).forEach((item, index) => {
            const element = createNode("circle", parent);
            element.setAttribute("cx", getValueOf(options.x, item, index, 0));
            element.setAttribute("cy", getValueOf(options.y, item, index, 0));
            element.setAttribute("fill", getValueOf(options.fill, item, index, "#000"));
            element.setAttribute("r", getValueOf(options.radius, item, index, 2));
        });
    };
};

// Generate a simple plot
const plot = (options = {}, parent = null) => {
    const scene = createNode("svg", parent);
    const target = createNode("g", scene);
    // Set scene attributes
    scene.setAttribute("width", options.width ?? 500);
    scene.setAttribute("height", options.height ?? 500);
    scene.style.setProperty("user-select", "none"); // Disable user selection
    // Calculate margins and drawing size
    const margin = options.margin ?? 0;
    const width = (options.width ?? 500) - margin;
    const height = (options.height ?? 500) - margin;
    target.setAttribute("transform", `translate(${margin},${margin})`);
    // Iterate over all available geoms
    (options.geoms ?? []).forEach(geom => {
        return geom(createNode("g", target), {width, height});
    });

    return scene;
};

export default {
    plot,
    point: pointGeom,
};
