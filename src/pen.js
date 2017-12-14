const encoder = require('./encoder');

class Pen {
  /**
   * @param {object} encoder - encoder/decoder module
   * @param {object} rules - Pen rules object (settings)
   * @param {*} [instructions] - 
   */
  constructor(encoder, rules, instructions = '') {
    this.encoder = encoder;
    this.rules = rules;
    // @string
    this.rawInstructions = null;
    // @array
    this.instructions = null;
    this.reset();
    if (instructions.trim().length) {
      this.draw(instructions);
    }
  }
  /**
   * 
   * @param {number} a 
   * @param {number} b 
   * @param {number} c 
   */
  // https://gist.github.com/gordonwoodhull/50eb65d2f048789f9558
  static between(a, b, c) {
    const eps = 0.0000001;
    return a - eps <= b && b <= c + eps;
  }
  /**
   * 
   * @param {object} pt1 - pt1 of segment 1
   * @param {object} pt2 - pt2 of segment 1
   * @param {object} pt3 - pt1 of segment 2
   * @param {object} pt4 - pt2 of segment 2
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

  get output() {
    return this.state.output.join('\n').trim();
  }
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
  init(instructions) {
    this.reset();
    this.rawInstructions = instructions;
    this.instructions = this.parse(instructions);
  }
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
  splitArgs(args, n = 4) {
    let re = new RegExp(`.{1,${n}}`, 'g');
    return args.match(re);
  }
  draw(instructions) {
    this.init(instructions);
    // console.log(this.instructions);
    this.process();
    return this.output;
  }
  shaveArgs(args) {
    if (args.length % 4) {
      let rem = args.length % 4;
      args = args.substr(0, args.length - rem);
    }
    return args;
  }
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

  getPoints(args) {
    let pts = [];
    for (let i = 0; i < args.length - 1; i = i + 2) {
      pts.push({ x: args[i], y: args[i + 1] });
    }
    return pts;
  }
  setPosition(x, y, wasOutside) {
    if (!this.state.outside) {
      this.state.x += x;
      this.state.y += y;
    }
  }

  intersects(pt1, pt2) {
    let pt = this.getIntersection(pt1, pt2);
    return pt && !isNaN(pt.x) && !isNaN(pt.y);
  }
  getIntersection(pt1, pt2) {
    for (let i = 0; i < this.rules.settings.segments.length; i++) {
      let seg = this.rules.settings.segments[i];
      // console.log(pt1, pt2, seg);
      let int = Pen.intersection(pt1, pt2, seg.pt1, seg.pt2);
      if (int && !isNaN(int.x) && !isNaN(int.y)) return int;
    }
    return false;
  }

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
            // this.state.output.push(`MV ;`);
          }
        } else {
          // console.log('skipping...', pt);
          // we're outside, so go to the next point
          // continue;
          // this.state.output.push('SKIPPED');
        }
      }
      // console.log(pt);
    });
    if (output !== 'MV') {
      this.state.output.push(`${output};`);
    }
  }
  /*
  move(pt) {
    let wasOut = this.state.outside;
    let lastx = this.state.x;
    let lasty = this.state.y;
    this.state.x += pt.x;
    this.state.y += pt.y;
    let pt1 = { x: lastx, y: lasty };
    let pt2 = { x: this.state.x, y: this.state.y };
    for (let i = 0; i < this.settings.segments; i++) {
      let seg = this.settings.segments[i];
      let intPt = Pen.intersection(pt1, pt2, seg.pt1, seg.pt2);
      // there is an intersection
      if (intPt && intPt.x && intPt.y) {
      }
    }
  }
  mvUp(pt) {
    this.move(pt);
    if (!this.state.outside) {
      this.state.output.push(`MV (${this.state.x}, ${this.state.y});`);
    }
  }
  mvDown(pts) {
    let ptstr =
      pts.reduce((str, pt) => {
        this.move(pt);
        return `${str} (${this.state.x}, ${this.state.y})`;
      }, 'MV') + ';';
    this.state.output.push(ptstr);
  }
  */

  /* commands */
  // mv(args) {
  //   let pts = this.getPoints(args);
  //   if (this.state.penDown) {
  //     this.mvDown(pts);
  //   } else {
  //     this.mvUp(pts[0]);
  //   }
  // }
  clr() {
    this.reset();
    this.state.output.push('CLR;');
  }
  pen(args) {
    if (!!args[0]) {
      this.state.output.push('PEN DOWN;');
      this.state.penDown = true;
    } else {
      this.state.output.push('PEN UP;');
      this.state.penDown = false;
    }
  }
  co(args) {
    this.state.color = args;
    this.state.output.push(`CO ${args[0]} ${args[1]} ${args[2]} ${args[3]};`);
  }
}

module.exports = Pen;
