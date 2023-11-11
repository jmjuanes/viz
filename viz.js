// Create SVG elements
const createNode = (tag, parent) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (parent) {
        parent.appendChild(element);
    }
    return element;
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
    },
};
