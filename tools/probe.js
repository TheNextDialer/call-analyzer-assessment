#!/usr/bin/env node

/**
 * Probe tool — call the legacy oracle with custom inputs to discover the algorithm.
 *
 * Usage:
 *   node tools/probe.js '{"outcome":"connected","durationMs":180000,"repPct":45,"missedSignals":0,"monologues":0,"prospectUtterances":8,"disposition":"CONVERSATION"}'
 */

const legacyScore = require('../oracle/legacy-scorer');

const input = process.argv[2];

if (!input) {
  console.log('\nUsage: node tools/probe.js \'<json>\'');
  console.log('\nRequired fields:');
  console.log('  outcome            "connected", "voicemail_left", "no_answer", "busy", etc.');
  console.log('  durationMs         Call duration in milliseconds');
  console.log('  repPct             Rep talk ratio percentage (0-100)');
  console.log('  missedSignals      Number of missed buying signals');
  console.log('  monologues         Number of monologue moments');
  console.log('  prospectUtterances Number of prospect utterances');
  console.log('  disposition        "CONVERSATION", "BRIEF_CONTACT", "VM_DETAILED", etc.');
  console.log('\nExample:');
  console.log('  node tools/probe.js \'{"outcome":"connected","durationMs":180000,"repPct":45,"missedSignals":0,"monologues":0,"prospectUtterances":8,"disposition":"CONVERSATION"}\'');
  console.log('');
  process.exit(1);
}

try {
  const call = JSON.parse(input);
  const score = legacyScore(call);
  console.log(`\n  Legacy score: ${score}\n`);
} catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(1);
}
