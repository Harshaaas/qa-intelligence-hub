// Pure statistics functions. No React here, so they're easy to test and reuse.

export const sum = (a) => a.reduce((s, x) => s + x, 0);
export const mean = (a) => sum(a) / a.length;

// Sample variance (divides by n - 1)
export function variance(a) {
  const m = mean(a);
  return sum(a.map((x) => (x - m) ** 2)) / (a.length - 1);
}

// ---------- Distributions (used to turn a test statistic into a p-value) ----------

function logGamma(x) {
  // Lanczos approximation
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betaContinuedFraction(a, b, x) {
  const MAX = 300, EPS = 3e-14, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAX; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

// Regularized incomplete beta function I_x(a, b)
export function incompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  return x < (a + 1) / (a + b + 2)
    ? (bt * betaContinuedFraction(a, b, x)) / a
    : 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

// P(F > f) for an F distribution with (d1, d2) degrees of freedom
export const fTestPValue = (f, d1, d2) => incompleteBeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2);

// Two-tailed p-value for a t statistic
export const tTestPValue = (t, df) => incompleteBeta(df / (df + t * t), df / 2, 0.5);

// ---------- Tests ----------

// One-way ANOVA. groups = [[...values], [...values], ...]
export function oneWayAnova(groups) {
  const g = groups.filter((x) => x.length > 0);
  const k = g.length;
  const all = g.flat();
  const n = all.length;
  if (k < 2 || n - k < 1) return null;

  const grand = mean(all);
  const ssBetween = sum(g.map((x) => x.length * (mean(x) - grand) ** 2));
  const ssWithin = sum(g.map((x) => { const m = mean(x); return sum(x.map((v) => (v - m) ** 2)); }));
  const dfBetween = k - 1;
  const dfWithin = n - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;

  let f, p;
  if (msWithin === 0) { f = msBetween > 0 ? Infinity : 0; p = msBetween > 0 ? 0 : 1; }
  else { f = msBetween / msWithin; p = fTestPValue(f, dfBetween, dfWithin); }

  return { f, p, dfBetween, dfWithin, ssBetween, ssWithin };
}

// Independent two-sample t-test (Student's, equal variances assumed)
export function independentTTest(a, b) {
  const n1 = a.length, n2 = b.length;
  if (n1 < 2 || n2 < 2) return null;
  const df = n1 + n2 - 2;
  const pooledVar = ((n1 - 1) * variance(a) + (n2 - 1) * variance(b)) / df;
  const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
  const diff = mean(a) - mean(b);
  if (se === 0) return { t: diff === 0 ? 0 : Infinity, p: diff === 0 ? 1 : 0, df };
  const t = diff / se;
  return { t, p: tTestPValue(t, df), df };
}

// ---------- Statistical Process Control ----------

// c-chart: for counts of defects per period (e.g. per sprint)
export function cChart(counts) {
  const cl = mean(counts);
  const sigma = Math.sqrt(cl);
  const ucl = cl + 3 * sigma;
  const lcl = Math.max(0, cl - 3 * sigma);

  // Rule 1: a point outside the control limits
  const flags = counts.map((c) => (c > ucl ? "Above UCL" : c < lcl ? "Below LCL" : null));

  // Rule 2: 8 or more points in a row on the same side of the centre line
  let start = 0;
  for (let i = 1; i <= counts.length; i++) {
    const side = (j) => Math.sign(counts[j] - cl);
    if (i === counts.length || side(i) !== side(start) || side(i) === 0) {
      if (i - start >= 8 && side(start) !== 0) {
        for (let j = start; j < i; j++) flags[j] ??= "Run of 8+ on one side";
      }
      start = i;
    }
  }
  return { cl, ucl, lcl, flags };
}
