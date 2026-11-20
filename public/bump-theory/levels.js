/* Bump Theory: 1 Ball -> 10,000. Levels.
   World is 720 x 1280 (portrait). Angles in degrees, 0 = horizontal.
   fixed = part of the level, inv = what the player gets, zones = where things may go
   (gates on a "rail" slide left/right only), sol = a known good layout (Hint button,
   and the level checker proves every level is beatable), stars = [1, 2, 3 star]. */
(function (root) {
  'use strict';
  function seg(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return { t: 'wall', x: (x1 + x2) / 2, y: (y1 + y2) / 2, a: Math.round(Math.atan2(dy, dx) * 1800 / Math.PI) / 10, len: Math.round(Math.sqrt(dx * dx + dy * dy)) };
  }
  function funnel(cx, y, gap, span, drop) {
    return [seg(cx - gap / 2 - span, y - drop, cx - gap / 2, y), seg(cx + gap / 2 + span, y - drop, cx + gap / 2, y)];
  }
  function g(n, x, y, a, w) { var o = { t: 'gate', n: n, x: x, y: y }; if (a) o.a = a; if (w) o.w = w; return o; }
  function wl(x, y, a) { return { t: 'wall', x: x, y: y, a: a || 0 }; }
  function lava(x, y, w, h) { return { t: 'lava', x: x, y: y, w: w, h: h }; }
  function peg(x, y) { return { t: 'peg', x: x, y: y }; }
  function bump(x, y) { return { t: 'bump', x: x, y: y }; }
  function rail(y, x0, x1) { return { x0: x0 || 70, y0: y, x1: x1 || 650, y1: y, t: 'gate' }; }
  function box(x0, y0, x1, y1, t) { return { x0: x0, y0: y0, x1: x1, y1: y1, t: t }; }
  function pegRows(y0, rows, dx, dy, cx) {
    var out = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c <= r + 1; c++) out.push(peg(cx - (r + 1) * dx / 2 + c * dx, y0 + r * dy));
    return out;
  }
  /* an octagon of mirror walls; skip = side numbers left open (1 = bottom, 5 = top) */
  function ring(cx, cy, r, skip) {
    var out = [];
    for (var k = 0; k < 8; k++) {
      if (skip.indexOf(k) >= 0) continue;
      var a0 = (22.5 + 45 * k) * Math.PI / 180, a1 = (22.5 + 45 * (k + 1)) * Math.PI / 180;
      out.push(seg(Math.round(cx + r * Math.cos(a0)), Math.round(cy + r * Math.sin(a0)), Math.round(cx + r * Math.cos(a1)), Math.round(cy + r * Math.sin(a1))));
    }
    return out;
  }
  var C = 360, TOP = 200, WB = ['wall', 'bump'];

  var levels = [
    { name: 'First gate', tip: 'Drag the x2 gate under the ball, then press DROP.',
      drop: { x: C, y: TOP }, fixed: [], inv: [{ t: 'gate', n: 2, c: 1 }],
      sol: [g(2, C, 520)], stars: [2, 2, 2] },
    { name: 'Stack', tip: 'Every ball that goes through a gate splits. Stack them.',
      drop: { x: C, y: TOP }, fixed: [], inv: [{ t: 'gate', n: 3, c: 1 }, { t: 'gate', n: 2, c: 1 }],
      sol: [g(3, C, 450), g(2, C, 720)], stars: [3, 4, 6] },
    { name: 'High five', tip: 'Gates on a rail slide left and right. Tap one to turn it.',
      drop: { x: C, y: TOP }, fixed: [], zones: [rail(330), rail(560)], inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 2, c: 1 }],
      sol: [g(2, C, 330), g(5, C, 560)], stars: [5, 7, 10] },
    { name: 'Ramp', tip: 'Watch where the ball rolls.',
      drop: { x: 130, y: TOP }, fixed: [seg(60, 330, 430, 470)], inv: [{ t: 'gate', n: 3, c: 2 }],
      sol: [g(3, 560, 560, 90), g(3, 600, 820)], stars: [4, 6, 9] },
    { name: 'Tap to turn', tip: 'Tap a gate to turn it upright. Lava eats balls.',
      drop: { x: 110, y: TOP }, fixed: [seg(50, 290, 330, 420), lava(270, 1235, 540, 50)],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 1 }],
      sol: [g(5, 470, 520, 90), wl(560, 900, 60)], stars: [3, 4, 5] },
    { name: 'Funnel', tip: 'Walls squeeze the spray back into the next gate.',
      drop: { x: C, y: TOP }, fixed: [], zones: [rail(300), rail(680), rail(1000), box(40, 380, 680, 620, 'wall'), box(40, 740, 680, 940, 'wall')],
      inv: [{ t: 'gate', n: 3, c: 3 }, { t: 'wall', c: 2 }],
      sol: [g(3, C, 300), wl(285, 560, 35), wl(435, 560, -35), g(3, C, 680), g(3, C, 1000)], stars: [9, 15, 22] },
    { name: 'Plinko', tip: 'Pegs scatter the balls. Catch them below.',
      drop: { x: C, y: TOP }, fixed: pegRows(400, 4, 90, 70, C), zones: [rail(300), rail(760), rail(900), rail(1040)],
      inv: [{ t: 'gate', n: 3, c: 1 }, { t: 'gate', n: 2, c: 3 }],
      sol: [g(3, C, 300), g(2, C, 760), g(2, C, 900), g(2, C, 1040)], stars: [5, 8, 11] },
    { name: 'Bumper', tip: 'Bumpers kick balls away. Keep them off the lava.',
      drop: { x: C, y: TOP }, fixed: [lava(C, 1225, 380, 70)], zones: [rail(380), rail(600), box(40, 700, 680, 1120, WB)],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 3, c: 1 }, { t: 'bump', c: 1 }],
      sol: [g(3, C, 380), g(5, C, 600), bump(C, 900)], stars: [8, 12, 15] },
    { name: 'Lava floor', tip: 'Keep the stream away from the lava.',
      drop: { x: C, y: TOP }, fixed: [lava(C, 1225, 440, 70)], zones: [rail(360), rail(620), box(40, 690, 680, 1130, 'wall')],
      inv: [{ t: 'gate', n: 5, c: 2 }, { t: 'wall', c: 3 }],
      sol: [g(5, C, 360), g(5, C, 620), wl(250, 900, 30), wl(470, 900, -30), wl(C, 820, 0)], stars: [10, 15, 22] },
    { name: 'Times ten', tip: 'x10 turns 1 ball into 10.',
      drop: { x: C, y: TOP }, fixed: [], zones: [rail(320), rail(760), box(40, 390, 680, 700, 'wall')],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 3, c: 1 }, { t: 'wall', c: 2 }],
      sol: [g(3, C, 320), wl(280, 600, 35), wl(440, 600, -35), g(10, C, 760)], stars: [15, 22, 30] },
    { name: 'Mover', tip: 'That gate moves. Time your layout.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'gate', n: 5, x: C, y: 700, w: 140, move: { ax: 210, f: 0.35 } }],
      zones: [rail(320), rail(480), box(40, 780, 680, 1180, 'wall')],
      inv: [{ t: 'gate', n: 3, c: 1 }, { t: 'gate', n: 2, c: 1 }, { t: 'wall', c: 2 }],
      sol: [g(2, C, 320), g(3, C, 480), wl(250, 900, 30), wl(470, 900, -30)], stars: [10, 18, 25] },
    { name: 'Funnel run', tip: 'Fixed funnels. Fill them with gates.',
      drop: { x: C, y: TOP }, fixed: funnel(C, 560, 90, 170, 110).concat(funnel(C, 900, 90, 170, 110)),
      zones: [rail(300), rail(640), rail(980)],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 4, c: 1 }, { t: 'gate', n: 3, c: 1 }],
      sol: [g(3, C, 300), g(4, C, 640), g(5, C, 980)], stars: [25, 40, 55] },
    { name: 'One thousand', tip: 'Two x10 gates. Aim for 1,000.',
      drop: { x: C, y: TOP }, fixed: [], zones: [rail(290), rail(430), rail(720), rail(1010), box(40, 500, 680, 670, 'wall'), box(40, 790, 680, 960, 'wall')],
      inv: [{ t: 'gate', n: 10, c: 2 }, { t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 2, c: 1 }, { t: 'wall', c: 4 }],
      sol: [g(2, C, 290), g(5, C, 430), wl(270, 620, 35), wl(450, 620, -35), g(10, C, 720), wl(270, 910, 35), wl(450, 910, -35), g(10, C, 1010)],
      stars: [150, 300, 450] },
    { name: 'Zigzag', tip: 'Follow the zigzag.',
      drop: { x: 120, y: TOP }, fixed: [seg(40, 300, 420, 430), seg(680, 560, 300, 690), seg(40, 820, 420, 950)],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 4, c: 1 }, { t: 'gate', n: 3, c: 1 }],
      sol: [g(3, 500, 470, 60), g(4, 220, 740, -60), g(5, 520, 1010, 60)], stars: [20, 35, 50] },
    { name: 'Spinner', tip: 'A spinning wall over lava. Bump the balls to safety.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'wall', x: C, y: 760, a: 0, len: 260, spin: 90 }, lava(C, 1225, 300, 70)],
      zones: [rail(320), rail(1000), box(40, 1060, 680, 1180, 'bump')],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 5, c: 1 }, { t: 'bump', c: 2 }],
      sol: [g(5, C, 320), g(10, C, 1000), bump(250, 1120), bump(470, 1120)], stars: [30, 60, 90] },
    { name: 'Needle', tip: 'Tiny gates. Funnel everything through them.',
      drop: { x: C, y: TOP }, fixed: [g(10, C, 620, 0, 60), g(10, C, 1000, 0, 60)], zones: [rail(300), box(40, 360, 680, 1200, 'wall')],
      inv: [{ t: 'gate', n: 3, c: 1 }, { t: 'wall', c: 4 }],
      sol: [g(3, C, 300), wl(285, 520, 40), wl(435, 520, -40), wl(285, 900, 40), wl(435, 900, -40)], stars: [60, 150, 250] },
    { name: 'Hot lanes', tip: 'Thread the stream between the lava.',
      drop: { x: C, y: TOP }, fixed: [lava(150, 760, 300, 40), lava(570, 760, 300, 40)],
      zones: [rail(320), rail(900), box(40, 380, 680, 720, WB), box(40, 800, 680, 1180, WB)],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 4 }, { t: 'bump', c: 1 }],
      sol: [g(5, C, 320), wl(280, 520, 40), wl(440, 520, -40), g(10, C, 900), bump(C, 1080)], stars: [40, 80, 120] },
    { name: 'Bounce house', tip: 'Only the edges are safe. Bump them out there.',
      drop: { x: C, y: TOP }, fixed: [lava(C, 1225, 470, 70)], zones: [rail(320), rail(500), rail(680), box(40, 760, 680, 1150, 'bump')],
      inv: [{ t: 'gate', n: 5, c: 2 }, { t: 'gate', n: 4, c: 1 }, { t: 'bump', c: 3 }],
      sol: [g(4, C, 320), g(5, C, 500), g(5, C, 680), bump(C, 950), bump(220, 1060), bump(500, 1060)], stars: [60, 120, 180] },
    { name: 'Ten thousand', tip: 'The big one. 1 ball, 10,000 balls.',
      drop: { x: C, y: TOP }, fixed: [],
      zones: [rail(280), rail(400), rail(640), rail(880), rail(1120), box(40, 460, 680, 600, 'wall'), box(40, 700, 680, 840, 'wall'), box(40, 940, 680, 1080, 'wall')],
      inv: [{ t: 'gate', n: 10, c: 3 }, { t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 2, c: 1 }, { t: 'wall', c: 6 }],
      sol: [g(2, C, 280), g(5, C, 400), wl(270, 540, 35), wl(450, 540, -35), g(10, C, 640), wl(270, 780, 35), wl(450, 780, -35), g(10, C, 880), wl(270, 1020, 35), wl(450, 1020, -35), g(10, C, 1120)],
      stars: [1000, 3000, 6000] },
    { name: 'Moving pair', tip: 'Two moving gates, out of step.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'gate', n: 10, x: C, y: 620, w: 150, move: { ax: 200, f: 0.3 } }, { t: 'gate', n: 10, x: C, y: 980, w: 150, move: { ax: 200, f: 0.3, ph: 3.14 } }],
      zones: [rail(360), box(40, 420, 680, 560, 'wall'), box(40, 690, 680, 910, 'wall'), box(40, 1050, 680, 1200, 'wall')],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 4 }],
      sol: [g(5, C, 360), wl(250, 820, 30), wl(470, 820, -30), wl(250, 1150, 30)], stars: [150, 300, 500] },
    { name: 'Lava maze', tip: 'Lava everywhere. Plan the route.',
      drop: { x: 120, y: TOP }, fixed: [seg(40, 330, 300, 400), lava(500, 560, 440, 36), lava(540, 1225, 360, 70)],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 3, c: 1 }, { t: 'wall', c: 3 }, { t: 'bump', c: 1 }],
      sol: [wl(340, 480, 160), g(3, 250, 640), g(5, 240, 800), g(10, 230, 1000), wl(380, 1100, 120)], stars: [50, 120, 200] },
    { name: 'Chaos', tip: 'Pegs, bumpers and a spinner. Good luck.',
      drop: { x: C, y: TOP }, fixed: pegRows(350, 3, 110, 70, C).concat([{ t: 'wall', x: C, y: 820, a: 0, len: 200, spin: -120 }, bump(140, 640), bump(580, 640)]),
      zones: [rail(270), rail(1120), box(40, 930, 680, 1070, 'wall'), rail(680, 260, 460)],
      inv: [{ t: 'gate', n: 10, c: 2 }, { t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 4 }],
      sol: [g(5, C, 270), g(10, C, 680), wl(250, 1000, 30), wl(470, 1000, -30), g(10, C, 1120)], stars: [300, 800, 1500] },
    { name: 'Impossible', tip: 'Four x10 gates. 50,000 is nearly impossible.',
      drop: { x: C, y: TOP }, fixed: [lava(90, 1225, 180, 70), lava(630, 1225, 180, 70)],
      zones: [rail(280), rail(500), rail(720), rail(940), rail(1140), box(40, 340, 680, 470, 'wall'), box(40, 560, 680, 690, 'wall'), box(40, 780, 680, 910, 'wall'), box(40, 1000, 680, 1110, 'wall')],
      inv: [{ t: 'gate', n: 10, c: 4 }, { t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 8 }],
      sol: [g(5, C, 280), wl(270, 420, 35), wl(450, 420, -35), g(10, C, 500), wl(270, 640, 35), wl(450, 640, -35), g(10, C, 720), wl(270, 860, 35), wl(450, 860, -35), g(10, C, 940), wl(270, 1060, 35), wl(450, 1060, -35), g(10, C, 1140)],
      stars: [5000, 20000, 40000] },
    { name: 'Tiny movers', tip: 'Tiny moving gates over lava.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'gate', n: 10, x: C, y: 560, w: 90, move: { ax: 160, f: 0.45 } }, { t: 'gate', n: 10, x: C, y: 880, w: 90, move: { ax: 160, f: 0.45, ph: 1.6 } }, lava(150, 1100, 300, 36), lava(570, 1100, 300, 36)],
      zones: [rail(320), rail(1040), box(40, 380, 680, 500, WB), box(40, 620, 680, 820, WB), box(40, 940, 680, 1060, WB), box(40, 1150, 680, 1200, WB)],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 6 }, { t: 'bump', c: 1 }],
      sol: [g(5, C, 320), wl(280, 760, 30), wl(440, 760, -30), g(10, C, 1040)], stars: [500, 2000, 6000] },

    /* ---- 15 Nov 2026: 12 new levels themed on Bump Theory's best Shorts (light in a mirror, closing walls, growing wall, shrinking gate, multiplying) ---- */
    { name: 'Mirror', tip: 'Walls bounce balls the way mirrors bounce light.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'wall', x: 330, y: 420, a: 35, len: 220 }],
      inv: [{ t: 'gate', n: 3, c: 1 }, { t: 'gate', n: 2, c: 1 }, { t: 'wall', c: 1 }],
      sol: [g(3, 560, 640, 0), g(2, 560, 860, 0), wl(600, 1060, -30)], stars: [3, 5, 6] },
    /* 20 Nov 2026: level 5 lost 27% of the players who reached it (the next worst early level: 17%), with 7 pieces to drag.
       Two x2 gates now come built in, so it is 3 gates (+2 optional walls): 1 gate = 1 star, the plain stack = 2 stars. */
    { name: 'Doubling', tip: 'Every x2 doubles the stream. Stack 3 more under the ball.',
      drop: { x: C, y: TOP }, fixed: [g(2, C, 330), g(2, C, 670)], zones: [rail(500), rail(840), rail(1010), box(40, 560, 680, 620, 'wall'), box(40, 900, 680, 960, 'wall')],
      inv: [{ t: 'gate', n: 2, c: 3 }, { t: 'wall', c: 2 }],
      sol: [g(2, C, 330), g(2, C, 500), g(2, C, 670), g(2, C, 840), g(2, C, 1010)], stars: [8, 16, 24] },
    { name: 'Closing walls', tip: 'The walls close and open. Catch the stream below them.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'wall', x: 150, y: 600, a: 0, len: 260, move: { ax: 90, f: 0.4 } }, { t: 'wall', x: 570, y: 600, a: 0, len: 260, move: { ax: 90, f: 0.4, ph: 3.14159 } }],
      zones: [rail(330), rail(780), rail(1000), box(40, 860, 680, 1180, 'wall')],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 3, c: 1 }, { t: 'gate', n: 2, c: 1 }, { t: 'wall', c: 2 }],
      sol: [g(2, C, 330), g(5, C, 780), g(3, C, 1000)], stars: [10, 20, 30] },
    { name: 'Shrinking gate', tip: 'The x10 gate shrinks and grows. Squeeze the stream into it.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'gate', n: 10, x: C, y: 780, w: 160, grow: { k: 0.6, f: 0.45 } }],
      zones: [rail(330), box(40, 420, 680, 700, 'wall'), rail(1020)],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 2, c: 1 }, { t: 'wall', c: 2 }],
      sol: [g(5, C, 330), wl(280, 600, 35), wl(440, 600, -35), g(2, C, 1020)], stars: [20, 40, 60] },
    { name: 'Kaleidoscope', tip: 'Four mirrors. Find where the light goes.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'wall', x: 230, y: 520, a: 45, len: 170 }, { t: 'wall', x: 490, y: 520, a: -45, len: 170 }, { t: 'wall', x: 230, y: 900, a: -45, len: 170 }, { t: 'wall', x: 490, y: 900, a: 45, len: 170 }],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 2, c: 2 }],
      sol: [g(2, C, 330), g(5, C, 640), g(10, C, 780), g(2, C, 1060)], stars: [20, 40, 60] },
    { name: 'Growing wall', tip: 'A wall grows across the middle. Steer around it, away from the lava.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'wall', x: C, y: 700, a: 0, len: 220, grow: { k: 0.75, f: 0.3 } }, lava(C, 1225, 420, 70)],
      zones: [rail(330), rail(560), box(40, 790, 680, 1150, WB)],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 4, c: 1 }, { t: 'wall', c: 2 }, { t: 'bump', c: 1 }],
      sol: [g(4, C, 330), g(5, C, 560), wl(250, 950, 30), wl(470, 950, -30)], stars: [8, 15, 22] },
    { name: 'Light zigzag', tip: 'Bounce down between the mirrors like a beam of light.',
      drop: { x: 120, y: TOP }, fixed: [{ t: 'wall', x: 150, y: 340, a: 25, len: 220 }, { t: 'wall', x: 570, y: 560, a: -25, len: 220 }, { t: 'wall', x: 150, y: 780, a: 25, len: 220 }, { t: 'wall', x: 570, y: 1000, a: -25, len: 220 }],
      inv: [{ t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 4, c: 1 }, { t: 'gate', n: 3, c: 1 }],
      sol: [g(3, 420, 440, 60), g(4, 300, 670, -60), g(5, 420, 890, 60)], stars: [15, 30, 45] },
    { name: 'Two to the tenth', tip: 'Eight x2 gates. Keep the whole stream together.',
      drop: { x: C, y: TOP }, fixed: [], zones: [rail(300), rail(410), rail(520), rail(630), rail(740), rail(850), rail(960), rail(1070), box(40, 680, 680, 700, 'wall'), box(40, 1000, 680, 1020, 'wall'), box(40, 1150, 680, 1190, 'wall')],
      inv: [{ t: 'gate', n: 2, c: 8 }, { t: 'wall', c: 4 }],
      sol: [g(2, C, 300), g(2, C, 410), g(2, C, 520), g(2, C, 630), g(2, C, 740), g(2, C, 850), g(2, C, 960), g(2, C, 1070)], stars: [40, 80, 120] },
    { name: 'Mirror box', tip: 'Light in a mirror: balls bounce around inside the box.',
      drop: { x: C, y: TOP }, fixed: ring(C, 760, 260, [1, 5]), zones: [rail(320), box(170, 600, 550, 920)],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 3, c: 1 }],
      sol: [g(3, C, 320), g(5, C, 680), g(10, C, 860)], stars: [30, 60, 90] },
    { name: 'Crusher', tip: 'Two pairs of closing walls over lava. Time it.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'wall', x: 140, y: 520, a: 0, len: 240, move: { ax: 100, f: 0.35 } }, { t: 'wall', x: 580, y: 520, a: 0, len: 240, move: { ax: 100, f: 0.35, ph: 3.14159 } },
        { t: 'wall', x: 140, y: 880, a: 0, len: 240, move: { ax: 100, f: 0.35, ph: 1.6 } }, { t: 'wall', x: 580, y: 880, a: 0, len: 240, move: { ax: 100, f: 0.35, ph: 4.74 } }, lava(130, 1225, 220, 70), lava(590, 1225, 220, 70)],
      zones: [rail(330), rail(700), rail(1060), box(40, 960, 680, 1010, 'wall')],
      inv: [{ t: 'gate', n: 10, c: 1 }, { t: 'gate', n: 5, c: 1 }, { t: 'gate', n: 3, c: 1 }, { t: 'wall', c: 2 }],
      sol: [g(3, C, 330), g(5, C, 700), g(10, C, 1060)], stars: [40, 80, 120] },
    { name: 'Shrinking gap', tip: 'The gap shrinks and opens. The x10 gates wait below.',
      drop: { x: C, y: TOP }, fixed: [{ t: 'wall', x: 170, y: 640, a: 0, len: 260, grow: { k: 0.35, f: 0.4 } }, { t: 'wall', x: 550, y: 640, a: 0, len: 260, grow: { k: 0.35, f: 0.4 } },
        { t: 'wall', x: 170, y: 980, a: 0, len: 260, grow: { k: 0.35, f: 0.4, ph: 3.14159 } }, { t: 'wall', x: 550, y: 980, a: 0, len: 260, grow: { k: 0.35, f: 0.4, ph: 3.14159 } }, lava(C, 1225, 300, 70)],
      zones: [rail(330), rail(470), rail(800), box(40, 1060, 680, 1180, WB)],
      inv: [{ t: 'gate', n: 10, c: 2 }, { t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 2 }, { t: 'bump', c: 1 }],
      sol: [g(5, C, 330), g(10, C, 470), g(10, C, 800)], stars: [150, 300, 450] },
    { name: 'One hundred thousand', tip: 'The finale. Two x20 gates. Can you reach 100,000?',
      drop: { x: C, y: TOP }, fixed: [lava(90, 1225, 180, 70), lava(630, 1225, 180, 70)],
      zones: [rail(280), rail(500), rail(720), rail(940), rail(1140), box(40, 340, 680, 470, 'wall'), box(40, 560, 680, 690, 'wall'), box(40, 780, 680, 910, 'wall'), box(40, 1000, 680, 1110, 'wall')],
      inv: [{ t: 'gate', n: 20, c: 2 }, { t: 'gate', n: 10, c: 2 }, { t: 'gate', n: 5, c: 1 }, { t: 'wall', c: 8 }],
      sol: [g(5, C, 280), wl(270, 420, 35), wl(450, 420, -35), g(10, C, 500), wl(270, 640, 35), wl(450, 640, -35), g(10, C, 720), wl(270, 860, 35), wl(450, 860, -35), g(20, C, 940), wl(270, 1060, 35), wl(450, 1060, -35), g(20, C, 1140)],
      stars: [20000, 60000, 100000] }
  ];

  /* CALIBRATED (generated by the level checker: best layout found, stars = 35/65/90 % of it;
     15 Nov 2026: new levels 24-35 at 30/60/88 %, old hard spots 8, 14, 15, 19, 20, 21, 23 eased to 22/50/80 %;
     15 Nov later: readable on-screen hints for Ramp (3) and Tap to turn (4), Plinko (6) and Doubling (25) first stars lowered) */
  var CAL = {"1":{"sol":[{"t":"gate","n":3,"x":350,"y":1073,"a":15},{"t":"gate","n":2,"x":287,"y":995,"a":0}],"stars":[3,5,6],"best":6},"2":{"sol":[{"t":"gate","n":2,"x":369,"y":330,"a":105},{"t":"gate","n":5,"x":331,"y":560,"a":0}],"stars":[5,8,10],"best":10},"3":{"sol":[{"t":"gate","n":3,"x":540,"y":440,"a":-60},{"t":"gate","n":3,"x":600,"y":560,"a":-30}],"stars":[5,7,9],"best":9},"4":{"sol":[{"t":"gate","n":5,"x":360,"y":440,"a":90},{"t":"wall","x":510,"y":1100,"a":60}],"stars":[3,4,5],"best":5},"5":{"sol":[{"t":"gate","n":3,"x":290,"y":300,"a":-30},{"t":"wall","x":272,"y":460,"a":75},{"t":"wall","x":572,"y":845,"a":0},{"t":"gate","n":3,"x":404,"y":680,"a":-30},{"t":"gate","n":3,"x":431,"y":1000,"a":15}],"stars":[8,16,22],"best":25},"6":{"sol":[{"t":"gate","n":3,"x":374,"y":300,"a":30},{"t":"gate","n":2,"x":265,"y":760,"a":0},{"t":"gate","n":2,"x":271,"y":900,"a":-45},{"t":"gate","n":2,"x":339,"y":1040,"a":-15}],"stars":[4,9,14],"best":16},"7":{"sol":[{"t":"gate","n":3,"x":319,"y":380,"a":-30},{"t":"gate","n":5,"x":401,"y":600,"a":45},{"t":"bump","x":266,"y":722}],"stars":[5,7,9],"best":9},"8":{"sol":[{"t":"gate","n":5,"x":324,"y":360,"a":15},{"t":"gate","n":5,"x":305,"y":620,"a":-15},{"t":"wall","x":293,"y":884,"a":15},{"t":"wall","x":407,"y":870,"a":-75},{"t":"wall","x":489,"y":729,"a":-15}],"stars":[6,13,20],"best":25},"9":{"sol":[{"t":"gate","n":3,"x":299,"y":320,"a":-195},{"t":"wall","x":41,"y":676,"a":30},{"t":"wall","x":401,"y":390,"a":-45},{"t":"gate","n":10,"x":313,"y":760,"a":30}],"stars":[10,19,27],"best":30},"10":{"sol":[{"t":"gate","n":2,"x":307,"y":320,"a":-30},{"t":"gate","n":3,"x":360,"y":480,"a":-30},{"t":"wall","x":287,"y":780,"a":0},{"t":"wall","x":486,"y":1180,"a":180}],"stars":[10,19,27],"best":30},"11":{"sol":[{"t":"gate","n":3,"x":348,"y":300,"a":15},{"t":"gate","n":4,"x":339,"y":640,"a":-15},{"t":"gate","n":5,"x":347,"y":980,"a":-30}],"stars":[18,33,46],"best":52},"12":{"sol":[{"t":"gate","n":2,"x":392,"y":290,"a":-30},{"t":"gate","n":5,"x":370,"y":430,"a":-30},{"t":"wall","x":285,"y":609,"a":35},{"t":"wall","x":420,"y":605,"a":-60},{"t":"gate","n":10,"x":290,"y":720,"a":0},{"t":"wall","x":163,"y":942,"a":30},{"t":"wall","x":309,"y":790,"a":-30},{"t":"gate","n":10,"x":321,"y":1010,"a":-45}],"stars":[340,640,890],"best":991},"13":{"sol":[{"t":"gate","n":3,"x":511,"y":445,"a":60},{"t":"gate","n":4,"x":240,"y":733,"a":0},{"t":"gate","n":5,"x":696,"y":1187,"a":165}],"stars":[15,29,40],"best":45},"14":{"sol":[{"t":"gate","n":5,"x":324,"y":320,"a":-30},{"t":"gate","n":10,"x":137,"y":1000,"a":45},{"t":"bump","x":234,"y":1129},{"t":"bump","x":574,"y":1169}],"stars":[5,11,18],"best":22},"15":{"sol":[{"t":"gate","n":3,"x":312,"y":300,"a":-30},{"t":"wall","x":248,"y":412,"a":15},{"t":"wall","x":434,"y":418,"a":-75},{"t":"wall","x":243,"y":883,"a":45},{"t":"wall","x":428,"y":870,"a":-75}],"stars":[52,120,190],"best":237},"16":{"sol":[{"t":"gate","n":5,"x":360,"y":320,"a":-30},{"t":"wall","x":297,"y":490,"a":45},{"t":"wall","x":441,"y":515,"a":-40},{"t":"gate","n":10,"x":344,"y":900,"a":-45},{"t":"bump","x":73,"y":864}],"stars":[14,26,36],"best":41},"17":{"sol":[{"t":"gate","n":4,"x":378,"y":320,"a":-15},{"t":"gate","n":5,"x":364,"y":500,"a":0},{"t":"gate","n":5,"x":323,"y":680,"a":0},{"t":"bump","x":333,"y":910},{"t":"bump","x":251,"y":1084},{"t":"bump","x":551,"y":1056}],"stars":[10,20,27],"best":31},"18":{"sol":[{"t":"gate","n":2,"x":371,"y":280,"a":15},{"t":"gate","n":5,"x":328,"y":400,"a":0},{"t":"wall","x":258,"y":559,"a":35},{"t":"wall","x":504,"y":552,"a":-35},{"t":"gate","n":10,"x":380,"y":640,"a":0},{"t":"wall","x":291,"y":771,"a":60},{"t":"wall","x":439,"y":791,"a":-45},{"t":"gate","n":10,"x":297,"y":880,"a":0},{"t":"wall","x":276,"y":974,"a":45},{"t":"wall","x":412,"y":992,"a":-90},{"t":"gate","n":10,"x":375,"y":1120,"a":15}],"stars":[3300,6300,8700],"best":9694},"19":{"sol":[{"t":"gate","n":5,"x":338,"y":360,"a":-60},{"t":"wall","x":437,"y":690,"a":15},{"t":"wall","x":121,"y":1099,"a":-135},{"t":"wall","x":426,"y":1050,"a":30}],"stars":[31,70,110],"best":140},"20":{"sol":[{"t":"wall","x":373,"y":377,"a":135},{"t":"gate","n":3,"x":192,"y":664,"a":30},{"t":"gate","n":5,"x":204,"y":747,"a":15},{"t":"gate","n":10,"x":192,"y":817,"a":15},{"t":"wall","x":238,"y":929,"a":135}],"stars":[29,66,110],"best":131},"21":{"sol":[{"t":"gate","n":5,"x":418,"y":270,"a":0},{"t":"gate","n":10,"x":450,"y":680,"a":30},{"t":"wall","x":219,"y":1042,"a":60},{"t":"wall","x":607,"y":944,"a":-15},{"t":"gate","n":10,"x":421,"y":1120,"a":0}],"stars":[62,140,230],"best":284},"22":{"sol":[{"t":"gate","n":5,"x":368,"y":280,"a":-45},{"t":"wall","x":321,"y":432,"a":45},{"t":"wall","x":429,"y":380,"a":-45},{"t":"gate","n":10,"x":466,"y":500,"a":-45},{"t":"wall","x":270,"y":640,"a":35},{"t":"wall","x":444,"y":610,"a":-35},{"t":"gate","n":10,"x":345,"y":720,"a":0},{"t":"wall","x":283,"y":862,"a":35},{"t":"wall","x":450,"y":860,"a":-35},{"t":"gate","n":10,"x":335,"y":940,"a":0},{"t":"wall","x":270,"y":1060,"a":35},{"t":"wall","x":450,"y":1060,"a":-35},{"t":"gate","n":10,"x":346,"y":1140,"a":15}],"stars":[17000,31000,43000],"best":48629},"23":{"sol":[{"t":"gate","n":5,"x":294,"y":320,"a":30},{"t":"wall","x":393,"y":620,"a":15},{"t":"wall","x":680,"y":683,"a":-60},{"t":"gate","n":10,"x":377,"y":1040,"a":15}],"stars":[160,360,580],"best":720},"24":{"sol":[{"t":"gate","n":3,"x":596,"y":546,"a":60},{"t":"gate","n":2,"x":640,"y":985,"a":60},{"t":"wall","x":577,"y":780,"a":75}],"stars":[2,4,5],"best":6},"25":{"sol":[{"t":"gate","n":2,"x":390,"y":500,"a":45},{"t":"gate","n":2,"x":400,"y":840,"a":45},{"t":"gate","n":2,"x":410,"y":1010,"a":-30},{"t":"wall","x":210,"y":590,"a":-30}],"stars":[6,12,17],"best":18},"26":{"sol":[{"t":"gate","n":5,"x":589,"y":1000,"a":30},{"t":"gate","n":3,"x":427,"y":1000,"a":-75},{"t":"wall","x":363,"y":1106,"a":15},{"t":"gate","n":2,"x":629,"y":780,"a":-90}],"stars":[6,13,18],"best":21},"27":{"sol":[{"t":"gate","n":5,"x":413,"y":330,"a":-45},{"t":"gate","n":2,"x":403,"y":1020,"a":0},{"t":"wall","x":236,"y":634,"a":15},{"t":"wall","x":557,"y":632,"a":-30}],"stars":[25,50,73],"best":83},"28":{"sol":[{"t":"gate","n":5,"x":283,"y":756,"a":15},{"t":"gate","n":10,"x":404,"y":812},{"t":"gate","n":2,"x":363,"y":892},{"t":"gate","n":2,"x":360,"y":927,"a":0}],"stars":[54,110,160],"best":179},"29":{"sol":[{"t":"gate","n":4,"x":323,"y":330,"a":-15},{"t":"gate","n":5,"x":379,"y":560,"a":15},{"t":"wall","x":251,"y":1034,"a":30},{"t":"wall","x":495,"y":906,"a":0},{"t":"bump","x":478,"y":1150}],"stars":[6,12,18],"best":20},"30":{"sol":[{"t":"gate","n":3,"x":280,"y":896,"a":-75},{"t":"gate","n":4,"x":122,"y":1219,"a":-30},{"t":"gate","n":5,"x":89,"y":1150,"a":-45}],"stars":[18,36,53],"best":60},"31":{"sol":[{"t":"gate","n":2,"x":362,"y":300,"a":-15},{"t":"gate","n":2,"x":392,"y":410,"a":-30},{"t":"gate","n":2,"x":347,"y":520,"a":15},{"t":"gate","n":2,"x":342,"y":630,"a":-30},{"t":"gate","n":2,"x":318,"y":740,"a":30},{"t":"gate","n":2,"x":328,"y":850},{"t":"gate","n":2,"x":310,"y":960,"a":15},{"t":"gate","n":2,"x":281,"y":1070,"a":30},{"t":"wall","x":151,"y":700,"a":-15},{"t":"wall","x":449,"y":680,"a":-75},{"t":"wall","x":303,"y":1184,"a":-15},{"t":"wall","x":146,"y":1150,"a":75}],"stars":[53,110,150],"best":175},"32":{"sol":[{"t":"gate","n":3,"x":301,"y":608,"a":-30},{"t":"gate","n":5,"x":395,"y":663},{"t":"gate","n":10,"x":391,"y":885,"a":15}],"stars":[40,79,120],"best":132},"33":{"sol":[{"t":"gate","n":3,"x":402,"y":330,"a":45},{"t":"gate","n":5,"x":279,"y":700,"a":-30},{"t":"gate","n":10,"x":348,"y":1060,"a":0},{"t":"wall","x":142,"y":1007,"a":30},{"t":"wall","x":562,"y":1010,"a":0}],"stars":[25,50,74],"best":84},"34":{"sol":[{"t":"gate","n":5,"x":342,"y":330,"a":0},{"t":"gate","n":10,"x":340,"y":470},{"t":"gate","n":10,"x":355,"y":800,"a":-30},{"t":"wall","x":324,"y":1073,"a":-45},{"t":"wall","x":441,"y":1111,"a":45},{"t":"bump","x":267,"y":1060}],"stars":[92,190,270],"best":308},"35":{"sol":[{"t":"gate","n":5,"x":425,"y":280},{"t":"wall","x":291,"y":364,"a":20},{"t":"wall","x":467,"y":380,"a":-35},{"t":"gate","n":10,"x":347,"y":500,"a":-15},{"t":"wall","x":272,"y":638,"a":35},{"t":"wall","x":440,"y":640,"a":-35},{"t":"gate","n":10,"x":390,"y":720,"a":-15},{"t":"wall","x":284,"y":850,"a":35},{"t":"wall","x":450,"y":860,"a":-35},{"t":"gate","n":20,"x":342,"y":940},{"t":"wall","x":284,"y":1059,"a":35},{"t":"wall","x":468,"y":1044,"a":-50},{"t":"gate","n":20,"x":380,"y":1140}],"stars":[60000,120000,170000],"best":198660}};
  Object.keys(CAL).forEach(function (k) { var L = levels[k]; L.sol = CAL[k].sol; L.stars = CAL[k].stars; L.best = CAL[k].best; });
  /* END CALIBRATED */

  /* play order (easy -> impossible); indexes into the list above.
     ORDER_V1 = the 24-level order before 15 Nov 2026 (used to move old saves to the new positions). */
  var ORDER_V1 = [0, 1, 2, 3, 4, 6, 7, 5, 8, 14, 9, 10, 16, 13, 17, 11, 19, 20, 15, 21, 23, 12, 18, 22];
  var ORDER = [0, 1, 2, 3, 25, 4, 6, 24, 7, 5, 8, 30, 14, 9, 27, 10, 16, 26, 13, 28, 17, 31, 11, 19, 29, 20, 15, 32, 21, 33, 23, 12, 34, 18, 22, 35];
  var base = levels;
  levels = ORDER.map(function (i) { return base[i]; });

  /* Daily challenge: one level a day (UTC), mirrored left-right so it plays fresh. par = what the mirrored hint layout scores. */
  function mx(x) { return 720 - x; }
  function mirrorItem(d) {
    var o = {}; for (var k in d) o[k] = d[k];
    if (o.x != null) o.x = mx(o.x);
    if (o.a) o.a = -o.a;
    if (o.spin) o.spin = -o.spin;
    if (o.move) { o.move = { ax: -(d.move.ax || 0), ay: d.move.ay || 0, f: d.move.f, ph: d.move.ph }; }
    return o;
  }
  function mirror(L) {
    var o = {}; for (var k in L) o[k] = L[k];
    o.drop = { x: mx(L.drop.x), y: L.drop.y };
    o.fixed = L.fixed.map(mirrorItem);
    o.sol = (L.sol || []).map(mirrorItem);
    if (L.zones) o.zones = L.zones.map(function (z) { return { x0: mx(z.x1), y0: z.y0, x1: mx(z.x0), y1: z.y1, t: z.t }; });
    return o;
  }
  var DAILY_POOL = [];
  for (var dp = 5; dp < 31; dp++) DAILY_POOL.push(dp);   // levels 6-31: past the tutorials, short of the giant finales
  function daily(day) {
    var h = Math.imul(day ^ 0x5bd1e995, 2654435761) >>> 0, pos = DAILY_POOL[h % DAILY_POOL.length], L = mirror(levels[pos]);
    var par = DAILY_PAR[ORDER[pos]] || L.best || L.stars[2];
    L.stars = [Math.max(2, Math.round(par * 0.3)), Math.max(3, Math.round(par * 0.6)), Math.max(4, Math.round(par * 0.85))].map(nice);
    L.daily = true; L.day = day; L.pos = pos;
    return L;
  }
  function nice(v) { if (v < 100) return v; var p = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / p) * p; }
  /* DAILY_PAR */
  var DAILY_PAR = {"4":5,"5":21,"6":5,"7":5,"8":23,"9":30,"10":26,"11":52,"12":1000,"13":37,"14":20,"15":237,"16":31,"17":26,"18":8497,"19":122,"20":131,"21":104,"23":568,"24":6,"26":20,"27":68,"28":179,"29":14,"30":41,"31":77,"32":114,"33":23,"34":271};
  /* END DAILY_PAR */

  var api = { levels: levels, ORDER: ORDER, ORDER_V1: ORDER_V1, base: base, mirror: mirror, daily: daily };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BTLevels = api;
})(this);
