/**
 * Minimal, dependency-free helpers: squarified treemap layout + a diverging
 * color scale. Kept local (no CDN) so the page works offline and isn't at
 * the mercy of a third-party script host being reachable.
 */

// ------------------------------------------------------------- treemap --
// Classic squarify algorithm (Bruls, Huizing, van Wijk 2000).
// `items` must have a numeric `.weight`; returns new objects with x0/y0/x1/y1
// (in the same units as w0/h0) merged onto each original item.
function squarify(items, x0, y0, w0, h0) {
  const sorted = [...items].sort((a, b) => b.weight - a.weight);
  const total = sorted.reduce((sum, d) => sum + d.weight, 0);
  const scale = total > 0 ? (w0 * h0) / total : 0;
  const queue = sorted.map((d) => ({ item: d, area: d.weight * scale }));

  const results = [];
  let x = x0,
    y = y0,
    w = w0,
    h = h0;
  let remaining = queue;

  function worst(row, shortSide, sum) {
    const areas = row.map((r) => r.area);
    const maxA = Math.max(...areas);
    const minA = Math.min(...areas);
    return Math.max(
      (shortSide * shortSide * maxA) / (sum * sum),
      (sum * sum) / (shortSide * shortSide * minA)
    );
  }

  while (remaining.length && w > 0 && h > 0) {
    const shortSide = Math.min(w, h);
    let row = [remaining[0]];
    let rowSum = row[0].area;
    let bestWorst = worst(row, shortSide, rowSum);
    let i = 1;
    while (i < remaining.length) {
      const testSum = rowSum + remaining[i].area;
      const testRow = row.concat(remaining[i]);
      const testWorst = worst(testRow, shortSide, testSum);
      if (testWorst <= bestWorst) {
        row = testRow;
        rowSum = testSum;
        bestWorst = testWorst;
        i++;
      } else {
        break;
      }
    }

    const rowLength = shortSide > 0 ? rowSum / shortSide : 0;
    if (w >= h) {
      let ry = y;
      row.forEach(({ item, area }) => {
        const itemH = rowLength > 0 ? area / rowLength : 0;
        results.push({ item, x0: x, y0: ry, x1: x + rowLength, y1: ry + itemH });
        ry += itemH;
      });
      x += rowLength;
      w -= rowLength;
    } else {
      let rx = x;
      row.forEach(({ item, area }) => {
        const itemW = rowLength > 0 ? area / rowLength : 0;
        results.push({ item, x0: rx, y0: y, x1: rx + itemW, y1: y + rowLength });
        rx += itemW;
      });
      y += rowLength;
      h -= rowLength;
    }
    remaining = remaining.slice(row.length);
  }
  return results;
}

// --------------------------------------------------------------- color --
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolateRgbHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex({ r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) });
}

// Piecewise-linear interpolation across N hex stops; t in [0,1].
function piecewise(stops) {
  const n = stops.length - 1;
  return function (t) {
    const clamped = Math.max(0, Math.min(1, t));
    const seg = Math.min(n - 1, Math.floor(clamped * n));
    const localT = clamped * n - seg;
    return interpolateRgbHex(stops[seg], stops[seg + 1], localT);
  };
}

// A diverging scale: domainMin -> t=0, domainMid -> t=0.5, domainMax -> t=1,
// clamped at the edges, fed through a piecewise color ramp.
function divergingScale(stops, domainMin, domainMid, domainMax) {
  const interp = piecewise(stops);
  return function (value) {
    let t;
    if (value <= domainMin) t = 0;
    else if (value >= domainMax) t = 1;
    else if (value < domainMid) {
      t = 0.5 * ((value - domainMin) / (domainMid - domainMin));
    } else {
      t = 0.5 + 0.5 * ((value - domainMid) / (domainMax - domainMid));
    }
    return interp(t);
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
