/** Versioned, deliberately fabricated detector exercise. Not a hospital measurement/model. */
export const DEMO_DETECTOR={
 id:'ALR-1050',ruleVersion:'capacity-threshold@demo-2',baselineVersion:'synthetic-reference-window@demo-1',
 comparisonVersion:'single-point-vs-seven-demo-days@1',
 observed:96,upper:90,lower:82,reference:[84,87,85,88,86,87,85],
 observedAt:'2026-10-23T23:58:00+03:30',cutoff:'2026-10-23T23:59:59+03:30',
 quality:'synthetic-not-verified',sourceFreshnessPolicyHours:24,
};
export function demoDetectorSummary(at:Date=new Date()){
 const f=DEMO_DETECTOR,baselineMean=f.reference.reduce((a,b)=>a+b,0)/f.reference.length;
 const ageHours=(at.getTime()-Date.parse(f.cutoff))/3600000;
 return {...f,baselineMean:Math.round(baselineMean*100)/100,
  comparison:f.observed>f.upper?'ABOVE_DEMO_UPPER_BOUND':f.observed<f.lower?'BELOW_DEMO_LOWER_BOUND':'WITHIN_DEMO_RANGE',
  freshness:Number.isFinite(ageHours)&&ageHours>=0&&ageHours<=f.sourceFreshnessPolicyHours?'within-demo-window':'stale-or-unverified',ageHours};
}
