const rules = {
  settings: {
    segments: [
      { pt1: { x: -8192, y: 8191 }, pt2: { x: 8191, y: 8191 } },
      { pt1: { x: 8191, y: 8191 }, pt2: { x: 8191, y: -8192 } },
      { pt1: { x: 8191, y: -8192 }, pt2: { x: -8192, y: -8192 } },
      { pt1: { x: -8192, y: -8192 }, pt2: { x: -8192, y: 8191 } }
    ]
  },
  cmds: {
    F0: { cmd: 'CLR' },
    '80': { cmd: 'PEN' },
    A0: { cmd: 'CO' },
    C0: { cmd: 'MV' }
  }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = rules;
} else {
  window.rules = rules;
}
