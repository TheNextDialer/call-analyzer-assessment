#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { analyzeCall } = require('./analyzer');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node src/cli.js <transcript.json>');
  process.exit(1);
}

const transcript = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const result = analyzeCall(transcript);

console.log('\n-----------------------------------');
console.log('  CALL ANALYSIS REPORT');
console.log('-----------------------------------\n');

if (result.outcome) {
  console.log(`Outcome: ${result.outcome.outcome} (${Math.round(result.outcome.confidence * 100)}%)`);
}

console.log(`Talk Ratio: Rep ${result.talkRatio.repPct}% / Prospect ${result.talkRatio.prospectPct}% / Silence ${result.talkRatio.silencePct}%`);
console.log(`Rating: ${result.talkRatio.rating}`);

console.log(`Coaching: ${result.coaching.summary.totalMoments} moments`);
result.coaching.moments.forEach(m => {
  console.log(`  [${m.severity}] ${m.message}`);
});

if (result.disposition) console.log(`Disposition: ${result.disposition}`);
if (result.score) console.log(`Score: ${result.score.total}/100`);
if (result.summary) console.log(`Summary: ${result.summary}`);

console.log(`\nMeta: ${result.meta.utteranceCount} utterances, ${Math.round(result.meta.durationMs / 1000)}s, speakers: ${result.meta.speakers.join(', ')}\n`);
