"use strict";
// Calgoal animation scripts: key poses for each movement. See anim.js for the conventions.
// Side view: the figure faces right, floor at y 95, overhead bar at y 14 with hands at x 60.
const MOVES = (() => {
  const BAR = 14, FL = 95;
  const D = CalAnim.pt;
  const dirOf = (a, b) => Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180 / Math.PI;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const X = (...objs) => Object.assign({}, ...objs);

  // A straight body (legs and torso in one line) from the ankles toward a shoulder point.
  const line = (ankle, sh, f) => { const d = dirOf(ankle, sh); return { hip: D(ankle, d, 42), torso: d, legN: { a: [d + 180, d + 180], f } }; };
  // A straight body from the knees, shins flat on the floor behind.
  const kneel = (knee, sh, f = 300) => { const d = dirOf(knee, sh); return { hip: D(knee, d, 21), torso: d, legN: { a: [d + 180, 270], f } }; };
  // Shoulder point on a circle around `anchor` that is `reach` away from `hand` (searching angles lo..hi).
  const aim = (anchor, r, hand, reach, lo, hi) => {
    const f = a => dist(D(anchor, a, r), hand) - reach;
    let flo = f(lo);
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, fm = f(m); if ((fm > 0) === (flo > 0)) { lo = m; flo = fm; } else hi = m; }
    return D(anchor, (lo + hi) / 2, r);
  };
  const mv = (base, keys, extra) => X(base, { keys }, extra);

  // ---------- views ----------
  const HANG = { view: "0 0 120 118", props: [{ bar: [30, 90, BAR] }] };
  const FLOOR = { view: "0 0 120 110", props: [{ floor: FL }] };
  const TALL = { view: "0 -12 120 112", props: [{ floor: FL }] };
  const HAND = [60, BAR];
  const arm = { to: HAND, bend: 1 }, armS = { to: HAND, straight: true };
  const hangLegs = { legN: { a: [176, 186], point: true }, legF: { a: [179, 191], point: true } };
  const M = {};

  // ---------- hanging and pulling ----------
  const deadHang = X({ sh: [60, 42], torso: 0, armN: armS }, hangLegs);
  const passive = X(deadHang, { sh: [60, 43.5], neck: 1.5 }), active = { sh: [60, 40], neck: 4 };
  M["dead-hang"] = mv(HANG, [{ pose: deadHang }]);
  M["active-hang"] = mv(HANG, [{ pose: passive, hold: 600, move: 700 }, { pose: active, hold: 1500, move: 700 }]);
  M["scap-pull"] = mv(HANG, [{ pose: passive, hold: 300, move: 700 }, { pose: active, hold: 350, move: 800 }]);
  M["scap-pull-pause"] = mv(HANG, [{ pose: passive, hold: 300, move: 800 }, { pose: active, hold: 2000, move: 1100 }]);
  M["arch-hang"] = mv(HANG, [{ pose: passive, hold: 500, move: 900 },
    { pose: { sh: [57, 40], torso: -16, head: 12, neck: 4, legN: { a: [166, 180], point: true }, legF: { a: [169, 184], point: true } }, hold: 1500, move: 900 }]);
  M["one-arm-hang"] = mv(HANG, [{ pose: X(deadHang, { armF: { a: [182, 178] } }) }]);
  M["one-arm-scap"] = mv(HANG, [{ pose: X(passive, { armF: { a: [182, 178] } }), hold: 300, move: 800 }, { pose: active, hold: 500, move: 900 }]);

  const puBottom = X({ sh: [60, 42], torso: 0, armN: arm }, hangLegs), puTop = { sh: [51, 15], torso: -10 };
  M["pull-up"] = mv(HANG, [{ pose: puBottom, hold: 300, move: 1000 }, { pose: puTop, hold: 450, move: 1200 }]);
  M["pull-up-negative"] = mv(HANG, [{ pose: X(puBottom, puTop), hold: 500, move: 2800 }, { pose: { sh: [60, 42], torso: 0 }, hold: 300, move: 700 }]);
  M["pull-up-band"] = mv(HANG, [{ pose: puBottom, hold: 300, move: 1100 }, { pose: puTop, hold: 400, move: 1200 }], { band: [60, BAR] });
  M["chin-top-hold"] = mv(HANG, [{ pose: X(puBottom, puTop) }]);
  M["chest-to-bar"] = mv(HANG, [{ pose: puBottom, hold: 300, move: 1000 },
    { pose: { sh: [53, 8], torso: -24, legN: { a: [164, 182], point: true }, legF: { a: [167, 186], point: true } }, hold: 450, move: 1200 }]);
  M["l-sit-pull-up"] = mv(HANG, [{ pose: X(puBottom, { legN: { a: [92, 92], point: true }, legF: { a: [94, 94], point: true } }), hold: 300, move: 1100 }, { pose: puTop, hold: 450, move: 1200 }]);
  M["one-arm-pull-up"] = mv(HANG, [{ pose: X(puBottom, { armF: { a: [150, 40] } }), hold: 300, move: 1500 }, { pose: puTop, hold: 450, move: 1500 }]);
  M["one-arm-negative"] = mv(HANG, [{ pose: X(puBottom, puTop, { armF: { a: [150, 40] } }), hold: 500, move: 3000 }, { pose: { sh: [60, 42], torso: 0 }, hold: 300, move: 700 }]);

  // Archer pull-up, seen from the front.
  const ARCH = { view: "0 0 120 118", front: true, props: [{ bar: [22, 98, BAR] }] };
  M["archer-pull-up"] = mv(ARCH, [
    { pose: { sh: [60, 38], torso: 0, armN: { to: [80, BAR], bend: -1 }, armF: { to: [40, BAR], bend: 1 }, legN: { a: [178, 180], point: true }, legF: { a: [182, 180], point: true } }, hold: 300, move: 1200 },
    { pose: { sh: [73, 18], torso: 2 }, hold: 450, move: 1200 }]);

  // Rows: body straight from the heels, pulling the chest to a low bar.
  const row = (hand, ankle, props, o = {}) => {
    const a0 = dirOf(ankle, hand);
    const pose = sh => X(line(ankle, sh, o.f ?? 15), { armN: { to: hand, bend: o.bend ?? 1 } }, o.extra);
    return { view: "0 0 120 110", props, keys: [
      { pose: pose(aim(ankle, 68, hand, 27.5, a0, 89)), hold: 300, move: 1000 },
      { pose: pose(aim(ankle, 68, hand, o.top ?? 10.5, a0, 89)), hold: 400, move: 1000 }] };
  };
  M["row-incline"] = row([45, 20], [14, 91], [{ floor: FL }, { bar: [39, 51, 20] }, { post: [45, 20, 95] }]);
  M["row-horizontal"] = row([84, 62], [14, 91], [{ floor: FL }, { bar: [78, 90, 62] }, { post: [84, 62, 95] }], { top: 9 });
  M["row-feet-up"] = row([84, 58], [14, 70], [{ floor: FL }, { box: [-4, 73, 26, 22] }, { bar: [78, 90, 58] }, { post: [84, 58, 95] }], { top: 8, f: 10 });
  M["row-one-arm"] = row([84, 62], [14, 91], [{ floor: FL }, { bar: [78, 90, 62] }, { post: [84, 62, 95] }], { top: 9, extra: { armF: { a: [258, 258] } } });
  M["tuck-fl-row"] = { view: "0 0 120 100", props: [{ bar: [40, 100, 30] }], keys: [
    { pose: { sh: [62, 56], torso: 90, armN: { to: [66, 30], bend: 1 }, legN: { a: [55, 235], point: true }, legF: { a: [58, 238], point: true } }, hold: 300, move: 1000 },
    { pose: { sh: [64, 41] }, hold: 400, move: 1000 }] };

  // ---------- planks and core on the floor ----------
  const plank = X(line([18, 90], [84.9, 78], 165), { armN: { a: [180, 90] } });
  M["plank"] = mv(FLOOR, [{ pose: plank }]);
  M["plank-knee"] = mv(FLOOR, [{ pose: X(kneel([40, 92], [84.9, 78]), { armN: { a: [180, 90] } }) }]);
  M["plank-long-lever"] = mv(FLOOR, [{ pose: X(line([16, 90], [80, 79.9], 165), { armN: { a: [150, 90] } }) }]);
  M["body-saw"] = mv(FLOOR, [{ pose: plank, hold: 200, move: 1100 }, { pose: X(line([10, 90], [76.9, 79], 165), { armN: { a: [148, 92] } }), hold: 200, move: 1100 }]);
  M["ab-wheel-knee"] = mv(FLOOR, [
    { pose: { hip: [40, 71], torso: 55, armN: { to: [64, 84], straight: true }, legN: { a: [180, 270], f: 300 } }, hold: 300, move: 1400 },
    { pose: X(kneel([40, 92], [85.4, 79.8]), { armN: { to: [108, 85], straight: true } }), hold: 300, move: 1300 }], { wheel: 4 });
  M["ab-wheel-stand"] = mv(FLOOR, [
    { pose: { hip: [40, 52], torso: 120, armN: { to: [66, 87], straight: true }, legN: { a: [207.8, 207.8], f: 165 } }, hold: 300, move: 1600 },
    { pose: X(line([20, 90], [87.3, 80.5], 165), { armN: { to: [110, 86], straight: true } }), hold: 300, move: 1500 }], { wheel: 4 });

  // ---------- bridges (lying on the back, head to the right) ----------
  const footFlat = 270;
  M["glute-bridge"] = mv(FLOOR, [
    { pose: { sh: [78, 88], torso: 90, armN: { a: [270, 270] }, legN: { to: [36, 90], bend: 1, f: footFlat } }, hold: 300, move: 900 },
    { pose: { torso: 120.3 }, hold: 700, move: 900 }]);
  M["reverse-tabletop"] = mv(FLOOR, [
    { pose: { hip: [46, 90], torso: 45, armN: { to: [74, 94], bend: 1 }, legN: { to: [25, 90], bend: 1, f: footFlat } }, hold: 300, move: 1000 },
    { pose: { hip: [46, 68], torso: 90, head: 25 }, hold: 1200, move: 1000 }]);
  const bridge = { hip: [50, 52], torso: 130, head: 35, armN: { to: [80, 94], bend: -1 }, legN: { to: [34, 90], bend: 1, f: footFlat } };
  M["back-bridge"] = mv(FLOOR, [
    { pose: { hip: [50, 88], torso: 90, head: 0, armN: { to: [80, 91], bend: -1 }, legN: { to: [34, 90], bend: 1, f: footFlat } }, hold: 300, move: 1200 },
    { pose: bridge, hold: 1400, move: 1100 }]);
  M["bridge-elevated"] = mv(FLOOR, [
    { pose: { hip: [48, 74], torso: 75, head: 10, armN: { to: [98, 66], bend: 1 }, legN: { to: [32, 91], bend: 1, f: footFlat } }, hold: 300, move: 1100 },
    { pose: { hip: [48, 55], torso: 100, head: 40 }, hold: 1400, move: 1100 }], { props: [{ floor: FL }, { box: [84, 66, 40, 29] }] });
  M["bridge-straight-leg"] = mv(FLOOR, [
    { pose: bridge, hold: 500, move: 1200 },
    { pose: { hip: [48, 58], torso: 120, armN: { to: [82, 94], bend: 1 }, legN: { to: [16, 88], bend: 1, f: 240 } }, hold: 1200, move: 1200 }]);
  const standArch = [
    { pose: { hip: [68, 50], torso: 0, head: 0, armN: { to: [66, -2], bend: -1 }, legN: { to: [70, 91], bend: -1, f: 90 } }, hold: 400, move: 1100 },
    { pose: { hip: [72, 56], torso: -40, head: -30, armN: { to: [30, 42], bend: -1 } }, hold: 300, move: 1100 }];
  const handsDown = { pose: { hip: [64, 56], torso: -130, head: -30, armN: { to: [34, 94], bend: -1 } }, hold: 1000, move: 1600 };
  M["stand-to-bridge"] = mv(TALL, [...standArch, handsDown]);
  M["wall-walk-down"] = mv(TALL, [standArch[0], { pose: { hip: [72, 56], torso: -40, head: -30, armN: { to: [28, 40], bend: -1 } }, hold: 300, move: 900 },
    { pose: { hip: [68, 58], torso: -95, armN: { to: [28, 64], bend: -1 } }, hold: 300, move: 900 }, handsDown], { props: [{ floor: FL }, { wall: 26 }] });

  // ---------- leg raises from a hang ----------
  const hangStraight = X({ sh: [60, 42], torso: 0, armN: armS }, { legN: { a: [180, 180], point: true }, legF: { a: [182, 182], point: true } });
  M["hang-knee-raise"] = mv(HANG, [{ pose: hangStraight, hold: 300, move: 900 }, { pose: { torso: -4, legN: { a: [90, 180], point: true }, legF: { a: [92, 182], point: true } }, hold: 400, move: 900 }]);
  M["hang-tuck-raise"] = mv(HANG, [{ pose: hangStraight, hold: 300, move: 900 }, { pose: { torso: -12, legN: { a: [30, 170], point: true }, legF: { a: [32, 172], point: true } }, hold: 400, move: 900 }]);
  M["hanging-leg-raise"] = mv(HANG, [{ pose: hangStraight, hold: 300, move: 1100 }, { pose: { torso: -8, legN: { a: [92, 92], point: true }, legF: { a: [94, 94], point: true } }, hold: 400, move: 1100 }]);
  M["toes-to-bar"] = mv(HANG, [{ pose: hangStraight, hold: 300, move: 1100 }, { pose: { torso: -45, legN: { a: [-15, -15], point: true }, legF: { a: [-13, -13], point: true } }, hold: 300, move: 1200 }]);
  M["toes-to-bar-strict"] = mv(HANG, [{ pose: hangStraight, hold: 300, move: 1600 }, { pose: { torso: -45, legN: { a: [-15, -15], point: true }, legF: { a: [-13, -13], point: true } }, hold: 300, move: 3000 }]);

  // ---------- pushing from the floor ----------
  const PU_HAND = [85, 94], PU_ANK = [21, 89];
  const puArm = { armN: { to: PU_HAND, bend: 1 } };
  M["push-up"] = mv(FLOOR, [{ pose: X(line(PU_ANK, [85, 66], 165), puArm), hold: 300, move: 1000 }, { pose: X(line(PU_ANK, [89, 87], 165), puArm), hold: 250, move: 900 }]);
  M["push-up-fast"] = mv(FLOOR, [{ pose: X(line(PU_ANK, [85, 66], 165), puArm), hold: 200, move: 900 }, { pose: X(line(PU_ANK, [89, 87], 165), puArm), hold: 100, move: 400 }]);
  M["clap-push-up"] = mv(FLOOR, [
    { pose: X(line(PU_ANK, [85, 66], 165), puArm), hold: 200, move: 800 },
    { pose: X(line(PU_ANK, [89, 87], 165), puArm), hold: 80, move: 300 },
    { pose: X(line(PU_ANK, [84, 58], 165), { armN: { to: [86, 72], bend: 1 } }), hold: 120, move: 300 }]);
  M["push-up-incline"] = mv(FLOOR, [{ pose: X(line([45, 90], [94, 43], 165), { armN: { to: [100, 70], bend: 1 } }), hold: 300, move: 1000 },
    { pose: X(line([45, 90], [106, 60], 165), { armN: { to: [100, 70], bend: 1 } }), hold: 250, move: 900 }], { props: [{ floor: FL }, { box: [92, 70, 30, 25] }] });
  M["push-up-knee"] = mv(FLOOR, [{ pose: X(kneel([40, 92], [82, 66]), { armN: { to: [82, 94], bend: 1 } }), hold: 300, move: 1000 },
    { pose: X(kneel([40, 92], [86, 86]), { armN: { to: [82, 94], bend: 1 } }), hold: 250, move: 900 }]);
  M["pseudo-planche-push-up"] = mv(FLOOR, [{ pose: X(line([16, 89], [80, 68], 165), { armN: { to: [68, 94], bend: 1 } }), hold: 300, move: 1100 },
    { pose: X(line([16, 89], [86, 84], 165), { armN: { to: [68, 94], bend: 1 } }), hold: 250, move: 1000 }]);
  M["one-arm-push-up"] = mv(FLOOR, [{ pose: X(line(PU_ANK, [85, 66], 165), puArm, { armF: { a: [250, 300] } }), hold: 300, move: 1300 },
    { pose: X(line(PU_ANK, [89, 85], 165), puArm), hold: 250, move: 1200 }]);
  M["tiger-bend"] = mv(FLOOR, [{ pose: X(line(PU_ANK, [85, 66], 165), { armN: { to: PU_HAND, bend: 1 } }), hold: 300, move: 1200 },
    { pose: line(PU_ANK, [71, 78], 165), hold: 400, move: 1300 }]);

  // Scapular push-ups: arms stay straight, the shoulder blades sink and push.
  const scapKeys = (ank, hand, top, f = 165) => [
    { pose: X(line(ank, [top[0], top[1] + 2.5], f), { neck: 2.3, armN: { to: hand, straight: true } }), hold: 300, move: 700 },
    { pose: X(line(ank, top, f), { neck: 4 }), hold: 400, move: 700 }];
  M["scap-push-up"] = mv(FLOOR, scapKeys(PU_ANK, PU_HAND, [85, 66]));
  M["scap-push-up-pause"] = mv(FLOOR, scapKeys(PU_ANK, PU_HAND, [85, 66]).map((k, i) => X(k, i ? { hold: 2000 } : {})));
  M["scap-push-up-incline"] = mv(FLOOR, scapKeys([36, 90], [86, 70], [86, 43]), { props: [{ floor: FL }, { box: [78, 70, 30, 25] }] });
  M["pseudo-planche-scap"] = mv(FLOOR, scapKeys([16, 89], [76, 94], [86, 66]));
  const tuckPl = { sh: [68, 67], torso: 90, head: -10, armN: { to: [60, 94], straight: true }, legN: { a: [115, 250], point: true }, legF: { a: [118, 253], point: true } };
  M["tuck-planche-scap"] = mv(FLOOR, [{ pose: X(tuckPl, { sh: [68, 69], neck: 2.3 }), hold: 300, move: 700 }, { pose: { sh: [68, 66.5], neck: 4 }, hold: 400, move: 700 }]);
  M["tuck-planche"] = mv(FLOOR, [{ pose: tuckPl }]);

  // ---------- dips ----------
  const DIPV = { view: "0 0 120 110", props: [{ floor: 100 }, { bar: [42, 88, 52] }, { post: [46, 52, 100] }, { post: [84, 52, 100] }] };
  const dipTop = { hip: [62, 50], torso: 8, armN: { to: [66, 52], bend: 1 }, legN: { a: [175, 235] }, legF: { a: [178, 240] } };
  const dipLow = { hip: [58, 63], torso: 22 };
  M["dip"] = mv(DIPV, [{ pose: dipTop, hold: 300, move: 1000 }, { pose: dipLow, hold: 250, move: 1000 }]);
  M["support-hold"] = mv(DIPV, [{ pose: X(dipTop, { armN: { to: [66, 52], straight: true } }) }]);
  M["dip-negative"] = mv(DIPV, [{ pose: dipTop, hold: 500, move: 2800 }, { pose: dipLow, hold: 300, move: 800 }]);
  M["ring-dip"] = mv({ view: "0 0 120 110", props: [{ floor: 100 }] }, [{ pose: dipTop, hold: 300, move: 1100 }, { pose: dipLow, hold: 250, move: 1100 }], { rings: 2 });
  M["straight-bar-dip"] = mv({ view: "0 0 120 110", props: [{ floor: 100 }, { ball: [62, 52, 2.2] }] }, [
    { pose: { hip: [58, 50], torso: 15, armN: { to: [62, 52], bend: 1 }, legN: { a: [172, 176], point: true }, legF: { a: [176, 180], point: true } }, hold: 300, move: 1000 },
    { pose: { hip: [54, 58], torso: 45, legN: { a: [200, 204], point: true }, legF: { a: [204, 208], point: true } }, hold: 250, move: 1000 }]);
  M["bench-dip"] = mv(FLOOR, [
    { pose: { sh: [44, 42], torso: 0, armN: { to: [33, 68], bend: 1 }, legN: { to: [76, 90], bend: -1, f: 20 } }, hold: 300, move: 1000 },
    { pose: { sh: [45, 56], torso: 2 }, hold: 250, move: 1000 }], { props: [{ floor: FL }, { box: [6, 68, 28, 27] }] });

  // ---------- pike push-ups and handstands ----------
  M["pike-push-up"] = mv(FLOOR, [
    { pose: { hip: [50, 52], torso: 135, armN: { to: [80, 94], bend: 1 }, legN: { to: [34, 88], straight: true, f: 160 } }, hold: 300, move: 1100 },
    { pose: { hip: [63.3, 56.9], torso: 165, head: -40 }, hold: 250, move: 1000 }]);
  M["pike-push-up-elevated"] = mv(FLOOR, [
    { pose: { hip: [52, 40], torso: 170, armN: { to: [60, 94], bend: 1 }, legN: { to: [12, 52], straight: true, f: 150 } }, hold: 300, move: 1100 },
    { pose: { hip: [54, 47], torso: 165, head: -40 }, hold: 250, move: 1000 }], { props: [{ floor: FL }, { box: [-6, 56, 30, 39] }] });
  M["pike-push-up-deficit"] = mv(FLOOR, [
    { pose: { hip: [48, 44], torso: 140, armN: { to: [79, 84], bend: 1 }, legN: { to: [32, 84], straight: true, f: 160 } }, hold: 300, move: 1100 },
    { pose: { hip: [60, 50], torso: 168, head: -45 }, hold: 250, move: 1100 }], { props: [{ floor: FL }, { box: [72, 84, 14, 11] }] });
  const hsTop = { hip: [62, 40], torso: 180, armN: { to: [62, 94], bend: -1 }, legN: { a: [0, 0], point: true }, legF: { a: [2, 2], point: true } };
  const hsLow = { hip: [62, 56] };
  const WALLHS = { view: "0 -12 120 112", props: [{ floor: FL }, { wall: 67 }] };
  M["wall-handstand"] = mv(WALLHS, [{ pose: hsTop }]);
  M["hspu-negative"] = mv(WALLHS, [{ pose: hsTop, hold: 500, move: 2800 }, { pose: hsLow, hold: 300, move: 800 }]);
  M["hspu-wall"] = mv(WALLHS, [{ pose: hsTop, hold: 300, move: 1200 }, { pose: hsLow, hold: 250, move: 1100 }]);
  M["hspu-free"] = mv(TALL, [{ pose: hsTop, hold: 300, move: 1200 }, { pose: hsLow, hold: 250, move: 1100 }]);
  M["handstand"] = mv(TALL, [{ pose: hsTop }]);

  // ---------- triceps on a bar ----------
  const tri = (bar, ankle) => {
    const a0 = dirOf(ankle, bar);
    const pose = sh => X(line(ankle, sh, 165), { armN: { to: bar, bend: -1 } });
    return { view: "0 0 120 110", props: [{ floor: FL }, { ball: [bar[0], bar[1] + 2, 2.2] }, { post: [bar[0], bar[1] + 4, FL] }], keys: [
      { pose: pose(aim(ankle, 68, bar, 27.5, 5, a0)), hold: 300, move: 1100 },
      { pose: pose(aim(ankle, 68, bar, 8, 5, a0)), hold: 300, move: 1000 }] };
  };
  M["tricep-high"] = tri([84, 50], [36, 91]);
  M["tricep-hip"] = tri([86, 62], [30, 91]);
  M["tricep-low"] = tri([88, 74], [24, 91]);

  // ---------- frog stance and balance ----------
  M["frog-stance"] = mv(FLOOR, [
    { pose: { sh: [73, 71], torso: 95, armN: { to: [70, 94], bend: 1 }, legN: { a: [112, 232] }, legF: { a: [114, 234] } }, hold: 400, move: 1000 },
    { pose: { sh: [76, 72], torso: 100, legN: { a: [110, 300], point: true }, legF: { a: [112, 302], point: true } }, hold: 1500, move: 900 }]);
  M["frog-stance-toes"] = mv(FLOOR, [
    { pose: { sh: [73, 71], torso: 95, armN: { to: [70, 94], bend: 1 }, legN: { a: [112, 232] }, legF: { a: [114, 234] } }, hold: 500, move: 800 },
    { pose: { sh: [74, 71.5], legF: { a: [112, 300], point: true } }, hold: 900, move: 800 }]);
  M["tripod-tuck"] = mv(FLOOR, [
    { pose: { sh: [80, 82], torso: 160, armN: { to: [70, 94], bend: 1 }, legN: { a: [150, 200] }, legF: { a: [152, 202] } }, hold: 400, move: 1000 },
    { pose: { legN: { a: [150, 290], point: true }, legF: { a: [152, 292], point: true } }, hold: 1500, move: 900 }]);
  M["crane"] = mv(FLOOR, [
    { pose: { sh: [74, 66], torso: 110, armN: { to: [70, 94], straight: true }, legN: { a: [80, 200] }, legF: { a: [82, 202] } }, hold: 400, move: 1000 },
    { pose: { sh: [76, 66], legN: { a: [80, 275], point: true }, legF: { a: [82, 277], point: true } }, hold: 1500, move: 900 }]);

  // ---------- lying core (on the back, head to the right) ----------
  const flat = { hip: [50, 90], torso: 90, head: 0, armN: { a: [-90, -90] }, legN: { a: [-90, -90], point: true } };
  M["dead-bug"] = mv(FLOOR, [
    { pose: { hip: [50, 90], torso: 90, armN: { a: [0, 0] }, legN: { a: [0, -90] } }, hold: 300, move: 800 },
    { pose: { armN: { a: [78, 78] }, armF: { a: [0, 0] }, legN: { a: [0, -90] }, legF: { a: [-98, -98], point: true } }, hold: 400, move: 800 },
    { pose: { armN: { a: [0, 0] }, armF: { a: [0, 0] }, legN: { a: [0, -90] }, legF: { a: [0, -90] } }, hold: 300, move: 800 },
    { pose: { armN: { a: [0, 0] }, armF: { a: [78, 78] }, legN: { a: [-98, -98], point: true }, legF: { a: [0, -90] } }, hold: 400, move: 800 }]);
  M["hollow-tuck"] = mv(FLOOR, [{ pose: flat, hold: 400, move: 900 }, { pose: { torso: 80, armN: { a: [-85, -85] }, legN: { a: [-10, -95], point: true } }, hold: 1500, move: 900 }]);
  M["hollow-one-leg"] = mv(FLOOR, [{ pose: flat, hold: 400, move: 900 }, { pose: { torso: 80, armN: { a: [-85, -85] }, legN: { a: [-98, -98], point: true }, legF: { a: [-10, -95], point: true } }, hold: 1500, move: 900 }]);
  M["hollow-arms-sides"] = mv(FLOOR, [{ pose: flat, hold: 400, move: 900 }, { pose: { torso: 80, armN: { a: [-85, -85] }, legN: { a: [-98, -98], point: true } }, hold: 1500, move: 900 }]);
  M["hollow"] = mv(FLOOR, [{ pose: X(flat, { armN: { a: [90, 90] } }), hold: 400, move: 900 }, { pose: { torso: 80, head: -5, armN: { a: [78, 78] }, legN: { a: [-98, -98], point: true } }, hold: 1500, move: 900 }]);
  M["hollow-rocks"] = mv(FLOOR, [
    { pose: { hip: [52, 88], torso: 70, armN: { a: [70, 70] }, legN: { a: [-95, -95], point: true } }, hold: 50, move: 500 },
    { pose: { hip: [50, 84], torso: 100, armN: { a: [100, 100] }, legN: { a: [-75, -75], point: true } }, hold: 50, move: 500 }]);

  // ---------- squats and jumps ----------
  const stand = { hip: [60, 50], torso: 0, head: 0, armN: { a: [180, 180] }, legN: { to: [60, 92], bend: -1, f: 90 } };
  const squat = { hip: [46, 74], torso: 38, armN: { a: [90, 90] } };
  const air = { hip: [60, 36], torso: 0, armN: { a: [10, 10] }, legN: { to: [60, 78], bend: -1, f: 155 } };
  M["air-squat"] = mv(FLOOR, [{ pose: stand, hold: 300, move: 1000 }, { pose: squat, hold: 250, move: 1000 }]);
  M["squat-pause"] = mv(FLOOR, [{ pose: stand, hold: 300, move: 1000 }, { pose: squat, hold: 2200, move: 1000 }]);
  M["squat-jump-stick"] = mv(TALL, [{ pose: stand, hold: 300, move: 600 }, { pose: squat, hold: 150, move: 350 }, { pose: air, hold: 40, move: 350 }, { pose: squat, hold: 1000, move: 700 }]);
  M["jump-squat"] = mv(TALL, [{ pose: X(stand, squat), hold: 120, move: 330 }, { pose: air, hold: 40, move: 330 }]);
  M["tuck-jump"] = mv(TALL, [{ pose: X(stand, squat), hold: 120, move: 330 }, { pose: X(air, { hip: [60, 34], legN: { to: [76, 44], bend: -1, f: 155 } }), hold: 60, move: 330 }]);
  const lungeN = { hip: [54, 70], torso: 4, head: 0, armN: { a: [200, 180] }, armF: { a: [160, 180] }, legN: { to: [74, 92], bend: -1, f: 90 }, legF: { to: [30, 90], bend: -1, f: 150 } };
  const lungeF = { armN: { a: [160, 180] }, armF: { a: [200, 180] }, legN: { to: [30, 90], bend: -1, f: 150 }, legF: { to: [74, 92], bend: -1, f: 90 } };
  const lungeAir = { hip: [54, 50], legN: { to: [62, 88], bend: -1, f: 120 }, legF: { to: [44, 86], bend: -1, f: 120 } };
  M["split-jump"] = mv(FLOOR, [{ pose: lungeN, hold: 150, move: 350 }, { pose: lungeAir, hold: 50, move: 350 }, { pose: X(lungeN, lungeF), hold: 150, move: 350 }, { pose: lungeAir, hold: 50, move: 350 }]);
  M["box-jump"] = mv(FLOOR, [
    { pose: X(stand, { hip: [36, 50], legN: { to: [36, 92], bend: -1, f: 90 } }), hold: 400, move: 500 },
    { pose: { hip: [26, 74], torso: 38, armN: { a: [200, 200] }, legN: { to: [36, 92], bend: -1, f: 90 } }, hold: 120, move: 350 },
    { pose: { hip: [56, 30], torso: 5, armN: { a: [20, 20] }, legN: { to: [62, 62], bend: -1, f: 140 } }, hold: 40, move: 350 },
    { pose: { hip: [64, 50], torso: 30, armN: { a: [90, 90] }, legN: { to: [76, 64], bend: -1, f: 90 } }, hold: 300, move: 500 },
    { pose: { hip: [76, 25], torso: 0, armN: { a: [180, 180] }, legN: { to: [76, 66], bend: -1, f: 90 } }, hold: 700, move: 900 }], { view: "0 -12 120 112", props: [{ floor: FL }, { box: [62, 67, 40, 28] }] });
  M["single-leg-jump"] = mv(TALL, [
    { pose: X(stand, { legF: { a: [190, 260], f: 330 } }), hold: 300, move: 400 },
    { pose: { hip: [52, 64], torso: 30, armN: { a: [200, 200] } }, hold: 120, move: 300 },
    { pose: { hip: [60, 38], torso: 0, armN: { a: [10, 10] }, legN: { to: [60, 80], bend: -1, f: 155 } }, hold: 50, move: 350 },
    { pose: { hip: [52, 64], torso: 30, armN: { a: [90, 90] }, legN: { to: [60, 92], bend: -1, f: 90 } }, hold: 600, move: 600 }]);

  // Split squats and single-leg squats.
  M["split-squat"] = mv(FLOOR, [
    { pose: { hip: [50, 55], torso: 3, head: 0, armN: { a: [182, 178] }, legN: { to: [70, 92], bend: -1, f: 90 }, legF: { to: [30, 90], bend: -1, f: 150 } }, hold: 300, move: 1000 },
    { pose: { hip: [48, 72], torso: 5 }, hold: 250, move: 1000 }]);
  const bss = { hip: [47, 53], torso: 4, head: 0, armN: { a: [184, 178] }, legN: { to: [64, 91], bend: -1, f: 92 }, legF: { to: [24, 66], bend: -1, f: 262 } };
  M["bulgarian"] = mv({ view: "0 0 120 110", props: [{ floor: FL }, { box: [4, 70, 26, 25] }] }, [{ pose: bss, hold: 300, move: 1100 }, { pose: { hip: [44, 70], torso: 8 }, hold: 300, move: 1000 }]);
  M["bulgarian-deficit"] = mv({ view: "0 0 120 110", props: [{ floor: FL }, { box: [4, 70, 26, 25] }, { box: [56, 89, 20, 6] }] },
    [{ pose: X(bss, { hip: [47, 51], legN: { to: [64, 85], bend: -1, f: 92 } }), hold: 300, move: 1100 }, { pose: { hip: [44, 69], torso: 9 }, hold: 300, move: 1100 }]);
  const shrimpTop = { hip: [58, 50], torso: 0, head: 0, armN: { a: [150, 120] }, legN: { to: [60, 92], bend: -1, f: 90 }, legF: { a: [190, 300], f: 300 } };
  M["shrimp"] = mv(FLOOR, [{ pose: shrimpTop, hold: 300, move: 1300 }, { pose: { hip: [50, 74], torso: 30, armN: { a: [80, 80] }, legF: { a: [200, 290], f: 300 } }, hold: 300, move: 1300 }]);
  M["shrimp-assisted"] = mv(FLOOR, [{ pose: X(shrimpTop, { armN: { to: [96, 54], bend: 1 } }), hold: 300, move: 1300 }, { pose: { hip: [50, 74], torso: 30, legF: { a: [200, 290], f: 300 } }, hold: 300, move: 1300 }],
    { props: [{ floor: FL }, { post: [98, 30, FL] }] });

  // Calf raises.
  const calf = (ank, toeUp, extra, props) => mv({ view: "0 0 120 110", props: props || [{ floor: FL }] }, [
    { pose: X({ hip: [ank[0], ank[1] - 42], torso: 0, head: 0, armN: { a: [182, 178] }, legN: { to: ank, bend: -1, f: 90 } }, extra), hold: 300, move: 700 },
    { pose: { hip: [toeUp[0], toeUp[1] - 42], legN: { to: toeUp, bend: -1, f: 140 } }, hold: 400, move: 800 }]);
  M["calf-raise"] = calf([60, 92], [59, 87.4]);
  M["calf-raise-step"] = mv({ view: "0 -12 120 112", props: [{ floor: FL }, { box: [30, 80, 33, 15] }] }, [
    { pose: { hip: [57.8, 41.5], torso: 0, head: 0, armN: { a: [182, 178] }, legN: { to: [57.8, 83.5], bend: -1, f: 45 } }, hold: 300, move: 900 },
    { pose: { hip: [58.6, 32.5], legN: { to: [58.6, 74.5], bend: -1, f: 140 } }, hold: 400, move: 900 }]);
  M["calf-raise-single"] = mv({ view: "0 -12 120 112", props: [{ floor: FL }, { box: [30, 80, 33, 15] }] }, [
    { pose: { hip: [57.8, 41.5], torso: 0, head: 0, armN: { a: [182, 178] }, legN: { to: [57.8, 83.5], bend: -1, f: 45 }, legF: { a: [186, 250], f: 330 } }, hold: 300, move: 900 },
    { pose: { hip: [58.6, 32.5], legN: { to: [58.6, 74.5], bend: -1, f: 140 } }, hold: 400, move: 900 }]);
  M["pogo-hops"] = mv(TALL, [
    { pose: { hip: [60, 47], torso: 0, head: 0, armN: { a: [170, 150] }, legN: { to: [60, 88], bend: -1, f: 140 }, legF: { a: [186, 250], f: 330 } }, hold: 40, move: 230 },
    { pose: { hip: [60, 38], legN: { to: [60, 80], bend: -1, f: 155 } }, hold: 40, move: 230 }]);

  // Sissy squats: up on the toes, knees travel forward, body leans back in one line.
  const sissy = (assist, depth) => {
    const base = { hip: [60, 44], torso: 0, head: 0, armN: assist ? { to: [92, 52], bend: 1 } : { a: [90, 90] }, legN: { to: [60, 86], bend: -1, f: 135 } };
    return mv({ view: "0 0 120 110", props: assist ? [{ floor: FL }, { post: [94, 30, FL] }] : [{ floor: FL }] }, [
      { pose: base, hold: 300, move: 1200 },
      { pose: { hip: depth === "full" ? [63, 70] : [62, 58], torso: depth === "full" ? -32 : -20 }, hold: 300, move: 1200 }]);
  };
  M["sissy-assisted-partial"] = sissy(true, "partial");
  M["sissy-assisted"] = sissy(true, "full");
  M["sissy-partial"] = sissy(false, "partial");
  M["sissy"] = sissy(false, "full");

  // Horse stance, seen from the front.
  const HORSE = { view: "0 0 120 110", front: true, props: [{ floor: FL }] };
  const horse = hipY => mv(HORSE, [
    { pose: { hip: [60, 51], torso: 0, head: 0, armN: { to: [70, 66], bend: -1 }, armF: { to: [50, 66], bend: 1 }, legN: { to: [72, 92], bend: -1 }, legF: { to: [48, 92], bend: 1 } }, hold: 400, move: 1000 },
    { pose: { hip: [60, hipY], armN: { to: [70, hipY + 2], bend: -1 }, armF: { to: [50, hipY + 2], bend: 1 }, legN: { to: [86, 92], bend: -1 }, legF: { to: [34, 92], bend: 1 } }, hold: 1600, move: 1000 }]);
  M["horse-stance-high"] = horse(62);
  M["horse-stance"] = horse(70);

  // L-sit family, on parallettes.
  const PARA = { view: "0 0 120 110", props: [{ floor: FL }, { bar: [47, 63, 84] }, { post: [49, 84, FL] }, { post: [61, 84, FL] }] };
  const support = { hip: [58, 83], torso: -6, head: 0, armN: { to: [55, 84], bend: -1 } };
  const tuckLegs = { legN: { a: [45, 170], point: true }, legF: { a: [48, 172], point: true } };
  const lLegs = { legN: { a: [90, 90], point: true }, legF: { a: [92, 92], point: true } };
  M["l-sit-foot"] = mv(PARA, [{ pose: X(support, { hip: [58, 86], legN: { a: [93, 93], point: true }, legF: { a: [94, 94], point: true } }), hold: 500, move: 800 },
    { pose: { hip: [58, 83], legN: { a: [97, 97], point: true }, legF: { a: [98, 98], point: true } }, hold: 1400, move: 800 }]);
  M["tuck-l-sit"] = mv(PARA, [{ pose: X(support, { hip: [58, 86] }, tuckLegs, { legN: { a: [60, 150], point: true }, legF: { a: [62, 152], point: true } }), hold: 400, move: 800 }, { pose: X({ hip: [58, 83] }, tuckLegs), hold: 1500, move: 800 }]);
  M["one-leg-l-sit"] = mv(PARA, [{ pose: X(support, tuckLegs), hold: 400, move: 800 }, { pose: { legN: { a: [90, 90], point: true }, legF: { a: [48, 172], point: true } }, hold: 1500, move: 800 }]);
  M["l-sit"] = mv(PARA, [{ pose: X(support, tuckLegs), hold: 500, move: 800 }, { pose: lLegs, hold: 1500, move: 800 }]);
  M["v-sit"] = mv(PARA, [{ pose: X(support, lLegs), hold: 500, move: 900 }, { pose: { torso: -22, hip: [57, 84], legN: { a: [48, 48], point: true }, legF: { a: [50, 50], point: true } }, hold: 1300, move: 900 }]);

  // Seated pike lifts: sitting on the floor, legs straight ahead.
  const seat = (shLean, hands, extra) => X({ hip: [40, 90], torso: shLean, head: 0, armN: { to: hands, bend: 1 }, legN: { a: [90, 90], point: true }, legF: { a: [91, 91], point: true } }, extra);
  const liftKeys = (base, liftLegs, hold = 500) => [{ pose: base, hold: 400, move: 600 }, { pose: liftLegs, hold, move: 600 }];
  M["pike-lift"] = mv(FLOOR, liftKeys(seat(10, [44, 94]), { legN: { a: [80, 80], point: true }, legF: { a: [81, 81], point: true } }));
  M["pike-lift-knees"] = mv(FLOOR, liftKeys(seat(40, [62, 94]), { legN: { a: [82, 82], point: true }, legF: { a: [83, 83], point: true } }));
  M["pike-lift-ankles"] = mv(FLOOR, liftKeys(seat(65, [78, 94]), { legN: { a: [83, 83], point: true }, legF: { a: [84, 84], point: true } }));
  M["pike-lift-hold"] = mv(FLOOR, liftKeys(seat(10, [44, 94]), { legN: { a: [80, 80], point: true }, legF: { a: [81, 81], point: true } }, 2200));
  M["pike-lift-single"] = mv(FLOOR, liftKeys(seat(10, [44, 94]), { legN: { a: [78, 78], point: true } }));
  M["seated-tuck-lift"] = mv(FLOOR, [{ pose: seat(-10, [32, 94], { legN: { a: [60, 125] }, legF: { a: [62, 127] } }), hold: 400, move: 700 },
    { pose: { legN: { a: [40, 120], point: true }, legF: { a: [42, 122], point: true } }, hold: 600, move: 700 }]);

  // ================= Ready-made library =================

  // Handstand work.
  M["pike-hold-box"] = mv(TALL, [
    { pose: { hip: [52, 52], torso: 150, head: 0, armN: { to: [62, 94], bend: 1 }, legN: { to: [20, 40], straight: true, f: 180 } }, hold: 400, move: 1200 },
    { pose: { hip: [62, 40], torso: 180, legN: { to: [20, 40], straight: true, f: 180 } }, hold: 1600, move: 1100 }], { props: [{ floor: FL }, { box: [-6, 44, 30, 51] }] });
  M["wall-walk"] = mv(TALL, [
    { pose: X(line([16, 89], [78, 66], 160), { armN: { to: [78, 94], bend: 1 }, legN: { to: [16, 89], bend: 1, f: 160 } }), hold: 400, move: 1300 },
    { pose: { hip: [40, 42], torso: 150, armN: { to: [56, 94], bend: 1 }, legN: { to: [16, 58], bend: 1, f: 0 } }, hold: 300, move: 1300 },
    { pose: { hip: [24, 40], torso: 180, armN: { to: [24, 94], bend: 1 }, legN: { to: [18, -1], bend: 1, f: 0 } }, hold: 1200, move: 1600 }], { props: [{ floor: FL }, { wall: 12 }] });
  M["kick-up"] = mv(TALL, [
    { pose: { hip: [44, 50], torso: 0, head: 0, armN: { to: [46, -2], bend: -1 }, legN: { to: [46, 92], bend: -1, f: 90 }, legF: { to: [42, 92], bend: -1, f: 90 } }, hold: 400, move: 800 },
    { pose: { hip: [52, 56], torso: 125, head: -30, armN: { to: [74, 94], bend: -1 }, legN: { to: [58, 92], bend: -1, f: 90 }, legF: { to: [30, 90], bend: -1, f: 150 } }, hold: 150, move: 500 },
    { pose: { hip: [70, 44], torso: 175, armN: { to: [74, 94], bend: -1 }, legN: { to: [62, 74], bend: -1, f: 160 }, legF: { to: [88, 8], bend: -1, f: 20 } }, hold: 80, move: 500 },
    { pose: { hip: [74, 40], torso: 180, head: 0, legN: { to: [74, -2], bend: -1, f: 0 }, legF: { to: [76, -2], bend: -1, f: 0 } }, hold: 1200, move: 900 }]);
  M["handstand-walk"] = mv(TALL, [
    { pose: X(hsTop, { armN: { to: [60, 94], bend: -1 }, armF: { to: [66, 89], bend: -1 } }), hold: 150, move: 450 },
    { pose: { hip: [64, 40], armN: { to: [68, 89], bend: -1 }, armF: { to: [66, 94], bend: -1 } }, hold: 150, move: 450 }]);

  // Planche and elbow lever.
  M["planche-lean"] = mv(FLOOR, [{ pose: X(line([16, 89], [80, 68], 165), { armN: { to: [76, 94], straight: true } }), hold: 300, move: 1000 },
    { pose: X(line([16, 89], [88, 67], 165), { armN: { to: [76, 94], straight: true } }), hold: 1500, move: 1000 }]);
  const plBase = { sh: [70, 67], torso: 90, head: -10, armN: { to: [62, 94], straight: true } };
  M["adv-tuck-planche"] = mv(FLOOR, [{ pose: X(plBase, { legN: { a: [160, 255], point: true }, legF: { a: [163, 258], point: true } }) }]);
  M["full-planche"] = mv(FLOOR, [{ pose: X(plBase, { legN: { a: [115, 250], point: true }, legF: { a: [118, 253], point: true } }), hold: 400, move: 1200 },
    { pose: { legN: { a: [268, 268], point: true }, legF: { a: [272, 272], point: true } }, hold: 1500, move: 1200 }]);
  const elbow = { sh: [72, 78], torso: 90, head: 0, armN: { to: [62, 94], bend: 1 } };
  M["elbow-lever-lean"] = mv(FLOOR, [{ pose: X(elbow, { torso: 75, legN: { to: [10, 92], straight: true, f: 165 } }) }]);
  M["elbow-lever-tuck"] = mv(FLOOR, [{ pose: X(elbow, { legN: { a: [170, 280], point: true }, legF: { a: [172, 282], point: true } }) }]);
  M["elbow-lever"] = mv(FLOOR, [{ pose: X(elbow, { legN: { a: [170, 280], point: true }, legF: { a: [172, 282], point: true } }), hold: 400, move: 1100 },
    { pose: { legN: { a: [270, 270], point: true }, legF: { a: [272, 272], point: true } }, hold: 1500, move: 1100 }]);

  // Rings.
  M["ring-push-up-incline"] = X(M["push-up-incline"], { props: [{ floor: FL }], rings: -12, _keys: null });
  M["ring-push-up"] = mv(FLOOR, [{ pose: X(line([21, 89], [85, 60], 165), { armN: { to: [85, 88], bend: 1 } }), hold: 300, move: 1100 },
    { pose: X(line([21, 89], [89, 80], 165), { armN: { to: [85, 88], bend: 1 } }), hold: 250, move: 1000 }], { rings: -12 });

  // Muscle-up.
  const MU = { view: "0 -36 120 154", props: [{ bar: [30, 90, BAR] }] };
  const muHang = X({ sh: [60, 42], torso: 0, armN: arm }, hangLegs);
  const muPull = { sh: [52, 10], torso: -20 };
  const muTurn = { sh: [64, 4], torso: 30 };
  const muTop = { sh: [61, -12], torso: 8 };
  M["explosive-pull"] = mv(MU, [{ pose: muHang, hold: 300, move: 600 }, { pose: { sh: [54, 2], torso: -28 }, hold: 150, move: 800 }]);
  M["muscle-up"] = mv(MU, [{ pose: muHang, hold: 400, move: 700 }, { pose: muPull, hold: 60, move: 350 }, { pose: muTurn, hold: 60, move: 450 }, { pose: muTop, hold: 700, move: 1500 }]);
  M["muscle-up-strict"] = mv(MU, [{ pose: muHang, hold: 400, move: 1100 }, { pose: muPull, hold: 100, move: 700 }, { pose: muTurn, hold: 100, move: 800 }, { pose: muTop, hold: 700, move: 1600 }]);
  M["muscle-up-band"] = X(M["muscle-up"], { band: [60, BAR], _keys: null });
  M["muscle-up-negative"] = mv(MU, [{ pose: X(muHang, muTop), hold: 500, move: 1200 }, { pose: muTurn, hold: 100, move: 1200 }, { pose: muPull, hold: 100, move: 1600 },
    { pose: { sh: [60, 42], torso: 0 }, hold: 300, move: 1200 }]);

  // Front lever: body horizontal under the bar, face up.
  const FLV = { view: "0 0 120 100", props: [{ bar: [50, 110, 30] }] };
  const fl = { sh: [74, 56.5], torso: 90, head: 0, armN: { to: [80, 30], straight: true } };
  M["fl-tuck"] = mv(FLV, [{ pose: X(fl, { legN: { a: [55, 235], point: true }, legF: { a: [58, 238], point: true } }) }]);
  M["fl-adv-tuck"] = mv(FLV, [{ pose: X(fl, { legN: { a: [150, 250], point: true }, legF: { a: [153, 253], point: true } }) }]);
  M["fl-one-leg"] = mv(FLV, [{ pose: X(fl, { legN: { a: [270, 270], point: true }, legF: { a: [58, 238], point: true } }) }]);
  M["fl-full"] = mv(FLV, [{ pose: X(fl, { legN: { a: [55, 235], point: true }, legF: { a: [58, 238], point: true } }), hold: 400, move: 1200 },
    { pose: { legN: { a: [270, 270], point: true }, legF: { a: [272, 272], point: true } }, hold: 1500, move: 1200 }]);
  M["fl-raise"] = mv({ view: "0 0 120 132", props: [{ bar: [50, 110, 30] }] }, [
    { pose: { sh: [80, 58], torso: 0, head: 0, armN: { to: [80, 30], straight: true }, legN: { a: [180, 180], point: true }, legF: { a: [182, 182], point: true } }, hold: 300, move: 1400 },
    { pose: X(fl, { legN: { a: [270, 270], point: true }, legF: { a: [272, 272], point: true } }), hold: 500, move: 1600 }]);

  // Back lever: body horizontal, face down, arms behind.
  const BLV = { view: "0 0 120 100", props: [{ bar: [30, 90, 30] }] };
  const bl = { sh: [44, 56], torso: 270, head: 0, armN: { to: [60, 30], straight: true } };
  M["bl-tuck"] = mv(BLV, [{ pose: X(bl, { legN: { a: [220, 110], point: true }, legF: { a: [223, 113], point: true } }) }]);
  M["bl-adv-tuck"] = mv(BLV, [{ pose: X(bl, { legN: { a: [180, 90], point: true }, legF: { a: [183, 93], point: true } }) }]);
  M["bl-full"] = mv(BLV, [{ pose: X(bl, { legN: { a: [220, 110], point: true }, legF: { a: [223, 113], point: true } }), hold: 400, move: 1200 },
    { pose: { legN: { a: [90, 90], point: true }, legF: { a: [92, 92], point: true } }, hold: 1500, move: 1200 }]);
  const stcHang = X({ sh: [60, 42], torso: 0, head: 0, armN: armS }, { legN: { a: [180, 180], point: true }, legF: { a: [182, 182], point: true } });
  const stcTuck = { torso: -10, legN: { a: [30, 170], point: true }, legF: { a: [32, 172], point: true } };
  const stcInv = { torso: -175, legN: { a: [-140, 0], point: true }, legF: { a: [-138, 2], point: true } };
  const german = { sh: [60, 44], torso: -330, legN: { a: [-160, -160], point: true }, legF: { a: [-158, -158], point: true } };
  M["skin-the-cat"] = mv(HANG, [{ pose: stcHang, hold: 300, move: 900 }, { pose: stcTuck, hold: 100, move: 1000 }, { pose: stcInv, hold: 100, move: 1100 },
    { pose: german, hold: 900, move: 1100 }, { pose: stcInv, hold: 100, move: 1000 }, { pose: stcTuck, hold: 100, move: 900 }]);
  M["german-hang"] = mv(HANG, [{ pose: X(stcHang, german) }]);

  // Human flag and side planks, seen from the front.
  const FLAGV = { view: "0 0 150 105", front: true, props: [{ floor: FL }, { vbar: [40, 0, FL] }] };
  const flag = { sh: [66, 44], torso: 270, head: 0, armN: { to: [40, 30], straight: true }, armF: { to: [40, 58], straight: true } };
  M["flag-vertical"] = mv({ view: "0 -26 150 131", front: true, props: [{ floor: FL }, { vbar: [40, -26, FL] }] },
    [{ pose: { sh: [56, 66], torso: 180, head: 0, armN: { to: [40, 82], straight: true }, armF: { to: [40, 52], straight: true }, legN: { a: [4, 4], point: true }, legF: { a: [-4, -4], point: true } } }]);
  M["flag-tuck"] = mv(FLAGV, [{ pose: X(flag, { legN: { a: [30, 150], point: true }, legF: { a: [40, 150], point: true } }) }]);
  M["flag-straddle"] = mv(FLAGV, [{ pose: X(flag, { legN: { a: [60, 60], point: true }, legF: { a: [120, 120], point: true } }) }]);
  M["flag"] = mv(FLAGV, [{ pose: X(flag, { legN: { a: [30, 150], point: true }, legF: { a: [40, 150], point: true } }), hold: 400, move: 1200 },
    { pose: { legN: { a: [88, 88], point: true }, legF: { a: [92, 92], point: true } }, hold: 1500, move: 1200 }]);
  const SIDEV = { view: "0 0 120 110", front: true, props: [{ floor: FL }] };
  const sidePl = { hip: [53.9, 77], torso: 72, head: 0, armN: { a: [180, 90] }, armF: { a: [0, 0] }, legN: { a: [252, 252] }, legF: { a: [252, 252] } };
  M["side-plank"] = mv(SIDEV, [{ pose: X(sidePl, { hip: [52, 86], torso: 80 }), hold: 400, move: 900 }, { pose: { hip: [53.9, 77], torso: 72 }, hold: 1600, move: 900 }]);
  M["side-plank-leg"] = mv(SIDEV, [{ pose: sidePl, hold: 400, move: 800 }, { pose: { legF: { a: [300, 300] } }, hold: 1400, move: 800 }]);
  M["copenhagen"] = mv({ view: "0 0 120 110", front: true, props: [{ floor: FL }, { box: [-4, 58, 28, 37] }] }, [
    { pose: { hip: [55.4, 65.3], torso: 100, head: 0, armN: { a: [180, 90] }, armF: { a: [0, 0] }, legN: { a: [220, 190] }, legF: { a: [280, 280] } } }]);

  // Pulling accessories.
  M["band-pull-apart"] = mv({ view: "0 0 120 110", front: true, props: [{ floor: FL }] }, [
    { pose: { hip: [60, 50], torso: 0, head: 0, armN: { to: [63, 38], straight: true }, armF: { to: [57, 38], straight: true }, legN: { to: [64, 92], bend: -1 }, legF: { to: [56, 92], bend: 1 } }, hold: 300, move: 900 },
    { pose: { armN: { to: [92, 26], straight: true }, armF: { to: [28, 26], straight: true } }, hold: 500, move: 900 }]);
  M["band-face-pull"] = mv({ view: "0 0 120 110", props: [{ floor: FL }, { post: [106, 20, FL] }] }, [
    { pose: X(stand, { hip: [52, 50], legN: { to: [52, 92], bend: -1, f: 90 }, armN: { to: [80, 30], bend: -1 } }), hold: 300, move: 900 },
    { pose: { armN: { to: [64, 30], bend: -1 } }, hold: 500, move: 900 }], { band: [106, 30], bandTo: "hand" });
  const curl = (hand, ankle, props) => X(row(hand, ankle, props, { bend: -1, top: 14 }), { rings: 0 });
  M["ring-curl-high"] = curl([45, 20], [14, 91], [{ floor: FL }]);
  M["ring-curl"] = curl([64, 36], [14, 91], [{ floor: FL }]);
  M["ring-curl-low"] = curl([84, 58], [14, 91], [{ floor: FL }]);
  M["ring-face-pull-high"] = X(row([45, 20], [14, 91], [{ floor: FL }], { top: 16 }), { rings: 0 });
  M["ring-face-pull-low"] = X(row([84, 58], [14, 91], [{ floor: FL }], { top: 14 }), { rings: 0 });

  // Single-leg squats.
  const pistolTop = { hip: [58, 50], torso: 0, head: 0, armN: { a: [90, 90] }, legN: { to: [60, 92], bend: -1, f: 90 }, legF: { a: [150, 170], point: true } };
  M["pistol"] = mv(FLOOR, [{ pose: pistolTop, hold: 300, move: 1300 }, { pose: { hip: [50, 82], torso: 35, legF: { a: [92, 92], point: true } }, hold: 300, move: 1300 }]);
  M["pistol-negative"] = mv(FLOOR, [{ pose: pistolTop, hold: 300, move: 2800 }, { pose: { hip: [50, 82], torso: 35, legF: { a: [92, 92], point: true } }, hold: 200, move: 900 }]);
  M["box-pistol"] = mv(FLOOR, [{ pose: pistolTop, hold: 300, move: 1300 }, { pose: { hip: [42, 70], torso: 25, legF: { a: [95, 95], point: true } }, hold: 400, move: 1300 }],
    { props: [{ floor: FL }, { box: [22, 74, 22, 21] }] });
  M["pistol-assisted"] = mv(FLOOR, [{ pose: X(pistolTop, { armN: { to: [96, 54], bend: 1 } }), hold: 300, move: 1300 }, { pose: { hip: [50, 82], torso: 35, legF: { a: [92, 92], point: true } }, hold: 300, move: 1300 }],
    { props: [{ floor: FL }, { post: [98, 30, FL] }] });
  M["cossack"] = mv({ view: "0 0 120 110", front: true, props: [{ floor: FL }] }, [
    { pose: { hip: [60, 58], torso: 0, head: 0, armN: { to: [66, 46], straight: true }, armF: { to: [54, 46], straight: true }, legN: { to: [88, 92], bend: -1, f: 90 }, legF: { to: [32, 92], bend: 1 } }, hold: 300, move: 1000 },
    { pose: { hip: [48, 78], torso: -6, armN: { to: [56, 64], straight: true }, armF: { to: [44, 64], straight: true }, legN: { to: [88, 92], bend: -1, f: 10 } }, hold: 400, move: 1000 },
    { pose: { hip: [60, 58], torso: 0, armN: { to: [66, 46], straight: true }, armF: { to: [54, 46], straight: true }, legN: { to: [88, 92], bend: -1, f: 90 }, legF: { to: [32, 92], bend: 1 } }, hold: 300, move: 1000 },
    { pose: { hip: [72, 78], torso: 6, armN: { to: [76, 64], straight: true }, armF: { to: [64, 64], straight: true }, legF: { to: [32, 92], bend: 1, f: 350 } }, hold: 400, move: 1000 }]);

  // Lunges, squats and wall sits.
  const standTall = { hip: [50, 50], torso: 0, head: 0, armN: { a: [182, 178] }, armF: { a: [178, 182] }, legN: { to: [52, 92], bend: -1, f: 90 }, legF: { to: [48, 92], bend: -1, f: 90 } };
  M["forward-lunge"] = mv(FLOOR, [{ pose: standTall, hold: 300, move: 900 },
    { pose: { hip: [58, 70], torso: 4, legN: { to: [80, 92], bend: -1, f: 90 }, legF: { to: [34, 90], bend: -1, f: 150 } }, hold: 300, move: 900 }]);
  M["reverse-lunge"] = mv(FLOOR, [{ pose: standTall, hold: 300, move: 900 },
    { pose: { hip: [44, 70], torso: 4, legN: { to: [60, 92], bend: -1, f: 90 }, legF: { to: [18, 90], bend: -1, f: 150 } }, hold: 300, move: 900 }]);
  M["box-squat"] = mv(FLOOR, [{ pose: stand, hold: 300, move: 1100 }, { pose: { hip: [42, 70], torso: 30, armN: { a: [90, 90] } }, hold: 400, move: 1100 }], { props: [{ floor: FL }, { box: [22, 74, 24, 21] }] });
  M["deep-squat-hold"] = mv(FLOOR, [{ pose: { hip: [50, 84], torso: 25, head: 0, armN: { a: [110, 90] }, legN: { to: [60, 92], bend: -1, f: 90 } } }]);
  const wallSit = (hipY, ank, single) => mv({ view: "0 0 120 110", props: [{ floor: FL }, { wall: 30 }] }, [
    { pose: { hip: [36, 50], torso: 0, head: 0, armN: { a: [182, 178] }, legN: { to: [40, 92], bend: -1, f: 90 } }, hold: 300, move: 1100 },
    { pose: X({ hip: [36, hipY], armN: { a: [150, 150] }, legN: { to: ank, bend: -1, f: 90 } }, single ? { legF: { a: [90, 90] } } : { legF: { to: ank, bend: -1, f: 90 } }), hold: 1600, move: 1100 }]);
  M["wall-sit-high"] = wallSit(62, [52, 92]);
  M["wall-sit"] = wallSit(70, [58, 92]);
  M["wall-sit-single"] = wallSit(70, [58, 92], true);

  // Hamstrings and glutes.
  const nordicUp = X(kneel([40, 92], [40, 45], 180), { head: 0, armN: { a: [160, 150] } });
  const nordicDown = X(kneel([40, 92], [86, 80], 180), { armN: { a: [150, 150] } });
  const NORDV = { view: "0 0 120 110", props: [{ floor: FL }, { box: [6, 80, 16, 7] }] };
  M["nordic-negative"] = mv(NORDV, [{ pose: nordicUp, hold: 400, move: 3000 }, { pose: X(nordicDown, { armN: { to: [96, 94], bend: 1 } }), hold: 200, move: 900 }]);
  M["nordic"] = mv(NORDV, [{ pose: nordicUp, hold: 300, move: 2400 }, { pose: nordicDown, hold: 200, move: 2400 }]);
  const hamBridge = { sh: [78, 88], torso: 120.3, head: 0, armN: { a: [270, 270] }, legN: { to: [36, 90], bend: 1, f: 0 } };
  M["ham-walkout"] = mv(FLOOR, [{ pose: hamBridge, hold: 300, move: 1300 }, { pose: { torso: 104, legN: { to: [18, 90], bend: 1, f: 0 } }, hold: 300, move: 1300 }]);
  M["ham-curl"] = mv(FLOOR, [{ pose: X(hamBridge, { torso: 104, legN: { to: [18, 90], bend: 1, f: 0 } }), hold: 200, move: 1100 }, { pose: { torso: 120.3, legN: { to: [36, 90], bend: 1, f: 0 } }, hold: 300, move: 1100 }]);
  M["glute-bridge-feet-up"] = mv(FLOOR, [
    { pose: { sh: [78, 88], torso: 90, armN: { a: [270, 270] }, legN: { to: [30, 77], bend: 1, f: footFlat } }, hold: 300, move: 900 },
    { pose: { torso: 112 }, hold: 700, move: 900 }], { props: [{ floor: FL }, { box: [16, 80, 24, 15] }] });
  M["single-leg-glute-bridge"] = mv(FLOOR, [
    { pose: { sh: [78, 88], torso: 90, armN: { a: [270, 270] }, legN: { to: [36, 90], bend: 1, f: footFlat }, legF: { a: [-45, -45], point: true } }, hold: 300, move: 900 },
    { pose: { torso: 120.3 }, hold: 700, move: 900 }]);
  const thrust = (single) => mv({ view: "0 0 120 110", props: [{ floor: FL }, { box: [70, 72, 40, 23] }] }, [
    { pose: X({ sh: [76, 70], torso: 54, head: 0, armN: { a: [100, 100] }, legN: { to: [30, 91], bend: 1, f: footFlat } }, single ? { legF: { a: [-60, -60], point: true } } : {}), hold: 300, move: 1000 },
    { pose: { torso: 90, head: 10 }, hold: 600, move: 1000 }]);
  M["hip-thrust"] = thrust(false);
  M["single-leg-hip-thrust"] = thrust(true);
  const sld = { hip: [56, 50], torso: 0, head: 0, armN: { a: [180, 180] }, legN: { to: [58, 92], bend: -1, f: 90 }, legF: { a: [186, 186], f: 120 } };
  M["sl-deadlift"] = mv(FLOOR, [{ pose: sld, hold: 300, move: 1200 }, { pose: { hip: [52, 52], torso: 95, legF: { a: [275, 275], f: 270 } }, hold: 400, move: 1200 }]);
  M["sl-deadlift-reach"] = mv(FLOOR, [{ pose: sld, hold: 300, move: 1300 }, { pose: { hip: [50, 54], torso: 118, legN: { to: [58, 92], bend: -1, f: 90 }, legF: { a: [285, 285], f: 270 } }, hold: 400, move: 1300 }]);
  const stepUp = top => mv({ view: "0 -12 120 112", props: [{ floor: FL }, { box: [62, top, 40, FL - top] }] }, [
    { pose: { hip: [46, 50], torso: 0, head: 0, armN: { a: [182, 178] }, legN: { to: [48, 92], bend: -1, f: 90 }, legF: { to: [44, 92], bend: -1, f: 90 } }, hold: 300, move: 700 },
    { pose: { hip: [50, 52], torso: 10, legN: { to: [72, top - 3], bend: -1, f: 90 } }, hold: 200, move: 900 },
    { pose: { hip: [72, top - 45], torso: 0, legN: { to: [74, top - 3], bend: -1, f: 90 }, legF: { to: [70, top - 3], bend: -1, f: 90 } }, hold: 500, move: 900 },
    { pose: { hip: [64, top - 40], torso: 5, legF: { to: [44, 92], bend: -1, f: 90 } }, hold: 200, move: 700 }]);
  M["step-up-low"] = stepUp(82);
  M["step-up"] = stepUp(72);
  M["step-up-high"] = stepUp(64);
  M["reverse-nordic"] = mv(FLOOR, [{ pose: X(kneel([50, 92], [50, 45], 300), { head: 0, armN: { a: [90, 90] } }), hold: 300, move: 1300 }, { pose: kneel([50, 92], [24, 56], 300), hold: 300, move: 1300 }]);
  M["reverse-nordic-partial"] = mv(FLOOR, [{ pose: X(kneel([50, 92], [50, 45], 300), { head: 0, armN: { a: [90, 90] } }), hold: 300, move: 1000 }, { pose: kneel([50, 92], [36, 50], 300), hold: 300, move: 1000 }]);
  M["tibialis"] = mv({ view: "0 0 120 110", props: [{ floor: FL }, { wall: 34 }] }, [
    { pose: X(line([60, 90], [38, 24], 100), { head: 0, armN: { a: [176, 176] } }), hold: 200, move: 600 },
    { pose: line([60, 90], [38, 24], 35), hold: 300, move: 600 }]);

  // Core.
  const lying = { hip: [50, 90], torso: 90, head: 0, armN: { a: [80, 80] }, legN: { a: [-90, -90], point: true } };
  M["lying-leg-raise"] = mv(FLOOR, [{ pose: lying, hold: 200, move: 1100 }, { pose: { legN: { a: [0, 0], point: true } }, hold: 300, move: 1300 }]);
  M["reverse-crunch"] = mv(FLOOR, [{ pose: X(lying, { legN: { a: [-10, -95], point: true } }), hold: 200, move: 900 },
    { pose: { hip: [54, 84], torso: 112, legN: { a: [-40, -130], point: true } }, hold: 300, move: 900 }]);
  const dfArms = { armN: { to: [96, 92], bend: -1 } };
  M["dragon-flag-tuck"] = mv(FLOOR, [{ pose: X({ sh: [80, 90], torso: 180, head: 0, legN: { a: [-20, -150], point: true } }, dfArms), hold: 300, move: 1200 },
    { pose: { torso: 130, legN: { a: [-70, -170], point: true } }, hold: 400, move: 1200 }]);
  M["dragon-flag"] = mv(FLOOR, [{ pose: X({ sh: [80, 90], torso: 180, head: 0, legN: { a: [0, 0], point: true } }, dfArms), hold: 300, move: 1500 },
    { pose: { torso: 105, legN: { a: [-75, -75], point: true } }, hold: 300, move: 1500 }]);
  M["dragon-flag-negative"] = mv(FLOOR, [{ pose: X({ sh: [80, 90], torso: 180, head: 0, legN: { a: [0, 0], point: true } }, dfArms), hold: 400, move: 3000 },
    { pose: { torso: 105, legN: { a: [-75, -75], point: true } }, hold: 200, move: 1000 }]);
  M["dragon-flag-one-leg"] = mv(FLOOR, [{ pose: X({ sh: [80, 90], torso: 180, head: 0, legN: { a: [0, 0], point: true }, legF: { a: [-60, -170], point: true } }, dfArms), hold: 300, move: 1500 },
    { pose: { torso: 112, legN: { a: [-68, -68], point: true }, legF: { a: [-130, -220], point: true } }, hold: 300, move: 1500 }]);
  const quad = { hip: [44, 66], torso: 90, head: 0, armN: { to: [70, 94], straight: true }, legN: { a: [180, 270], f: 300 } };
  M["bird-dog"] = mv(FLOOR, [{ pose: quad, hold: 200, move: 800 },
    { pose: { armN: { to: [97, 62], straight: true }, armF: { to: [70, 94], straight: true }, legN: { a: [180, 270], f: 300 }, legF: { a: [270, 270], point: true } }, hold: 600, move: 800 },
    { pose: { armN: { to: [70, 94], straight: true }, armF: { to: [70, 94], straight: true }, legN: { a: [180, 270], f: 300 }, legF: { a: [180, 270], f: 300 } }, hold: 200, move: 800 },
    { pose: { armN: { to: [70, 94], straight: true }, armF: { to: [97, 62], straight: true }, legN: { a: [270, 270], point: true }, legF: { a: [180, 270], f: 300 } }, hold: 600, move: 800 }]);
  const prone = { hip: [50, 90], torso: 90, head: 0, armN: { a: [90, 90] }, legN: { a: [270, 270], point: true } };
  const superman = { torso: 82, armN: { a: [76, 76] }, legN: { a: [262, 262], point: true } };
  M["superman"] = mv(FLOOR, [{ pose: prone, hold: 300, move: 800 }, { pose: superman, hold: 900, move: 800 }]);
  M["arch-hold"] = mv(FLOOR, [{ pose: X(prone, superman) }]);
  M["arch-rocks"] = mv(FLOOR, [{ pose: X(prone, { hip: [50, 88], torso: 74, armN: { a: [66, 66] }, legN: { a: [268, 268], point: true } }), hold: 50, move: 500 },
    { pose: { hip: [50, 86], torso: 94, armN: { a: [86, 86] }, legN: { a: [250, 250], point: true } }, hold: 50, move: 500 }]);
  M["russian-twist"] = mv({ view: "0 0 120 110", front: true, props: [{ floor: FL }] }, [
    { pose: { hip: [60, 86], torso: -10, head: 4, armN: { to: [46, 66], bend: 1 }, armF: { to: [44, 64], bend: 1 }, legN: { a: [120, 190], point: true }, legF: { a: [240, 170], point: true } }, hold: 150, move: 650 },
    { pose: { torso: 10, head: -4, armN: { to: [76, 64], bend: -1 }, armF: { to: [74, 66], bend: -1 } }, hold: 150, move: 650 }]);
  const FHANG = { view: "0 0 120 118", front: true, props: [{ bar: [30, 90, BAR] }] };
  const fHang = { sh: [60, 42], torso: 0, head: 0, armN: { to: [66, BAR], straight: true }, armF: { to: [54, BAR], straight: true }, legN: { a: [178, 180], point: true }, legF: { a: [182, 180], point: true } };
  M["hanging-oblique"] = mv(FHANG, [{ pose: fHang, hold: 200, move: 800 }, { pose: { torso: -8, legN: { a: [60, 170], point: true }, legF: { a: [70, 170], point: true } }, hold: 300, move: 800 },
    { pose: { torso: 0, legN: { a: [178, 180], point: true }, legF: { a: [182, 180], point: true } }, hold: 200, move: 800 }, { pose: { torso: 8, legN: { a: [290, 190], point: true }, legF: { a: [300, 190], point: true } }, hold: 300, move: 800 }]);

  // Conditioning.
  const bpStand = { hip: [56, 50], torso: 0, head: 0, armN: { to: [58, 78], bend: 1 }, legN: { to: [58, 92], bend: -1, f: 90 } };
  const bpSquat = { hip: [50, 74], torso: 120, armN: { to: [76, 94], bend: 1 }, legN: { to: [58, 92], bend: -1, f: 90 } };
  const bpPlank = X(line([21, 89], [85, 66], 165), { armN: { to: [85, 94], bend: 1 }, legN: { to: [21, 89], bend: 1, f: 165 } });
  const bpAir = { hip: [58, 36], torso: 0, armN: { to: [60, -10], bend: 1 }, legN: { to: [58, 78], bend: -1, f: 155 } };
  M["burpee"] = mv(TALL, [{ pose: bpStand, hold: 200, move: 450 }, { pose: bpSquat, hold: 80, move: 380 }, { pose: bpPlank, hold: 200, move: 380 },
    { pose: bpSquat, hold: 80, move: 380 }, { pose: bpAir, hold: 60, move: 380 }]);
  M["burpee-push-up"] = mv(TALL, [{ pose: bpStand, hold: 200, move: 450 }, { pose: bpSquat, hold: 80, move: 380 }, { pose: bpPlank, hold: 100, move: 600 },
    { pose: X(line([21, 89], [89, 87], 165), { armN: { to: [85, 94], bend: 1 }, legN: { to: [21, 89], bend: 1, f: 165 } }), hold: 100, move: 600 },
    { pose: bpPlank, hold: 100, move: 380 }, { pose: bpSquat, hold: 80, move: 380 }, { pose: bpAir, hold: 60, move: 380 }]);
  const bear = { hip: [46, 64], torso: 92, head: 0, armN: { to: [72, 94], bend: 1 }, legN: { to: [30, 90], bend: -1, f: 165 } };
  M["bear-plank"] = mv(FLOOR, [{ pose: X(bear, { hip: [46, 70], torso: 100, legN: { to: [30, 90], bend: -1, f: 165 } }), hold: 300, move: 900 }, { pose: bear, hold: 1500, move: 900 }]);
  M["bear-crawl"] = mv(FLOOR, [
    { pose: X(bear, { armN: { to: [80, 94], bend: 1 }, armF: { to: [70, 94], bend: 1 }, legN: { to: [28, 90], bend: -1, f: 165 }, legF: { to: [38, 90], bend: -1, f: 165 } }), hold: 100, move: 450 },
    { pose: { hip: [48, 64], armN: { to: [70, 94], bend: 1 }, armF: { to: [80, 94], bend: 1 }, legN: { to: [38, 90], bend: -1, f: 165 }, legF: { to: [28, 90], bend: -1, f: 165 } }, hold: 100, move: 450 }]);
  const mcBase = X(line([21, 89], [85, 66], 165), { armN: { to: [85, 94], straight: true } });
  M["mountain-climber"] = mv(FLOOR, [
    { pose: X(mcBase, { legN: { to: [58, 86], bend: -1, f: 165 }, legF: { to: [21, 89], bend: -1, f: 165 } }), hold: 60, move: 300 },
    { pose: { legN: { to: [21, 89], bend: -1, f: 165 }, legF: { to: [58, 86], bend: -1, f: 165 } }, hold: 60, move: 300 }]);

  return M;
})();

// Which animation each step shows. null = no drawing; the video button still works.
const STEP_ANIM = {
  "scap-pull": ["dead-hang", "active-hang", "scap-pull", "scap-pull-pause", "arch-hang", "one-arm-scap"],
  "pull-ups": ["pull-up-negative", "pull-up-band", "pull-up", "chest-to-bar", "l-sit-pull-up", "archer-pull-up", "one-arm-pull-up"],
  "rows": ["row-incline", "row-horizontal", "row-feet-up", "row-one-arm", "tuck-fl-row", "row-one-arm"],
  "chin-ups": ["pull-up-negative", "pull-up-band", "pull-up", "chest-to-bar", "archer-pull-up", "one-arm-negative"],
  "plank": ["plank-knee", "plank", "plank", "plank-long-lever", "body-saw", "ab-wheel-knee", "ab-wheel-stand"],
  "back-bridge": ["glute-bridge", "reverse-tabletop", "bridge-elevated", "back-bridge", "bridge-straight-leg", "wall-walk-down", "stand-to-bridge"],
  "hanging-leg-raise": ["hang-knee-raise", "hang-tuck-raise", "hanging-leg-raise", "toes-to-bar", "toes-to-bar-strict", null],
  "scap-push": ["scap-push-up-incline", "scap-push-up", "scap-push-up-pause", "pseudo-planche-scap", "tuck-planche-scap"],
  "push-ups": ["push-up-incline", "push-up-knee", "push-up", "push-up", "pseudo-planche-push-up", null, "one-arm-push-up"],
  "dips": ["bench-dip", "support-hold", "dip-negative", "dip", "straight-bar-dip", "ring-dip", "dip"],
  "pike-pu": ["pike-push-up", "pike-push-up-elevated", "pike-push-up-deficit", "wall-handstand", "hspu-negative", "hspu-wall", "hspu-free"],
  "tricep-ext": ["tricep-high", "tricep-high", "tricep-hip", "tricep-low", "tricep-low", "tiger-bend"],
  "frog-stance": ["tripod-tuck", "frog-stance-toes", "frog-stance", "frog-stance", "crane", "tuck-planche"],
  "hollow": ["dead-bug", "hollow-tuck", "hollow-one-leg", "hollow-arms-sides", "hollow", "hollow-rocks", "hollow"],
  "jump-squats": ["air-squat", "squat-jump-stick", "jump-squat", "tuck-jump", "split-jump", "box-jump", "single-leg-jump"],
  "bss": ["split-squat", "bulgarian", "bulgarian-deficit", "bulgarian", "shrimp-assisted", "shrimp"],
  "calf-raises": ["calf-raise", "calf-raise-step", "calf-raise-single", "calf-raise-single", "calf-raise-single", "pogo-hops"],
  "sissy": ["sissy-assisted-partial", "sissy-assisted", "sissy-assisted", "sissy-partial", "sissy", "sissy"],
  "horse-stance": ["horse-stance-high", "horse-stance", "horse-stance", "horse-stance", "horse-stance", "horse-stance"],
  "l-sit": ["l-sit-foot", "tuck-l-sit", "one-leg-l-sit", "l-sit", "l-sit", "v-sit"],
  "pike-lifts": ["seated-tuck-lift", "pike-lift-single", "pike-lift", "pike-lift-knees", "pike-lift-ankles", "pike-lift-hold"],

  "k-handstand": ["pike-hold-box", "wall-walk", "wall-handstand", "wall-handstand", "kick-up", "handstand", "handstand-walk"],
  "k-planche": ["planche-lean", "tuck-planche", "adv-tuck-planche", "full-planche", "full-planche"],
  "k-elbow-lever": ["elbow-lever-lean", "elbow-lever-tuck", "elbow-lever", "elbow-lever"],
  "k-ring-flye": ["ring-push-up-incline", "ring-push-up", null, null, null],
  "k-explosive-push": ["push-up-fast", "clap-push-up", "clap-push-up", "clap-push-up", "clap-push-up"],
  "k-muscle-up": ["chest-to-bar", "explosive-pull", "muscle-up", "muscle-up-negative", "muscle-up-band", "muscle-up", "muscle-up-strict"],
  "k-front-lever": ["fl-tuck", "fl-adv-tuck", "fl-one-leg", "fl-full", "fl-full", "fl-raise"],
  "k-back-lever": ["skin-the-cat", "german-hang", "bl-tuck", "bl-adv-tuck", "bl-full", "bl-full"],
  "k-human-flag": ["side-plank", "flag-vertical", "flag-tuck", "flag-straddle", "flag"],
  "k-rope-climb": [null, null, null, null],
  "k-face-pull": ["band-pull-apart", "band-face-pull", "ring-face-pull-high", "ring-face-pull-low"],
  "k-bicep-curl": ["ring-curl-high", "ring-curl", "ring-curl-low", "chin-top-hold"],
  "k-grip": ["dead-hang", "one-arm-hang", "one-arm-hang", "pull-up"],
  "k-pistol": ["box-pistol", "pistol-assisted", "pistol-negative", "pistol", "pistol"],
  "k-cossack": ["cossack", "cossack", "cossack", "cossack"],
  "k-lunge": ["split-squat", "reverse-lunge", "forward-lunge", "reverse-lunge", "split-jump"],
  "k-squat": ["box-squat", "air-squat", "squat-pause", "deep-squat-hold", "air-squat"],
  "k-wall-sit": ["wall-sit-high", "wall-sit", "wall-sit", "wall-sit-single", "wall-sit"],
  "k-nordic": ["ham-walkout", "ham-curl", "ham-curl", "nordic-negative", "nordic-negative", "nordic"],
  "k-hip-thrust": ["glute-bridge", "glute-bridge-feet-up", "hip-thrust", "single-leg-glute-bridge", "single-leg-hip-thrust"],
  "k-sl-deadlift": ["sl-deadlift", "sl-deadlift", "sl-deadlift-reach", "sl-deadlift", null],
  "k-step-up": ["step-up-low", "step-up", "step-up-high", "step-up"],
  "k-reverse-nordic": ["reverse-nordic-partial", "reverse-nordic", "reverse-nordic"],
  "k-tibialis": ["tibialis", "tibialis", "tibialis"],
  "k-skater": ["shrimp-assisted", "shrimp", "shrimp"],
  "k-side-plank": ["side-plank", "side-plank", "side-plank", "side-plank-leg", "copenhagen", "copenhagen"],
  "k-dragon-flag": ["lying-leg-raise", "reverse-crunch", "dragon-flag-tuck", "dragon-flag-negative", "dragon-flag-one-leg", "dragon-flag"],
  "k-arch-hold": ["bird-dog", "superman", "arch-hold", "arch-rocks", "superman"],
  "k-rotation": ["russian-twist", "russian-twist", "hanging-oblique"],
  "k-burpee": ["burpee", "burpee", "burpee-push-up", "burpee"],
  "k-bear-crawl": ["bear-plank", "bear-crawl", "bear-crawl", "bear-crawl"],
  "k-mountain-climber": ["mountain-climber", "mountain-climber", "mountain-climber"]
};
