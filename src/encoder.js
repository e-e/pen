/**
 * Pads the input with the provided value
 * \param n The input to be padded
 * \param l The target length of the final padded value
 * \param w The value to use as padding
 */
const pad = (n, l = 4, w = '0') => {
  if (!['number', 'string'].includes(typeof n)) {
    throw new Error('Invalid pad target value');
  }
  if (!['number', 'string'].includes(typeof l)) {
    throw new Error('Invalid length argument value');
  }
  if (
    !['number', 'string'].includes(typeof l) ||
    (typeof w === 'string' && !w.length)
  ) {
    throw new Error('Invalid padding value');
  }
  n = n.toString();
  l = typeof l === 'number' ? Math.abs(l) : l.length;
  w = w.toString();
  while (n.length < l) n = w + n;
  return n;
};

/**
 * Checks whether the given string is a valid hex value
 * \param str The hex string in question
 * \return {boolean}
 */
const isValidHexStr = str => {
  str = str.toString().trim();
  return str.replace(/[^0-9a-f]/i, '').length === str.length;
};

/**
 * Encode an integer value as a two-bit hex string
 * \param n The integer between -8192 and +8191 to be encoded
 * \return {string} 4-character hex string
 */
const encode = n => {
  if (n < -8192 || n > 8191) {
    throw new Error(`Value [${n}] not within range [-8192..+8191]`);
  }
  n += 8192;
  // 0x007f -> 1111111
  const lo = n & 0x007f;
  // 0x3f80 -> 11111110000000
  const hi = n & 0x3f80;
  return pad((lo + (hi << 1)).toString(16));
};

/**
 * Decode 4-character hex string to integer between -8192 and +8191
 * \param hi High-byte of the hex value
 * \param lo Low-byte of the hex value
 * \return {integer} Integer value between -8192 and +8191
 */
const decode = (hi, lo) => {
  if (!isValidHexStr(hi)) {
    throw new Error("'hi' argument value is not a valid hex string");
  }
  if (!isValidHexStr(lo)) {
    throw new Error("'lo' argument value is not a valid hex string");
  }
  hi = parseInt(hi, 16);
  lo = parseInt(lo, 16);
  return lo + (hi << 7) - 8192;
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { encode, decode, isValidHexStr, pad };
} else {
  window.encoder = { encode, decode, isValidHexStr, pad };
}
