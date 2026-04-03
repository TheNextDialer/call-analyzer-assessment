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

console.log('\n═══════════════════════════════════════');
console.log('  CALL ANALYSIS REPORT');
console.log('═══════════════════════════════════════\n');

// AMD
const amdIcon = result.amd.classification === 'voicemail' ? '📫' : '👤';
console.log(`${amdIcon} AMD: ${result.amd.classification.toUpperCase()} (${Math.round(result.amd.confidence * 100)}% confidence)`);
result.amd.signals.forEach(s => {
  console.log(`   ${s.score > 0 ? '🔴' : '🟢'} ${s.heuristic}: ${s.detail}`);
});

// Talk Ratio
console.log(`\n🎙️  Talk Ratio: Rep ${result.talkRatio.repPct}% / Prospect ${result.talkRatio.prospectPct}% / Silence ${result.talkRatio.silencePct}%`);
console.log(`   Rating: ${result.talkRatio.rating}`);
result.talkRatio.flags.forEach(f => {
  console.log(`   ⚠️  ${f.message}`);
});

// Coaching
console.log(`\n🏋️  Coaching: ${result.coaching.summary.totalMoments} moments found`);
result.coaching.moments.forEach(m => {
  const icon = m.severity === 'critical' ? '🔴' : m.severity === 'warning' ? '🟡' : 'ℹ️';
  console.log(`   ${icon} [${m.type}] ${m.message}`);
  console.log(`      💡 ${m.suggestion}`);
});

console.log(`\n── Meta: ${result.meta.utteranceCount} utterances, ${Math.round(result.meta.durationMs / 1000)}s, speakers: ${result.meta.speakers.join(', ')} ──\n`);
