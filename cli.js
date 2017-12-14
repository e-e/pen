const readline = require('readline');
const encoder = require('./src/encoder');
const Pen = require('./src/Pen');
const rules = require('./src/rules');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askEncode() {
  rl.question('enter an integer between -8192..+8191: ', line => {
    line = parseInt(line, 10);
    if (isNaN(line) || !(line >= -8192 && line <= 8191)) {
      console.log('invalid value\n');
      return askEncode();
    }
    console.log(encoder.encode(line).toUpperCase());
    return encodeDecodeOrPen();
  });
}

function askDecode() {
  rl.question('enter a 4 character hex string: ', line => {
    line = line.trim();

    if (line.length !== 4 || !isValidHexStr(line)) {
      console.log('invalid value\n');
      return askDecode();
    }

    console.log(encoder.decode(line.substr(0, 2), line.substr(2)));
    return encodeDecodeOrPen();
  });
}

function askPen() {
  rl.question('enter the instructions string: ', line => {
    line = line.trim();

    if (!line.length) {
      console.log('invalid value\n');
      return askPen();
    }
    const pen = new Pen(encoder, rules);
    console.log(pen.draw(line));
    return encodeDecodeOrPen();
  });
}

function encodeDecodeOrPen() {
  rl.question('encode, decode, or pen? (e, d, p) (x to quit): ', line => {
    line = line.trim().toLowerCase();
    switch (line) {
      case 'x':
        return rl.close();
      case 'e':
        return askEncode();
      case 'd':
        return askDecode();
      case 'p':
        return askPen();
      default:
        console.log('come again?\n');
        break;
    }
    encodeDecodeOrPen();
  });
}

encodeDecodeOrPen();
