const assert = require('assert');
const { encode, decode, isValidHexStr, pad } = require('../src/encoder');

describe('Encoder/Module', function() {
  it("should have an 'encode' method", function() {
    assert.equal(typeof encode, 'function');
  });

  it("should have an 'decode' method", function() {
    assert.equal(typeof decode, 'function');
  });

  it("should have an 'isValidHexStr' method", function() {
    assert.equal(typeof isValidHexStr, 'function');
  });

  it("should have an 'pad' method", function() {
    assert.equal(typeof pad, 'function');
  });
});

describe('Encoder#encode()', function() {
  it('should return the correctly encoded value', function() {
    const cases = [
      { input: 0, expected: '4000' },
      { input: -8192, expected: '0000' },
      { input: 8191, expected: '7f7f' },
      { input: 2048, expected: '5000' },
      { input: -4096, expected: '2000' }
    ];

    cases.forEach(c => {
      const actual = encode(c.input);
      let msg = `expected encode(${c.input})->${c.expected}; got [${actual}]`;
      assert.equal(actual, c.expected.toString(16), msg);

      // type assertions
      msg = `encoding [${c.input}] did not return a string`;
      assert.equal(typeof actual, 'string', msg);

      msg = `encoding [${c.input}] did not return a string of length 4`;
      assert.equal(actual.length, 4, msg);
    });
  });
  it('should throw error for out of range integer input', function() {
    const n = 9000;
    assert.throws(encode.bind(null, n), Error);
  });
});

describe('Encoder#decode()', function() {
  it('should return the correctly decoded value', function() {
    const cases = [
      { input: { hi: '40', lo: '00' }, expected: 0 },
      { input: { hi: '00', lo: '00' }, expected: -8192 },
      { input: { hi: '7f', lo: '7f' }, expected: 8191 },
      { input: { hi: '50', lo: '00' }, expected: 2048 },
      { input: { hi: '20', lo: '00' }, expected: -4096 }
    ];

    cases.forEach(c => {
      const actual = decode(c.input.hi, c.input.lo);
      let msg = `expected decode(${c.input.hi.toString(
        16
      )}, ${c.input.lo.toString(16)}) -> ${c.expected}; got [${actual}]`;

      assert.equal(actual, c.expected, msg);

      // type assertions
      msg = `decoding [${c.input.hi}, ${c.input.lo}] did not return an integer`;
      assert.equal(typeof actual, 'number', msg);

      msg = `encoding [${c.input.hi}, ${c.input
        .lo}] did not return an integer in the range [-8192..+8191]`;
      assert(actual >= -8192 && actual <= 8191);
    });
  });
  it('should throw error for non-hex strings', function() {
    assert.throws(decode.bind(null, 'xx', '81'), Error);
  });
});

describe('Encoder#isValidHexStr()', function() {
  it('should correctly indicate if value is a valid hexadecimal string', function() {
    const cases = [
      { str: '00', expected: true },
      { str: 'x', expected: false },
      { str: '99', expected: true },
      { str: '9!', expected: false },
      { str: '0F0', expected: true }
    ];

    cases.forEach(c => {
      const msg = `[${c.str}] failed assertion`;
      assert.equal(isValidHexStr(c.str), c.expected, msg);
    });
  });
});

describe('Encoder#pad()', function() {
  it('should return correctly padded string', function() {
    const cases = [
      { args: ['00', 5, '0'], expected: '00000' },
      { args: ['!', 0, '-'], expected: '!' },
      { args: ['123', '0000000', 'x'], expected: 'xxxx123' }
    ];

    cases.forEach(c => {
      assert.equal(pad(...c.args), c.expected);
    });
  });
  it('should throw error for invalid pad target value', function() {
    assert.throws(pad.bind(null, [], 5, '0'), Error);
  });
  it('should throw error for invalid length values', function() {
    assert.throws(pad.bind(null, '0', {}, '0'), Error);
  });
  it('should throw error for invalid pad with value', function() {
    assert.throws(pad.bind(null, '0', 10, ''), Error);
  });
});
