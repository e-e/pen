/**
 * Draws stuff
 */
class Pen {
  /**
   * @param {object} encoder - encoder/decoder module
   * @param {object} rules - Pen rules object (settings)
   * @param {*} [instructions] -
   */
  constructor(encoder, rules, instructions = '') {
    this.encoder = encoder;
    this.rules = rules;
    this.rawInstructions = null;
    this.instructions = null;
    this.reset();
    if (instructions.trim().length) {
      this.draw(instructions);
    }
  }

  /**
   * Check whether a number is between two other numbers
   * https://gist.github.com/gordonwoodhull/50eb65d2f048789f9558
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @returns {boolean}
   */
  static between(a, b, c) {
    const eps = 0.0000001;
    return a - eps <= b && b <= c + eps;
  }
  /**
   * Get intersection point of two line segments
   * https://gist.github.com/gordonwoodhull/50eb65d2f048789f9558
   * @param {object} pt1 - pt1 of segment 1
   * @param {object} pt2 - pt2 of segment 1
   * @param {object} pt3 - pt1 of segment 2
   * @param {object} pt4 - pt2 of segment 2
   * @returns {object|boolean}
   */
  static intersection(pt1, pt2, pt3, pt4) {
    var x =
      ((pt1.x * pt2.y - pt1.y * pt2.x) * (pt3.x - pt4.x) -
        (pt1.x - pt2.x) * (pt3.x * pt4.y - pt3.y * pt4.x)) /
      ((pt1.x - pt2.x) * (pt3.y - pt4.y) - (pt1.y - pt2.y) * (pt3.x - pt4.x));
    var y =
      ((pt1.x * pt2.y - pt1.y * pt2.x) * (pt3.y - pt4.y) -
        (pt1.y - pt2.y) * (pt3.x * pt4.y - pt3.y * pt4.x)) /
      ((pt1.x - pt2.x) * (pt3.y - pt4.y) - (pt1.y - pt2.y) * (pt3.x - pt4.x));
    if (isNaN(x) || isNaN(y)) {
      return false;
    } else {
      if (pt1.x >= pt2.x) {
        if (!Pen.between(pt2.x, x, pt1.x)) {
          return false;
        }
      } else {
        if (!Pen.between(pt1.x, x, pt2.x)) {
          return false;
        }
      }
      if (pt1.y >= pt2.y) {
        if (!Pen.between(pt2.y, y, pt1.y)) {
          return false;
        }
      } else {
        if (!Pen.between(pt1.y, y, pt2.y)) {
          return false;
        }
      }
      if (pt3.x >= pt4.x) {
        if (!Pen.between(pt4.x, x, pt3.x)) {
          return false;
        }
      } else {
        if (!Pen.between(pt3.x, x, pt4.x)) {
          return false;
        }
      }
      if (pt3.y >= pt4.y) {
        if (!Pen.between(pt4.y, y, pt3.y)) {
          return false;
        }
      } else {
        if (!Pen.between(pt3.y, y, pt4.y)) {
          return false;
        }
      }
    }
    return { x: Math.ceil(x), y: Math.ceil(y) };
  }

  /**
   * Getter for the output string
   * @returns {string}
   */
  get output() {
    return this.state.output.join('\n').trim();
  }

  /**
   * Reset the state object
   * @returns {void}
   */
  reset() {
    this.state = {
      output: [],
      x: 0,
      y: 0,
      penDown: false,
      color: [0, 0, 0, 255],
      outside: false
    };
  }

  /**
   * Initialize values
   * @param {string} instructions - String containing the pen instructions
   * @returns {void}
   */
  init(instructions) {
    this.reset();
    this.rawInstructions = instructions;
    this.instructions = this.parse(instructions);
  }

  /**
   * Parse out commands and their arguments
   * @param {string} instructions - String containing the pen instructions
   */
  parse(instructions) {
    const keys = Object.keys(this.rules.cmds);
    const re = new RegExp(`(${keys.join('|')})`, 'g');
    let parts = instructions
      .split(re)
      .map(part => part.trim())
      .filter(part => part.length);
    let rules = [];
    while (parts.length) {
      let part = parts.shift();
      if (part.length === 2) {
        rules.push({ cmd: part, args: '' });
      } else {
        rules[rules.length - 1].args = part;
      }
    }
    return rules;
  }

  /**
   * Split a string into segments of n-length
   * @param {string} args - String to be split
   * @param {number} n - Length of each segment
   * @returns {array}
   */
  splitArgs(args, n = 4) {
    let re = new RegExp(`.{1,${n}}`, 'g');
    return args.match(re);
  }

  /**
   * Takes instructions and returns the output
   * @param {string} instructions - String containing the pen instructions
   * @returns {string}
   */
  draw(instructions) {
    this.init(instructions);
    this.process();
    return this.output;
  }

  /**
   * Removes any extra characters from the argument string
   * @param {array} args - String of parameters for a command
   * @returns {string}
   */
  shaveArgs(args) {
    if (args.length % 4) {
      let rem = args.length % 4;
      args = args.substr(0, args.length - rem);
    }
    return args;
  }

  /**
   * Runs through all commands
   * @returns {void}
   */
  process() {
    if (this.instructions.constructor !== Array) {
      throw new Error('Malformed instructions');
    }
    this.instructions.forEach(rule => {
      let cmd = this.rules.cmds[rule.cmd].cmd;
      let args = this.shaveArgs(rule.args);

      if (args.length) {
        args = this.splitArgs(args, 4).map(arg => {
          arg = this.splitArgs(arg, 2);
          return this.encoder.decode(...arg);
        });
      }
      this[cmd.toLowerCase()](args);
    });
  }

  /**
   * Takes an array of points [x0, y0, ..., xn, yn] and returns an arra of point objects
   * @param {array} args
   * @returns {array}
   */
  getPoints(args) {
    let pts = [];
    for (let i = 0; i < args.length - 1; i = i + 2) {
      pts.push({ x: args[i], y: args[i + 1] });
    }
    return pts;
  }

  /**
   * Determines if the segment intersects any of the 'canvas' boundaries. The segment is the line
   * connecting the starting and ending points of the current MV operation
   * @param {*} pt1 - Pt1 of the segment
   * @param {*} pt2 - Pt2 of the segment
   * @returns {boolean}
   */
  intersects(pt1, pt2) {
    let pt = this.getIntersection(pt1, pt2);
    return pt && !isNaN(pt.x) && !isNaN(pt.y);
  }

  /**
   * Get the intersection point of the line connecting the starting position and ending position and one
   * of the four boundary segments (if the intersection exists)
   * @param {object} pt1 - Pt1 one of the segment
   * @param {*} pt2 - Pt2 of the segment
   * @returns {object|boolean}
   */
  getIntersection(pt1, pt2) {
    for (let i = 0; i < this.rules.settings.segments.length; i++) {
      let seg = this.rules.settings.segments[i];
      let int = Pen.intersection(pt1, pt2, seg.pt1, seg.pt2);
      if (int && !isNaN(int.x) && !isNaN(int.y)) return int;
    }
    return false;
  }

  /**
   * Move the pen
   * @param {array} args
   * @returns {void}
   */
  mv(args) {
    let pts = this.getPoints(args);
    let output = 'MV';
    if (!this.state.penDown) {
      pts = [pts[0]];
    }
    pts.forEach(pt => {
      let startPt = { x: this.state.x, y: this.state.y };
      let endPt = { x: this.state.x + pt.x, y: this.state.y + pt.y };
      this.state.x += pt.x;
      this.state.y += pt.y;

      let doesIntersect = this.intersects(startPt, endPt);
      let intpt = this.getIntersection(startPt, endPt);
      let wasOutside = this.state.outside;

      if (doesIntersect) {
        this.state.outside = !this.state.outside;
      }
      // starting inside
      if (!wasOutside) {
        if (doesIntersect) {
          this.state.output.push(`${output} (${intpt.x}, ${intpt.y});`);
          output = 'MV';
          this.pen([0]);
        } else {
          output = `${output} (${this.state.x}, ${this.state.y})`;
        }
        // starting outside
      } else {
        if (doesIntersect) {
          this.state.output.push(`MV (${intpt.x}, ${intpt.y});`);
          output = 'MV';
          this.pen([1]);
          if (wasOutside) {
            output = `${output} (${this.state.x}, ${this.state.y})`;
          }
        } else {
          //
        }
      }
    });
    if (output !== 'MV') {
      this.state.output.push(`${output};`);
    }
  }

  /**
   * Clears the 'canvas'. Reset state values to default.
   * @returns {void}
   */
  clr() {
    this.reset();
    this.state.output.push('CLR;');
  }

  /**
   * Moves the pen up or down
   * @returns {void}
   */
  pen(args) {
    if (!!args[0]) {
      this.state.output.push('PEN DOWN;');
      this.state.penDown = true;
    } else {
      this.state.output.push('PEN UP;');
      this.state.penDown = false;
    }
  }

  /**
   * Sets the color of the pen
   * @returns {void}
   */
  co(args) {
    this.state.color = args;
    this.state.output.push(`CO ${args[0]} ${args[1]} ${args[2]} ${args[3]};`);
  }
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Pen;
} else {
  window.Pen = Pen;
}
