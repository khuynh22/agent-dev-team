const RATES = {
  standard: 1.0,
  reduced: 0.5,
};

function rateFor(kind) {
  const rate = RATES[kind];
  if (rate === undefined) throw new Error(`unknown rate kind: ${kind}`);
  return rate;
}

module.exports = { rateFor, RATES };
