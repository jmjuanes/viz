// Clamp the provided value
const clamp = (value, min, max) => {
    return Math.min(max, Math.max(min, value));
};

// Create SVG elements
const createNode = (tag, parent) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (parent) {
        parent.appendChild(element);
    }
    return element;
};

// Build a linear scale
// Returns a function f(x) € [rangeMin, rangeMax], where x € [domainStart, domainEnd]
const linearScale = (options = {}) => {
    const domain = options?.domain;
    const range = options?.range;
    if (options?.zero) {
        domain[0] = Math.min(0, domain[0]); // ensure that domain start has a zero
        domain[1] = Math.max(0, domain[1]); // ensure that domain end has a zero
    }
    // Scale generator
    const scale = value => {
        const v = clamp(value, domain[0], domain[1]); 
        return range[0] + (range[1] - range[0]) * (v - domain[0]) / (domain[1] - domain[0]);
    };
    // Add scale metadata
    scale.type = "linear";
    scale.range = range;
    scale.domain = domain;
    // Invert the scale transform
    scale.invert = value => {
        const v = clamp(value, range[0], range[1]);
        return domain[0] + (v - range[0]) * (domain[1] - domain[0]) / (range[1] - range[0]);
    };
    return scale;
};

// Discrete scale generator
const discreteScale = (options = {}) => {
    const range = options?.range;
    const domain = new Map();
    options?.domain.forEach((value, index) => {
        domain.set(value, index);
    });
    const scale = value => {
        return domain.has(value) ? range[domain.get(value) % range.length] : null;
    };
    scale.type = "discrete";
    scale.range = range;
    scale.domain = options?.domain;
    return scale;
};

// Interval scale
const intervalScale = (options = {}) => {
    const margin = clamp(options?.margin ?? 0, 0, 1);
    const spacing = clamp(options?.spacing ?? 0, 0, 1);
    const domain = options?.domain;
    const range = options?.range;
    const intervals = domain.length; // Initialize the number of intervals
    const length = range[1] - range[0];
    const step = length / (2 * margin + (intervals - 1) * spacing + intervals);
    const scale = discreteScale({
        range: domain.map((value, index) => {
            return range[0] + step * (margin + index * spacing + index);
        }), 
        domain: domain,
    });
    scale.type = "interval";
    scale.step = step;
    scale.range = range;
    scale.spacing = spacing;
    scale.margin = margin;
    return scale;
};

// Point scale generator
const pointScale = (options = {}) => {
    const margin = clamp(options?.margin ?? 0, 0, 1);
    const domain = options?.domain;
    const range = options?.range;
    const length = range[1] - range[0];
    const step = length / (2 * margin + domain.length - 1);
    const scale = discreteScale({
        range: domain.map((value, index) => {
            return range[0] + step * (margin + index);
        }),
        domain: domain
    });
    scale.type = "point";
    scale.step = step;
    scale.margin = margin,
    scale.range = range;
    return scale;
};

// Create a path
const createPath = () => {
    const path = [];
    return {
        // Move the current point to the coordinate x,y
        move: (x, y) => path.push(`M${x},${y}`),
        // Draw a line from the current point to the end point specified by x,y
        line: (x, y) => path.push(`L${x},${y}`),
        // Draw a horizontal line from the current point to the end point
        hLine: x => path.push(`H${x}`),
        // Draw a vertical line from the current point to the end point
        vLine: y => path.push(`V${y}`),
        // Draw an arc from the current point to the specified point
        // rx and ry are the two radius of the ellipse
        // angle represents a rotation (in degree) of the ellipse relative to the x-axis
        // laf (large-arc-flag) allows to chose one of the large arc (1) or small arc (0)
        // sf (sweep-flag) allows to chose one of the clockwise turning arc (1) or anticlockwise turning arc (0)
        // x and y become the new current point for the next command
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#Elliptical_Arc_Curve 
        arc: (rx, ry, angle, laf, sf, x, y) => {
            path.push(`A${rx},${ry},${angle},${laf},${sf},${x},${y}`);
        },
        // Draw a quadratic Bézier curve from the current point to the end point specified by x,y
        // The control point is specified by x1,y1 
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#Quadratic_B%C3%A9zier_Curve 
        quadraticCurve: (x1, y1, x, y) => {
            path.push(`Q${x1},${y1},${x},${y}`);
        },
        // Draw a cubic Bézier curve from the current point to the end point specified by x,y
        // The start control point is specified by x1,y1
        // The end control point is specified by x2,y2
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#Cubic_B%C3%A9zier_Curve
        bezierCurve: (x1, y1, x2, y2, x, y) => {
            path.push(`C${x1},${y1},${x2},${y2},${x},${y}`);
        },
        // Close the current path
        close: () => path.push("Z"),
        // Get full path
        toString: () => path.join(" "),
    };
};

// Create a polyline
const createPolyline = (points, closed = false) => {
    const path = createPath();
    if (points && points.length > 0) {
        // Move to the first point of the polyline
        path.move(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            path.line(points[i][0], points[i][1]);
        }
        // Check for closing the path
        if (closed) {
            path.close();
        }
    }
    return path.toString();
};

// Create a rectangle
const createRectangle = args => {
    // Check for no rounded rectangle
    if (typeof args.radius !== "number" || args.radius === 0 || args.width < 2 * args.radius || args.height < 2 * args.radius) {
        const points = [
            [args.x, args.y],
            [args.x + args.width, args.y],
            [args.x + args.width, args.y + args.height],
            [args.x, args.y + args.height]
        ];
        return createPolyline(points, true);
    }
    const path = createPath();
    path.move(args.x + args.radius, args.y);
    path.hLine(args.x + args.width - args.radius);
    path.arc(args.radius, args.radius, 0, 0, 1, args.x + args.width, args.y + args.radius);
    path.vLine(args.y + args.height - args.radius);
    path.arc(args.radius, args.radius, 0, 0, 1, args.x + args.width - args.radius, args.y + args.height);
    path.hLine(args.x + args.radius);
    path.arc(args.radius, args.radius, 0, 0, 1, args.x, args.y + args.height - args.radius);
    path.vLine(args.y + args.radius);
    path.arc(args.radius, args.radius, 0, 0, 1, args.x + args.radius, args.y);
    // Check for mask rectangle
    // if (args.mask === true) {
    //     rect.line(args.x, args.y);
    //     rect.line(args.x, args.y + args.height);
    //     rect.line(args.x + args.width, args.y + args.height);
    //     rect.line(args.x + args.width, args.y);
    // }
    path.close();
    return path.toString();
};

// Generate a circle path
const createCircle = args => {
    const path = createPath();
    path.move(args.x - args.radius, args.y);
    path.arc(args.radius, args.radius, 0, 1, 1, args.x + args.radius, args.y);
    path.arc(args.radius, args.radius, 0, 1, 1, args.x - args.radius, args.y);
    path.close();
    return path.toString();
};

// Linear curve generator
const createLinearCurve = path => {
    let state = 0;
    return {
        end: () => null,
        point: (x, y) => {
            // State 0: move to the specified point
            // State 1: draw a line to this point
            state === 0 ? path.move(x, y) : path.line(x, y);
            state = 1;
        },
    };
};

// Catmull Rom curve generator
const createCatmullRomCurve = (path, t) => {
    let state = 0;
    let x0 = null, x1 = null, x2 = null;
    let y0 = null, y1 = null, y2 = null;
    const tension = (typeof t === "number" ? Math.min(Math.max(t, 0), 1) : 0.5) * 12;
    const addPoint = (x, y) => {
        // State 0 or 3: first point added or resume the interpolation
        if (state === 0 || state === 3) {
            // Move to the specified point only if is the first point
            if (state === 0) {
                path.move(x, y);
            }
            // Draw a line to the specified point
            else {
                path.line(x, y);
            }
            // Duplicate this point
            x2 = x, y2 = y;
            state = 1;
        }
        // State 1: second point added --> update the state and continue
        else if (state === 1) {
            state = 2;
        }
        // State 2: new point: draw the curve
        else if (state === 2) {
            const c1x = (-x0 + tension * x1 + x2) / tension;
            const c1y = (-y0 + tension * y1 + y2) / tension;
            const c2x = (x1 + tension * x2 - x) / tension;
            const c2y = (y1 + tension * y2 - y) / tension;
            path.bezierCurve(c1x, c1y, c2x, c2y, x2, y2);
        }
        // Update the points
        x0 = x1, y0 = y1;
        x1 = x2, y1 = y2;
        x2 = x, y2 = y;
    };
    return {
        end: () => {
            if (state === 2) {
                addPoint(x2, y2);
            }
            state = 3;
        },
        point: (x, y) => addPoint(x, y),
    };
};

const createCurve = (curve = "linear", path) => {
    if (curve === "catmull" || curve === "catmull-rom") {
        return createCatmullRomCurve(path);
    }
    return createLinearCurve(path);
};

// Get the value from a data
const getValueOf = (getValue, datum, index, defaultValue = null) => {
    if (typeof getValue === "function") {
        return getValue(datum, index) ?? defaultValue;
    }
    else if (typeof getValue === "string" && getValue) {
        if (typeof datum === "object" && datum !== null) {
            return datum[getValue] ?? getValue;
        }
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
    return parent => {
        buildGeom(data, options, (item, index, opt) => {
            const element = createNode("circle", parent);
            element.setAttribute("cx", getValueOf(opt.x, item, index, 0));
            element.setAttribute("cy", getValueOf(opt.y, item, index, 0));
            element.setAttribute("fill", getValueOf(opt.fill, item, index, "#000"));
            element.setAttribute("r", getValueOf(opt.radius, item, index, 2));
        });
    };
};

// Rectangle Geom
const rectangleGeom = (data, options = {}) => {
    return parent => {
        return buildGeom(data, options, (datum, index, opt) => {
            const element = createNode("path", parent);
            const path = createRectangle({
                x: getValueOf(opt.x, datum, index, 0),
                y: getValueOf(opt.y, datum, index, 0),
                width: getValueOf(opt.width, datum, index, 0),
                height: getValueOf(opt.height, datum, index, 0),
                radius: getValueOf(opt.radius, datum, index, 0),
            });
            element.setAttribute("d", path);
            element.setAttribute("fill", getValueOf(opt.fill, datum, index, "transparent"));
            element.setAttribute("stroke", getValueOf(opt.strokeColor, datum, index, "#000"));
            element.setAttribute("stroke-width", getValueOf(opt.strokeWidth, datum, index, 1));
        });
    };
};

// Circle Geom
const circleGeom = (data, options = {}) => {
    return parent => {
        return buildGeom(data, options, (datum, index, opt) => {
            const element = createNode("path", parent);
            const path = createCircle({
                x: getValueOf(opt.x, datum, index, 0),
                y: getValueOf(opt.y, datum, index, 0),
                radius: getValueOf(opt.radius, datum, index, 0),
            });
            element.setAttribute("d", path);
            element.setAttribute("fill", getValueOf(opt.fill, datum, index, "transparent"));
            element.setAttribute("stroke", getValueOf(opt.strokeColor, datum, index, "#000"));
            element.setAttribute("stroke-width", getValueOf(opt.strokeWidth, datum, index, 1));
        });
    };
};

// Text geom
const textGeom = (data, options = {}) => {
    return parent => {
        buildGeom(data, options, (datum, index, opt) => {
            const element = createNode("text", parent);
            const x = getValueOf(opt.x, datum, index, 0);
            const y = getValueOf(opt.y, datum, index, 0);
            element.setAttribute("x", x);
            element.setAttribute("y", y);
            element.textContent = getValueOf(opt.text, datum, index, "");
            if (typeof opt.rotation !== "undefined") {
                element.setAttribute("transform", `rotate(${getValueOf(opt.rotation, datum, index)}, ${x}, ${y})`);
            }
            element.setAttribute("text-anchor", getValueOf(opt.textAnchor, datum, index, "middle"));
            element.setAttribute("dominant-baseline", getValueOf(opt.baseline, datum, index, "middle"));
            element.setAttribute("fill", getValueOf(opt.fill, datum, index, "#000"));
            element.setAttribute("font-size", getValueOf(opt.size, datum, index, 16));
        });
    };
};

// Simple line geom
const lineGeom = (data, options = {}) => {
    return parent => {
        return buildGeom(data, options, (datum, index, opt) => {
            const element = createNode("path", parent);
            const path = createPolyline([
                [getValueOf(opt.x1, datum, index, 0), getValueOf(opt.y1, datum, index, 0)],
                [getValueOf(opt.x2, datum, index, 0), getValueOf(opt.y2, datum, index, 0)],
            ]);
            element.setAttribute("d", path);
            element.setAttribute("fill", "none"); // Prevent filled lines
            element.setAttribute("stroke", getValueOf(opt.strokeColor, datum, index, "#000"));
            element.setAttribute("stroke-width", getValueOf(opt.strokeWidth, datum, index, 1));
        });
    };
};

// Horizontal rule geom
const xRuleGeom = (data, options = {}) => {
    return (parent, draw) => {
        return buildGeom(data, options, (datum, index, opt) => {
            const element = createNode("path", parent);
            const y = getValueOf(opt.y, datum, index, 0);
            element.setAttribute("d", createPolyline([[0, y], [draw.width, y]]));
            element.setAttribute("fill", "none"); // Prevent filled lines
            element.setAttribute("stroke", getValueOf(opt.strokeColor, datum, index, "#000"));
            element.setAttribute("stroke-width", getValueOf(opt.strokeWidth, datum, index, 1));
        });
    };
};

// Vertical rule geom
const yRuleGeom = (data, options = {}) => {
    return (parent, draw) => {
        return buildGeom(data, options, (datum, index, opt) => {
            const element = createNode("path", parent);
            const x = getValueOf(opt.x, datum, index, 0);
            element.setAttribute("d", createPolyline([[x, 0], [x, draw.height]]));
            element.setAttribute("fill", "none"); // Prevent filled lines
            element.setAttribute("stroke", getValueOf(opt.strokeColor, datum, index, "#000"));
            element.setAttribute("stroke-width", getValueOf(opt.strokeWidth, datum, index, 1));
        });
    };
};

// Curve geom
const curveGeom = (data, options = {}) => {
    return parent => {
        const path = createPath();
        const element = createNode("path", parent);
        element.setAttribute("fill", "none"); // Prevent filled lines
        element.setAttribute("stroke", getValueOf(options.strokeColor, data[0], 0, "#000"));
        element.setAttribute("stroke-width", getValueOf(options.strokeWidth, data[0], 0, 1));
        // Data must be a valid array and with at least 2 items
        if (data && data.length >= 2) {
            const curveType = getValueOf(options.curve, data[0], 0, "linear");
            const curve = createCurve(curveType, path);
            for (let i = 0; i < data.length; i++) {
                const x = getValueOf(options.x, data[i], i, 0);
                const y = getValueOf(options.y, data[i], i, 0);
                curve.point(x, y);
            }
            curve.end();
        }
        element.setAttribute("d", path.toString());
    };
};

// Area geom
const areaGeom = (data, options = {}) => {
    return parent => {
        const path = createPath();
        const element = createNode("path", parent);
        element.setAttribute("fill", getValueOf(options.fill, data[0], 0, "#000"));
        element.setAttribute("stroke", getValueOf(options.strokeColor, data[0], 0, "#000"));
        element.setAttribute("stroke-width", getValueOf(options.strokeWidth, data[0], 0, 1));
        // Data must be a valid array and with at least 2 items
        if (data && data.length >= 2) {
            const curveType = getValueOf(options.curve, data[0], 0, "linear");
            const curve = createCurve(curveType, path);
            // Move forward
            for (let i = 0; i < data.length; i++) {
                const x = getValueOf(options.x1, data[i], i, 0);
                const y = getValueOf(options.y1, data[i], i, 0);
                curve.point(x, y);
            }
            curve.end();
            // Move reverse
            for (let i = data.length - 1; i >= 0; i--) {
                const x = getValueOf(options.x2, data[i], i, 0);
                const y = getValueOf(options.y2, data[i], i, 0);
                curve.point(x, y);
            }
            curve.end();
            path.close();
        }
        element.setAttribute("d", path.toString());
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
    path: createPath,
    geom: {
        text: textGeom,
        point: pointGeom,
        rectangle: rectangleGeom,
        circle: circleGeom,
        line: lineGeom,
        xRule: xRuleGeom,
        yRule: yRuleGeom,
        curve: curveGeom,
        area: areaGeom,
    },
    scale: {
        linear: linearScale,
        discrete: discreteScale,
        interval: intervalScale,
        point: pointScale,
    },
    math: {
        clamp: clamp,
    },
};
