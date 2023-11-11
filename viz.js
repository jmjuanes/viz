// Create SVG elements
const createNode = (tag, parent) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (parent) {
        parent.appendChild(element);
    }
    return element;
};

// Get the value from a data
const getValueOf = (getValue, datum, index, defaultValue = null) => {
    if (typeof getValue === "function") {
        return getValue(datum, index);
    }
    else if (typeof getValue === "string" && datum !== null) {
        return datum[getValue];
    }
    return getValue ?? defaultValue;
};

const buildGeom = (data, options, fn) => {
    // Check if a data object has been provided, so we will generate a geom for each datum
    if (data && Array.isArray(data)) {
        return data.forEach((item, index) => fn(item, index, options));
    }
    // If not, generate a single geom using provided options
    else if (data && typeof data === "object") {
        return fn(null, 0, data);
    }
};

// Point geom
const pointGeom = (data, options = {}) => {
    return (parent, draw) => {
        buildGeom(data, options, (item, index, opt) => {
            const element = createNode("circle", parent);
            element.setAttribute("cx", getValueOf(opt.x, item, index, 0));
            element.setAttribute("cy", getValueOf(opt.y, item, index, 0));
            element.setAttribute("fill", getValueOf(opt.fill, item, index, "#000"));
            element.setAttribute("r", getValueOf(opt.radius, item, index, 2));
        });
    };
};

// Generate a simple plot
const createPlot = (options = {}, parent = null) => {
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
    plot: createPlot,
    geoms: {
        point: pointGeom,
    },
};
