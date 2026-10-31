/* PUNTO. Motor de estadísticas (puro, sin UI).
   Toda cifra que se muestra en la app sale de estas funciones a partir de los partidos.
   En producción: portar a TypeScript en /lib/stats y/o a vistas SQL en Supabase. */
var PuntoStats = (function () {
  var FORMAT_LABEL = { one: '1 set', bo3: 'Mejor de 3', st: '2 sets + súper' };
  var DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var DAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  /* Redondeo único de la app: .5 sube. */
  function pct(w, n) { return n ? Math.floor((w / n) * 100 + 0.5) : 0; }

  function parse(d) { var p = d.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function fmtShort(d) { var x = parse(d); return DAYS[x.getUTCDay()] + ' ' + x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()]; }
  function fmtLong(d) { var x = parse(d); return DAYS_LONG[x.getUTCDay()] + ' ' + x.getUTCDate() + ' de ' + MONTHS_LONG[x.getUTCMonth()]; }
  function fmtMonthYear(d) { var x = parse(d); return MONTHS_LONG[x.getUTCMonth()] + ' ' + x.getUTCFullYear(); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function relDay(d, today) {
    var n = daysBetween(d, today);
    if (n <= 0) return 'hoy';
    if (n === 1) return 'ayer';
    return 'hace ' + n + ' días';
  }

  /* ---------- Validación de resultados ---------- */
  function validSet(a, b) {
    var mx = Math.max(a, b), mn = Math.min(a, b);
    return (mx === 6 && mn <= 4) || (mx === 7 && (mn === 5 || mn === 6));
  }
  function validSuper(a, b) {
    var mx = Math.max(a, b), mn = Math.min(a, b);
    return mx >= 10 && mx - mn >= 2 && (mx === 10 || mx - mn === 2);
  }
  /* Analiza un borrador o un partido. Devuelve sets visibles, errores por set, faltantes y ganador. */
  function analyze(format, sets, players) {
    var base = format === 'one' ? 1 : 2;
    var ok = [], wa = 0, wb = 0, i, a, b, v;
    for (i = 0; i < base; i++) {
      a = sets[i] ? sets[i][0] : 0; b = sets[i] ? sets[i][1] : 0;
      v = validSet(a, b); ok.push(v);
      if (v) { if (a > b) wa++; else wb++; }
    }
    var needThird = format !== 'one' && ok[0] && ok[1] && wa === 1 && wb === 1;
    var visible = base + (needThird ? 1 : 0);
    if (needThird) {
      a = sets[2] ? sets[2][0] : 0; b = sets[2] ? sets[2][1] : 0;
      v = format === 'st' ? validSuper(a, b) : validSet(a, b); ok.push(v);
      if (v) { if (a > b) wa++; else wb++; }
    }
    var missing = [], setErrs = [];
    if (players) {
      var filled = players.filter(Boolean).length;
      if (filled < 4) missing.push(4 - filled === 1 ? 'falta 1 jugador' : 'faltan ' + (4 - filled) + ' jugadores');
    }
    for (i = 0; i < visible; i++) {
      a = sets[i] ? sets[i][0] : 0; b = sets[i] ? sets[i][1] : 0;
      var isSuper = format === 'st' && i === 2;
      var label = isSuper ? 'el súper tie-break' : 'el set ' + (i + 1);
      if (a === 0 && b === 0) { missing.push('falta ' + label); setErrs.push(''); continue; }
      if (!ok[i]) {
        missing.push(label + ' no es válido');
        setErrs.push(isSuper
          ? a + '-' + b + ' no cierra el súper tie-break. Se gana llegando a 10 con 2 de diferencia.'
          : a + '-' + b + ' no cierra un set. Valen 6-0 a 6-4, 7-5 o 7-6.');
      } else setErrs.push('');
    }
    var target = format === 'one' ? 1 : 2;
    var winner = wa >= target ? 'A' : (wb >= target ? 'B' : null);
    if (!missing.length && !winner) missing.push('el resultado no define ganador');
    return { visible: visible, needThird: needThird, setErrs: setErrs, missing: missing, winner: winner, ok: missing.length === 0 };
  }
  function winnerOf(m) { return analyze(m.format, m.sets).winner; }

  /* ---------- Orden cronológico determinista ---------- */
  function chrono(ms) {
    return ms.slice().sort(function (x, y) {
      if (x.date !== y.date) return x.date < y.date ? -1 : 1;
      return (x.seq || 0) - (y.seq || 0) || (x.id < y.id ? -1 : 1);
    });
  }
  function newestFirst(ms) { return chrono(ms).reverse(); }

  function sideOf(m, pid) {
    if (m.teamA.indexOf(pid) >= 0) return 'A';
    if (m.teamB.indexOf(pid) >= 0) return 'B';
    return null;
  }
  function setsFor(m, side) {
    var w = 0, l = 0, n = analyze(m.format, m.sets).visible;
    for (var i = 0; i < n; i++) {
      var a = m.sets[i][0], b = m.sets[i][1];
      var mine = side === 'A' ? a : b, theirs = side === 'A' ? b : a;
      if (mine > theirs) w++; else l++;
    }
    return { w: w, l: l };
  }

  /* ---------- Jugador ---------- */
  function playerStats(ms, pid) {
    var list = chrono(ms.filter(function (m) { return sideOf(m, pid); }));
    var g = 0, sw = 0, sl = 0, best = 0, run = 0, cur = { type: null, n: 0 };
    list.forEach(function (m) {
      var side = sideOf(m, pid), win = winnerOf(m) === side;
      if (win) { g++; run++; if (run > best) best = run; } else run = 0;
      var s = setsFor(m, side); sw += s.w; sl += s.l;
      var t = win ? 'W' : 'L';
      if (cur.type === t) cur.n++; else cur = { type: t, n: 1 };
    });
    var pj = list.length;
    return { pj: pj, g: g, p: pj - g, pct: pct(g, pj), setsW: sw, setsL: sl, setsPct: pct(sw, sw + sl),
      streak: cur, best: best, first: list.length ? list[0].date : null, matches: list };
  }

  /* ---------- Ranking de grupo ---------- */
  var MIN_RANK = 5;
  function groupRanking(ms, group, players) {
    var rows = group.members.map(function (pid) {
      var s = playerStats(ms, pid);
      return { id: pid, pj: s.pj, g: s.g, pct: s.pct, ratio: s.pj ? s.g / s.pj : 0,
        setsRatio: (s.setsW + s.setsL) ? s.setsW / (s.setsW + s.setsL) : 0,
        name: players[pid] ? players[pid].name : pid };
    });
    var q = rows.filter(function (r) { return r.pj >= MIN_RANK; });
    var prov = rows.filter(function (r) { return r.pj < MIN_RANK; });
    q.sort(function (a, b) {
      return (b.ratio - a.ratio) || (b.g - a.g) || (b.setsRatio - a.setsRatio) || (a.name < b.name ? -1 : 1);
    });
    q.forEach(function (r, i) {
      var prev = q[i - 1];
      var tied = prev && prev.ratio === r.ratio && prev.g === r.g && prev.setsRatio === r.setsRatio;
      r.pos = tied ? prev.pos : i + 1; r.tied = !!tied;
      if (tied) prev.tied = true;
    });
    prov.sort(function (a, b) { return (b.pj - a.pj) || (a.name < b.name ? -1 : 1); });
    return { qualified: q, provisional: prov };
  }
  function rankOf(ms, group, players, pid) {
    var r = groupRanking(ms, group, players);
    for (var i = 0; i < r.qualified.length; i++) if (r.qualified[i].id === pid) return { pos: r.qualified[i].pos, of: r.qualified.length, row: r.qualified[i] };
    return null;
  }

  /* ---------- Duplas ---------- */
  var MIN_DUO = 3;
  function duoStats(ms) {
    var map = {};
    chrono(ms).forEach(function (m) {
      var w = winnerOf(m);
      [['A', m.teamA], ['B', m.teamB]].forEach(function (t) {
        var k = t[1].slice().sort().join('|');
        var d = map[k] || (map[k] = { ids: t[1].slice().sort(), n: 0, w: 0, last: null, results: [] });
        d.n++; if (w === t[0]) d.w++; d.last = m.date; d.results.push(w === t[0] ? 'G' : 'P');
      });
    });
    var all = Object.keys(map).map(function (k) { var d = map[k]; d.pct = pct(d.w, d.n); d.provisional = d.n < MIN_DUO; return d; });
    all.sort(function (a, b) { return (b.w / b.n - a.w / a.n) || (b.w - a.w) || (b.n - a.n) || (a.ids.join() < b.ids.join() ? -1 : 1); });
    return { qualified: all.filter(function (d) { return !d.provisional; }), provisional: all.filter(function (d) { return d.provisional; }) };
  }
  function topDuo(ms) { var q = duoStats(ms).qualified; return q.length ? q[0] : null; }

  /* ---------- Cara a cara ---------- */
  function h2h(ms, a, b) {
    var res = { total: 0, aW: 0, bW: 0, together: { n: 0, w: 0 }, meetings: [] };
    newestFirst(ms).forEach(function (m) {
      var sa = sideOf(m, a), sb = sideOf(m, b);
      if (!sa || !sb) return;
      var w = winnerOf(m);
      if (sa === sb) { res.together.n++; if (w === sa) res.together.w++; return; }
      res.total++; if (w === sa) res.aW++; else res.bW++;
      res.meetings.push({ m: m, aWon: w === sa });
    });
    res.aPct = pct(res.aW, res.total); res.bPct = res.total ? 100 - res.aPct : 0;
    return res;
  }
  /* Titular honesto: nada de veredictos con muestras chicas. */
  var MIN_H2H = 5;
  function h2hHeadline(r, aName, bName) {
    if (!r.total) return { title: 'Todavía no se cruzaron.', sub: '', small: false };
    if (r.total < MIN_H2H) return { title: 'Muestra chica.', sub: r.total + (r.total === 1 ? ' cruce' : ' cruces') + '. Todavía no hay veredicto.', small: true };
    var d = r.aW - r.bW;
    if (Math.abs(d) <= 1) return { title: 'Mano a mano.', sub: r.aW + ' a ' + r.bW + ' en ' + r.total + ' cruces.', small: false };
    var lead = d > 0 ? aName : bName, lw = Math.max(r.aW, r.bW);
    if (Math.abs(d) >= 3) return { title: 'Hay historial.', sub: lead + ' ganó ' + lw + ' de los ' + r.total + ' cruces.', small: false };
    return { title: 'Viene ganando ' + lead + '.', sub: lw + ' de ' + r.total + ' cruces.', small: false };
  }

  /* ---------- Compañeros y rivales (perfil global) ---------- */
  function partnersAndRivals(ms, pid) {
    var part = {}, riv = {};
    ms.forEach(function (m) {
      var s = sideOf(m, pid); if (!s) return;
      var w = winnerOf(m) === s;
      var mine = s === 'A' ? m.teamA : m.teamB, other = s === 'A' ? m.teamB : m.teamA;
      mine.forEach(function (x) { if (x === pid) return; var p = part[x] || (part[x] = { id: x, n: 0, w: 0, groups: {} }); p.n++; if (w) p.w++; p.groups[m.groupId] = 1; });
      other.forEach(function (x) { var r = riv[x] || (riv[x] = { id: x, n: 0, w: 0, groups: {} }); r.n++; if (w) r.w++; r.groups[m.groupId] = 1; });
    });
    function sorted(o) {
      return Object.keys(o).map(function (k) { var x = o[k]; x.pct = pct(x.w, x.n); x.groupIds = Object.keys(x.groups); return x; })
        .sort(function (a, b) { return (b.n - a.n) || (b.w - a.w) || (a.id < b.id ? -1 : 1); });
    }
    return { partners: sorted(part), rivals: sorted(riv) };
  }

  /* ---------- Impacto de un cambio (para resultado y borrado) ---------- */
  function impact(before, after, pid, group, players) {
    var b = playerStats(before, pid), a = playerStats(after, pid);
    var gb = playerStats(before.filter(function (m) { return m.groupId === group.id; }), pid);
    var ga = playerStats(after.filter(function (m) { return m.groupId === group.id; }), pid);
    var rb = rankOf(before.filter(function (m) { return m.groupId === group.id; }), group, players, pid);
    var ra = rankOf(after.filter(function (m) { return m.groupId === group.id; }), group, players, pid);
    return { before: b, after: a, groupBefore: gb, groupAfter: ga, rankBefore: rb, rankAfter: ra };
  }

  return {
    pct: pct, analyze: analyze, winnerOf: winnerOf, chrono: chrono, newestFirst: newestFirst, sideOf: sideOf,
    setsFor: setsFor, playerStats: playerStats, groupRanking: groupRanking, rankOf: rankOf, duoStats: duoStats,
    topDuo: topDuo, h2h: h2h, h2hHeadline: h2hHeadline, partnersAndRivals: partnersAndRivals, impact: impact,
    fmtShort: fmtShort, fmtLong: fmtLong, fmtMonthYear: fmtMonthYear, relDay: relDay, daysBetween: daysBetween,
    FORMAT_LABEL: FORMAT_LABEL, MIN_RANK: MIN_RANK, MIN_DUO: MIN_DUO, MIN_H2H: MIN_H2H
  };
})();
if (typeof module !== 'undefined') module.exports = PuntoStats;
