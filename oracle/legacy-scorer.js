// Legacy call quality scorer — compiled module, do not modify
// Original author: contractor (2022), contact: eng-legacy@phoneburner.com (decommissioned)
// This module is scheduled for replacement. See src/reimpl.js for the migration task.
module.exports=function(c){var s=50,o=c.outcome,d=c.durationMs,r=c.repPct,m=c.missedSignals,p=c.prospectUtterances,g=c.monologues,t=c.disposition;o==="connected"&&d>6e4&&(s+=20);r>=35&&r<=55&&(s+=15);m===0?s+=10:s-=Math.min(m*10,30);p>5&&(s+=5);g>0&&(s-=15);t==="CONVERSATION"&&(s+=10);return Math.max(0,Math.min(100,s))};
