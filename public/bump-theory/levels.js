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
    { name: 'Tap to turn', tip: 'Tap a gate to turn it. Lava eats balls.',
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
      sol: [g(5, C, 320), wl(280, 760, 30), wl(440, 760, -30), g(10, C, 1040)], stars: [500, 2000, 6000] }
  ];

  /* CALIBRATED (generated by the level checker: best layout found, stars = 35/65/90 % of it) */
  var CAL = {"1":{"sol":[{"t":"gate","n":3,"x":350,"y":1073,"a":15},{"t":"gate","n":2,"x":287,"y":995,"a":0}],"stars":[3,5,6],"best":6},"10":{"sol":[{"t":"gate","n":2,"x":307,"y":320,"a":-30},{"t":"gate","n":3,"x":360,"y":480,"a":-30},{"t":"wall","x":287,"y":780,"a":0},{"t":"wall","x":486,"y":1180,"a":180}],"stars":[10,19,27],"best":30},"11":{"sol":[{"t":"gate","n":3,"x":348,"y":300,"a":15},{"t":"gate","n":4,"x":339,"y":640,"a":-15},{"t":"gate","n":5,"x":347,"y":980,"a":-30}],"stars":[18,33,46],"best":52},"12":{"sol":[{"t":"gate","n":2,"x":392,"y":290,"a":-30},{"t":"gate","n":5,"x":370,"y":430,"a":-30},{"t":"wall","x":285,"y":609,"a":35},{"t":"wall","x":420,"y":605,"a":-60},{"t":"gate","n":10,"x":290,"y":720,"a":0},{"t":"wall","x":163,"y":942,"a":30},{"t":"wall","x":309,"y":790,"a":-30},{"t":"gate","n":10,"x":321,"y":1010,"a":-45}],"stars":[340,640,890],"best":991},"13":{"sol":[{"t":"gate","n":3,"x":511,"y":445,"a":60},{"t":"gate","n":4,"x":240,"y":733,"a":0},{"t":"gate","n":5,"x":696,"y":1187,"a":165}],"stars":[15,29,40],"best":45},"14":{"sol":[{"t":"gate","n":5,"x":324,"y":320,"a":-30},{"t":"gate","n":10,"x":137,"y":1000,"a":45},{"t":"bump","x":234,"y":1129},{"t":"bump","x":574,"y":1169}],"stars":[7,14,19],"best":22},"15":{"sol":[{"t":"gate","n":3,"x":312,"y":300,"a":-30},{"t":"wall","x":248,"y":412,"a":15},{"t":"wall","x":434,"y":418,"a":-75},{"t":"wall","x":243,"y":883,"a":45},{"t":"wall","x":428,"y":870,"a":-75}],"stars":[82,150,210],"best":237},"16":{"sol":[{"t":"gate","n":5,"x":360,"y":320,"a":-30},{"t":"wall","x":297,"y":490,"a":45},{"t":"wall","x":441,"y":515,"a":-40},{"t":"gate","n":10,"x":344,"y":900,"a":-45},{"t":"bump","x":73,"y":864}],"stars":[14,26,36],"best":41},"17":{"sol":[{"t":"gate","n":4,"x":378,"y":320,"a":-15},{"t":"gate","n":5,"x":364,"y":500,"a":0},{"t":"gate","n":5,"x":323,"y":680,"a":0},{"t":"bump","x":333,"y":910},{"t":"bump","x":251,"y":1084},{"t":"bump","x":551,"y":1056}],"stars":[10,20,27],"best":31},"18":{"sol":[{"t":"gate","n":2,"x":371,"y":280,"a":15},{"t":"gate","n":5,"x":328,"y":400,"a":0},{"t":"wall","x":258,"y":559,"a":35},{"t":"wall","x":504,"y":552,"a":-35},{"t":"gate","n":10,"x":380,"y":640,"a":0},{"t":"wall","x":291,"y":771,"a":60},{"t":"wall","x":439,"y":791,"a":-45},{"t":"gate","n":10,"x":297,"y":880,"a":0},{"t":"wall","x":276,"y":974,"a":45},{"t":"wall","x":412,"y":992,"a":-90},{"t":"gate","n":10,"x":375,"y":1120,"a":15}],"stars":[3300,6300,8700],"best":9694},"19":{"sol":[{"t":"gate","n":5,"x":338,"y":360,"a":-60},{"t":"wall","x":437,"y":690,"a":15},{"t":"wall","x":121,"y":1099,"a":-135},{"t":"wall","x":426,"y":1050,"a":30}],"stars":[49,91,120],"best":140},"2":{"sol":[{"t":"gate","n":2,"x":369,"y":330,"a":105},{"t":"gate","n":5,"x":331,"y":560,"a":0}],"stars":[5,8,10],"best":10},"20":{"sol":[{"t":"wall","x":373,"y":377,"a":135},{"t":"gate","n":3,"x":192,"y":664,"a":30},{"t":"gate","n":5,"x":204,"y":747,"a":15},{"t":"gate","n":10,"x":192,"y":817,"a":15},{"t":"wall","x":238,"y":929,"a":135}],"stars":[45,85,110],"best":131},"21":{"sol":[{"t":"gate","n":5,"x":418,"y":270,"a":0},{"t":"gate","n":10,"x":450,"y":680,"a":30},{"t":"wall","x":219,"y":1042,"a":60},{"t":"wall","x":607,"y":944,"a":-15},{"t":"gate","n":10,"x":421,"y":1120,"a":0}],"stars":[99,180,250],"best":284},"22":{"sol":[{"t":"gate","n":5,"x":368,"y":280,"a":-45},{"t":"wall","x":321,"y":432,"a":45},{"t":"wall","x":429,"y":380,"a":-45},{"t":"gate","n":10,"x":466,"y":500,"a":-45},{"t":"wall","x":270,"y":640,"a":35},{"t":"wall","x":444,"y":610,"a":-35},{"t":"gate","n":10,"x":345,"y":720,"a":0},{"t":"wall","x":283,"y":862,"a":35},{"t":"wall","x":450,"y":860,"a":-35},{"t":"gate","n":10,"x":335,"y":940,"a":0},{"t":"wall","x":270,"y":1060,"a":35},{"t":"wall","x":450,"y":1060,"a":-35},{"t":"gate","n":10,"x":346,"y":1140,"a":15}],"stars":[17000,31000,43000],"best":48629},"23":{"sol":[{"t":"gate","n":5,"x":294,"y":320,"a":30},{"t":"wall","x":393,"y":620,"a":15},{"t":"wall","x":680,"y":683,"a":-60},{"t":"gate","n":10,"x":377,"y":1040,"a":15}],"stars":[250,460,640],"best":720},"3":{"sol":[{"t":"gate","n":3,"x":696,"y":748,"a":-135},{"t":"gate","n":3,"x":663,"y":785,"a":45}],"stars":[5,7,9],"best":9},"4":{"sol":[{"t":"gate","n":5,"x":651,"y":1062,"a":0},{"t":"wall","x":56,"y":791,"a":-90}],"stars":[3,4,5],"best":5},"5":{"sol":[{"t":"gate","n":3,"x":290,"y":300,"a":-30},{"t":"wall","x":272,"y":460,"a":75},{"t":"wall","x":572,"y":845,"a":0},{"t":"gate","n":3,"x":404,"y":680,"a":-30},{"t":"gate","n":3,"x":431,"y":1000,"a":15}],"stars":[8,16,22],"best":25},"6":{"sol":[{"t":"gate","n":3,"x":374,"y":300,"a":30},{"t":"gate","n":2,"x":265,"y":760,"a":0},{"t":"gate","n":2,"x":271,"y":900,"a":-45},{"t":"gate","n":2,"x":339,"y":1040,"a":-15}],"stars":[5,10,14],"best":16},"7":{"sol":[{"t":"gate","n":3,"x":319,"y":380,"a":-30},{"t":"gate","n":5,"x":401,"y":600,"a":45},{"t":"bump","x":266,"y":722}],"stars":[5,7,9],"best":9},"8":{"sol":[{"t":"gate","n":5,"x":324,"y":360,"a":15},{"t":"gate","n":5,"x":305,"y":620,"a":-15},{"t":"wall","x":293,"y":884,"a":15},{"t":"wall","x":407,"y":870,"a":-75},{"t":"wall","x":489,"y":729,"a":-15}],"stars":[8,16,22],"best":25},"9":{"sol":[{"t":"gate","n":3,"x":299,"y":320,"a":-195},{"t":"wall","x":41,"y":676,"a":30},{"t":"wall","x":401,"y":390,"a":-45},{"t":"gate","n":10,"x":313,"y":760,"a":30}],"stars":[10,19,27],"best":30}};
  Object.keys(CAL).forEach(function (k) { var L = levels[k]; L.sol = CAL[k].sol; L.stars = CAL[k].stars; L.best = CAL[k].best; });
  /* END CALIBRATED */

  /* play order (easy -> impossible); indexes into the list above */
  var ORDER = [0, 1, 2, 3, 4, 6, 7, 5, 8, 14, 9, 10, 16, 13, 17, 11, 19, 20, 15, 21, 23, 12, 18, 22];
  levels = ORDER.map(function (i) { return levels[i]; });

  var api = { levels: levels };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BTLevels = api;
})(this);
