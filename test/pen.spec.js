const assert = require('assert');
const Pen = require('../src/pen');
const encoder = require('../src/encoder');

const RULES = require('../src/rules');
const CASES = [
  {
    instructions: 'F0A04000417F4000417FC040004000804001C05F205F20804000',
    output: [
      'CLR;',
      'CO 0 255 0 255;',
      'MV (0, 0);',
      'PEN DOWN;',
      'MV (4000, 4000);',
      'PEN UP;'
    ].join('\n')
  },
  {
    instructions:
      'F0A040004000417F417FC04000400090400047684F5057384000804001C05F204000400001400140400040007E405B2C4000804000',
    output: [
      'CLR;',
      'CO 0 0 255 255;',
      'MV (0, 0);',
      'PEN DOWN;',
      'MV (4000, 0) (4000, -8000) (-4000, -8000) (-4000, 0) (-500, 0);',
      'PEN UP;'
    ].join('\n')
  },
  {
    instructions:
      'F0A0417F40004000417FC067086708804001C0670840004000187818784000804000',
    output: [
      'CLR;',
      'CO 255 0 0 255;',
      'MV (5000, 5000);',
      'PEN DOWN;',
      'MV (8191, 5000);',
      'PEN UP;',
      'MV (8191, 0);',
      'PEN DOWN;',
      'MV (5000, 0);',
      'PEN UP;'
    ].join('\n')
  },
  {
    instructions:
      'F0A0417F41004000417FC067086708804001C067082C3C18782C3C804000',
    output: [
      'CLR;',
      'CO 255 128 0 255;',
      'MV (5000, 5000);',
      'PEN DOWN;',
      'MV (8191, 3405);',
      'PEN UP;',
      'MV (8191, 1596);',
      'PEN DOWN;',
      'MV (5000, 0);',
      'PEN UP;'
    ].join('\n')
  }
];
describe('Utils', function() {
  it('should correctly determine if two line segments are intersecting', function() {
    let tests = [
      {
        segments: [
          { x: 11, y: 9 },
          { x: 20, y: 18 },
          { x: 8, y: 14 },
          { x: 23, y: 14 }
        ],
        intersection: { x: 16, y: 14 }
      },
      {
        segments: [
          { x: 5000, y: 5000 },
          { x: 10000, y: 2500 },
          { x: 8191, y: 8191 },
          { x: 8191, y: -8192 }
        ],
        intersection: { x: 8191, y: 3405 }
      }
    ];
    tests.forEach(test => {
      let actual = Pen.intersection(...test.segments);
      assert.deepEqual(actual, test.intersection);
    });
  });
});

describe('Draw', function() {
  it('should output the correct instructions', () => {
    const p = new Pen(encoder, RULES);
    CASES.forEach(c => {
      let output = p.draw(c.instructions);
      assert.equal(output, c.output);
    });
  });
});
