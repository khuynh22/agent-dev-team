// Split an amount in cents across n recipients.
function split(amountCents, recipients) {
  const share = Math.floor(amountCents / recipients);
  return Array.from({ length: recipients }, () => share);
}

module.exports = { split };
