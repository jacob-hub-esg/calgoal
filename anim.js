"use strict";
// Calgoal exercise animations: a figure drawn in SVG and moved between key poses.
// Angles are directions in degrees: 0 = up, 90 = right, 180 = down, 270 = left.
// Side view: the figure faces right. Front view (def.front): the figure faces you.
// A pose gives the body by its hip ({hip}) or its shoulders ({sh}), plus a torso angle.
// A limb is { a: [upper, lower] } (angles), { to: [x, y], bend: 1 | -1 } (reach a point, elbow/knee to one side)
// or { to: [x, y], straight: true } (reach a point with a straight limb).
const CalAnim = (() => {
  const L = { torso: 26, neck: 4, head: 5.5, upper: 14, fore: 14, thigh: 21, shin: 21, foot: 6 };
  const NS = "http://www.w3.org/2000/svg";
  const rad = d => d * Math.PI / 180;
  const pt = (o, d, len) => [o[0] + len * Math.sin(rad(d)), o[1] - len * Math.cos(rad(d))];
  const dirOf = (a, b) => Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180 / Math.PI;

  function limb(root, s, l1, l2) {
    if (s.to && s.straight) {
      const d = dirOf(root, s.to);
      return { root, j: [(root[0] + s.to[0]) / 2, (root[1] + s.to[1]) / 2], end: s.to.slice(), low: d };
    }
    if (s.to) {
      const d = Math.hypot(s.to[0] - root[0], s.to[1] - root[1]);
      const dc = Math.min(Math.max(d, Math.abs(l1 - l2) + 1e-3), l1 + l2 - 1e-3);
      const off = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc)))) * 180 / Math.PI;
      const j = pt(root, dirOf(root, s.to) + (s.bend || 1) * off, l1);
      const end = pt(j, dirOf(j, s.to), l2);
      return { root, j, end, low: dirOf(j, end) };
    }
    const j = pt(root, s.a[0], l1);
    return { root, j, end: pt(j, s.a[1], l2), low: s.a[1] };
  }

  function solve(p, front) {
    const hip = p.hip ? p.hip : pt(p.sh, p.torso + 180, L.torso);
    const sh = p.hip ? pt(hip, p.torso, L.torso) : p.sh;
    const hd = p.torso + (p.head || 0);
    const neck = pt(sh, hd, p.neck ?? L.neck), head = pt(neck, hd, L.head);
    const side = (o, d, w) => front ? pt(o, p.torso + d, w) : o;
    const shN = side(sh, 90, 7), shF = side(sh, -90, 7), hipN = side(hip, 90, 4.5), hipF = side(hip, -90, 4.5);
    const leg = (root, s, far) => {
      const r = limb(root, s, L.thigh, L.shin);
      const fd = s.f != null ? s.f : s.point ? r.low : (front && far ? r.low + 90 : r.low - 90);
      r.toe = pt(r.end, fd, front ? 4.5 : L.foot);
      return r;
    };
    return {
      hip, sh, neck, head, shN, shF, hipN, hipF,
      armN: limb(shN, p.armN, L.upper, L.fore), armF: limb(shF, p.armF || p.armN, L.upper, L.fore),
      legN: leg(hipN, p.legN, false), legF: leg(hipF, p.legF || p.legN, true)
    };
  }

  function lerp(a, b, t) {
    if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
    if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => lerp(v, b[i], t));
    if (a && b && typeof a === "object" && typeof b === "object") {
      const o = {};
      for (const k of Object.keys(a)) o[k] = k in b ? lerp(a[k], b[k], t) : a[k];
      for (const k of Object.keys(b)) if (!(k in o)) o[k] = b[k];
      return o;
    }
    return t < 0.5 ? a : b;
  }
  const ease = t => t * t * (3 - 2 * t);

  // Each key pose inherits what it leaves out from the one before.
  function full(p, prev) {
    const q = Object.assign({}, prev || {}, p);
    if (p.sh) delete q.hip;
    if (p.hip) delete q.sh;
    if (p.armN && !p.armF && prev && prev.armF === prev.armN) q.armF = p.armN;
    if (p.legN && !p.legF && prev && prev.legF === prev.legN) q.legF = p.legN;
    if (!q.armF) q.armF = q.armN;
    if (!q.legF) q.legF = q.legN;
    return q;
  }
  function keysOf(def) {
    if (def._keys) return def._keys;
    let prev = null;
    def._keys = def.keys.map(k => (prev = full(k.pose, prev), { pose: prev, hold: k.hold ?? 350, move: k.move ?? 900 }));
    return def._keys;
  }
  function poseAt(def, ms) {
    const keys = keysOf(def);
    if (keys.length === 1) {
      // A hold: breathe gently so it reads as alive.
      const p = keys[0].pose, b = Math.sin(ms / 700) * 0.5;
      const q = Object.assign({}, p);
      if (q.hip) q.hip = [q.hip[0], q.hip[1] + b]; else q.sh = [q.sh[0], q.sh[1] + b];
      return q;
    }
    const total = keys.reduce((s, k) => s + k.hold + k.move, 0);
    let t = ((ms % total) + total) % total;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (t < k.hold) return k.pose;
      t -= k.hold;
      if (t < k.move) return lerp(k.pose, keys[(i + 1) % keys.length].pose, ease(t / k.move));
      t -= k.move;
    }
    return keys[0].pose;
  }

  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const P = a => a[0].toFixed(2) + "," + a[1].toFixed(2);

  function drawProps(g, props) {
    for (const p of props || []) {
      if (p.floor != null) el("line", { x1: -60, x2: 260, y1: p.floor, y2: p.floor, class: "ca-floor" }, g);
      if (p.wall != null) el("line", { x1: p.wall, x2: p.wall, y1: -60, y2: 260, class: "ca-floor" }, g);
      if (p.bar) el("line", { x1: p.bar[0], x2: p.bar[1], y1: p.bar[2], y2: p.bar[2], class: "ca-bar" }, g);
      if (p.vbar) el("line", { x1: p.vbar[0], x2: p.vbar[0], y1: p.vbar[1], y2: p.vbar[2], class: "ca-bar" }, g);
      if (p.post) el("line", { x1: p.post[0], x2: p.post[0], y1: p.post[1], y2: p.post[2], class: "ca-post" }, g);
      if (p.box) el("rect", { x: p.box[0], y: p.box[1], width: p.box[2], height: p.box[3], rx: 1.5, class: "ca-box" }, g);
      if (p.ring) { el("line", { x1: p.ring[0], x2: p.ring[0], y1: p.ring[2], y2: p.ring[1] - 4, class: "ca-strap" }, g); el("circle", { cx: p.ring[0], cy: p.ring[1], r: 4, class: "ca-ring" }, g); }
      if (p.ball) el("circle", { cx: p.ball[0], cy: p.ball[1], r: p.ball[2], class: "ca-box" }, g);
    }
  }

  // Draws one animation into a container. Returns a controller.
  function mount(container, def, opts = {}) {
    const front = !!def.front;
    const svg = el("svg", { viewBox: def.view || "0 0 120 110", class: "ca" + (front ? " ca-front" : ""), role: "img", "aria-label": opts.label || "Exercise animation" });
    drawProps(el("g", {}, svg), def.props);
    const dyn = el("g", {}, svg);
    const strapN = def.rings != null ? el("line", { class: "ca-strap" }, dyn) : null;
    const strapF = def.rings != null ? el("line", { class: "ca-strap" }, dyn) : null;
    const far = el("g", { class: "ca-far" }, svg);
    const armF = el("polyline", { class: "ca-limb" }, far), legF = el("polyline", { class: "ca-limb" }, far);
    const near = el("g", { class: "ca-near" }, svg);
    const legGap = el("polyline", { class: "ca-gap" }, near), legN = el("polyline", { class: "ca-limb" }, near);
    const torso = front ? el("polygon", { class: "ca-torso-f" }, near) : el("line", { class: "ca-torso" }, near);
    const neck = el("line", { class: "ca-neck" }, near);
    const armGap = el("polyline", { class: "ca-gap" }, near), armN = el("polyline", { class: "ca-limb" }, near);
    const band = def.band ? el("polyline", { class: "ca-band" }, svg) : null;
    const ringN = def.rings != null ? el("circle", { r: 4, class: "ca-ring" }, svg) : null;
    const ringF = def.rings != null && front ? el("circle", { r: 4, class: "ca-ring" }, svg) : null;
    const wheel = def.wheel ? el("circle", { r: def.wheel, class: "ca-ring" }, svg) : null;
    const head = el("circle", { r: L.head, class: "ca-head" }, svg);
    container.appendChild(svg);

    const setLine = (n, a, b) => { n.setAttribute("x1", a[0]); n.setAttribute("y1", a[1]); n.setAttribute("x2", b[0]); n.setAttribute("y2", b[1]); };
    const draw = ms => {
      const s = solve(poseAt(def, ms), front);
      const pl = (node, l, toe) => node.setAttribute("points", [l.root, l.j, l.end].concat(toe ? [l.toe] : []).map(P).join(" "));
      pl(armF, s.armF); pl(legF, s.legF, true); pl(legGap, s.legN, true); pl(legN, s.legN, true); pl(armGap, s.armN); pl(armN, s.armN);
      if (front) torso.setAttribute("points", [s.shN, s.shF, s.hipF, s.hipN].map(P).join(" "));
      else setLine(torso, s.hip, s.sh);
      setLine(neck, s.sh, s.neck);
      head.setAttribute("cx", s.head[0]); head.setAttribute("cy", s.head[1]);
      if (band) band.setAttribute("points", [def.band, def.bandTo === "knee" ? s.legN.j : def.bandTo === "hand" ? s.armN.end : s.legN.end].map(P).join(" "));
      if (wheel) { wheel.setAttribute("cx", s.armN.end[0]); wheel.setAttribute("cy", s.armN.end[1] + def.wheel - 1); }
      if (ringN) {
        const rp = h => [h[0], h[1] + 3];
        ringN.setAttribute("cx", rp(s.armN.end)[0]); ringN.setAttribute("cy", rp(s.armN.end)[1]);
        setLine(strapN, [s.armN.end[0], def.rings], s.armN.end);
        setLine(strapF, [s.armF.end[0], def.rings], s.armF.end);
        if (ringF) { ringF.setAttribute("cx", rp(s.armF.end)[0]); ringF.setAttribute("cy", rp(s.armF.end)[1]); }
      }
    };

    let raf = 0, start = null, offset = opts.at || 0;
    const loop = now => {
      if (!svg.isConnected) { raf = 0; return; }
      if (start == null) start = now - offset;
      draw(now - start);
      raf = requestAnimationFrame(loop);
    };
    draw(offset);
    const ctl = {
      svg, draw,
      get playing() { return !!raf; },
      play() { if (!raf) { start = null; raf = requestAnimationFrame(loop); } },
      stop() { cancelAnimationFrame(raf); raf = 0; }
    };
    if (!opts.paused) ctl.play();
    return ctl;
  }

  return { mount, solve, poseAt, L, pt };
})();
