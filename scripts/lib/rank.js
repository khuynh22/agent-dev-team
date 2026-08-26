'use strict';

// Deterministic lexical ranker used by the routing evals. TF-IDF over stemmed tokens with
// cosine similarity. No dependencies and no model call, so it runs free in CI on every
// push. It approximates how a model reads descriptions well enough to catch the failure
// this is guarding against: two descriptions that a router cannot tell apart.

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while', 'for',
  'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'into', 'over', 'as', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'it', 'its', 'this', 'that', 'these', 'those',
  'use', 'used', 'uses', 'using', 'can', 'could', 'should', 'would', 'will', 'may',
  'do', 'does', 'did', 'not', 'no', 'yes', 'you', 'your', 'i', 'we', 'they', 'my',
  'me', 'us', 'them', 'my', 'our', 'so', 'than', 'too', 'very', 'just', 'also',
]);

// Crude suffix stripping. Enough to collapse review/reviews/reviewing and test/testing,
// which is where near-duplicate descriptions actually hide.
function stem(word) {
  let w = word;
  for (const suffix of ['ization', 'ations', 'ation', 'ingly', 'edly', 'ings', 'ing', 'ies', 'ied', 'ers', 'er', 'es', 'ed', 's']) {
    if (w.length > suffix.length + 3 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  return w;
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .map(stem);
}

function termFrequency(tokens) {
  const tf = new Map();
  for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1);
  return tf;
}

class Index {
  constructor(documents) {
    this.docs = documents.map((doc) => ({ ...doc, tf: termFrequency(tokenize(doc.text)) }));
    this.idf = new Map();
    const n = this.docs.length;
    const seen = new Map();
    for (const doc of this.docs) {
      for (const term of doc.tf.keys()) seen.set(term, (seen.get(term) || 0) + 1);
    }
    for (const [term, count] of seen) this.idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
    for (const doc of this.docs) doc.vector = this.vectorize(doc.tf);
  }

  vectorize(tf) {
    const vec = new Map();
    let norm = 0;
    for (const [term, count] of tf) {
      const weight = (1 + Math.log(count)) * (this.idf.get(term) || Math.log(this.docs.length + 1) + 1);
      vec.set(term, weight);
      norm += weight * weight;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [term, weight] of vec) vec.set(term, weight / norm);
    return vec;
  }

  similarity(a, b) {
    const [small, large] = a.size < b.size ? [a, b] : [b, a];
    let score = 0;
    for (const [term, weight] of small) {
      const other = large.get(term);
      if (other) score += weight * other;
    }
    return score;
  }

  rank(query) {
    const vector = this.vectorize(termFrequency(tokenize(query)));
    return this.docs
      .map((doc) => ({ name: doc.name, score: this.similarity(vector, doc.vector) }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  // Pairs of documents a router would struggle to tell apart.
  collisions(threshold) {
    const out = [];
    for (let i = 0; i < this.docs.length; i++) {
      for (let j = i + 1; j < this.docs.length; j++) {
        const score = this.similarity(this.docs[i].vector, this.docs[j].vector);
        if (score >= threshold) out.push({ a: this.docs[i].name, b: this.docs[j].name, score });
      }
    }
    return out.sort((x, y) => y.score - x.score);
  }
}

module.exports = { Index, tokenize, stem };
