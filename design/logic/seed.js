/* PUNTO. Datos de demostración (ficticios). Única fuente de verdad del prototipo.
   Los partidos son la verdad: ninguna estadística está escrita a mano.
   Formato de partido compacto: [id, grupo, fecha, parejaA, parejaB, formato, sets (A-B), cargadoPor] */
var PUNTO_SEED = (function () {
  var C = { navy: '#19283B', coral: '#FF7855', cream: '#FFF8ED', lime: '#DCEB82', lilac: '#B9A6F2', graphite: '#394457', cream2: '#F3EBDD' };
  function P(id, name, full, ini, bg, guest) {
    return { id: id, name: name, full: full, ini: ini, bg: bg, fg: bg === C.graphite ? C.cream : C.navy, guest: !!guest };
  }
  var players = {
    tomi: P('tomi', 'Tomi', 'Tomás González', 'TG', C.coral),
    fran: P('fran', 'Fran', 'Francisco Pérez', 'FP', C.lilac),
    nico: P('nico', 'Nico', 'Nicolás Ruiz', 'NR', C.lime),
    lean: P('lean', 'Lean', 'Leandro Sosa', 'LS', C.cream2),
    mati: P('mati', 'Mati', 'Matías Díaz', 'MD', C.graphite),
    juani: P('juani', 'Juani', 'Juan Ignacio Vega', 'JV', C.lime),
    santi: P('santi', 'Santi', 'Santiago Ferrari', 'SF', C.lilac),
    pipo: P('pipo', 'Pipo', 'Pipo', 'PI', 'transparent', true),
    bruno: P('bruno', 'Bruno', 'Bruno Acosta', 'BA', C.lime),
    gonza: P('gonza', 'Gonza', 'Gonzalo Medina', 'GM', C.cream2),
    facu: P('facu', 'Facu', 'Facundo Ríos', 'FR', C.lilac),
    rama: P('rama', 'Rama', 'Ramiro Torres', 'RT', C.graphite),
    joaco: P('joaco', 'Joaco', 'Joaquín Paz', 'JP', C.lime),
    tincho: P('tincho', 'Tincho', 'Martín Luna', 'ML', C.cream2),
    colo: P('colo', 'Colo', 'Ezequiel Romero', 'ER', C.lilac),
    agus: P('agus', 'Agus', 'Agustín Bravo', 'AB', C.graphite),
    fede: P('fede', 'Fede', 'Fede', 'FE', 'transparent', true),
    caro: P('caro', 'Caro', 'Caro', 'CA', 'transparent', true)
  };
  var groups = [
    { id: 'jueves', name: 'Los del Jueves', ini: 'LJ', bg: C.lime, admins: ['tomi'],
      members: ['tomi', 'fran', 'nico', 'lean', 'mati', 'juani', 'santi', 'pipo'] },
    { id: 'pibes', name: 'Los Pibes', ini: 'LP', bg: C.lilac, admins: ['gonza'],
      members: ['tomi', 'bruno', 'gonza', 'facu', 'rama', 'joaco', 'tincho', 'colo', 'agus', 'fede'] }
  ];
  /* Escenario "grupo sin partidos": se suma este grupo, recién creado. */
  var emptyGroup = { id: 'martes', name: 'Los del Martes', ini: 'LM', bg: C.cream2, admins: ['tomi'],
    members: ['tomi', 'fran', 'bruno', 'mati', 'caro'] };
  var raw = [
    ['m01','jueves','2026-05-28',['nico','santi'],['fran','lean'],'bo3',[[6,1],[6,3]],'fran'],
    ['m02','jueves','2026-06-04',['nico','juani'],['fran','santi'],'st',[[3,6],[6,3],[10,4]],'fran'],
    ['m03','jueves','2026-06-11',['nico','lean'],['juani','santi'],'bo3',[[6,3],[4,6],[7,5]],'fran'],
    ['m04','jueves','2026-06-18',['fran','nico'],['mati','juani'],'one',[[7,6]],'fran'],
    ['m05','jueves','2026-06-25',['fran','lean'],['mati','pipo'],'bo3',[[7,5],[6,3]],'fran'],
    ['m06','jueves','2026-07-02',['fran','mati'],['lean','juani'],'st',[[6,4],[4,6],[10,8]],'tomi'],
    ['m07','jueves','2026-07-09',['fran','lean'],['mati','juani'],'bo3',[[6,2],[3,6],[6,4]],'fran'],
    ['m08','jueves','2026-07-16',['nico','lean'],['mati','santi'],'one',[[6,4]],'tomi'],
    ['m09','jueves','2026-07-23',['nico','mati'],['juani','santi'],'bo3',[[6,3],[6,4]],'fran'],
    ['m10','jueves','2026-07-30',['tomi','fran'],['nico','mati'],'bo3',[[6,4],[3,6],[6,3]],'tomi'],
    ['m11','jueves','2026-08-06',['tomi','fran'],['nico','lean'],'bo3',[[6,2],[6,4]],'tomi'],
    ['m12','jueves','2026-08-13',['mati','juani'],['tomi','fran'],'bo3',[[6,3],[6,4]],'tomi'],
    ['m13','jueves','2026-08-20',['tomi','fran'],['nico','pipo'],'st',[[6,3],[4,6],[10,6]],'tomi'],
    ['m14','jueves','2026-08-27',['tomi','mati'],['nico','lean'],'bo3',[[7,6],[6,4]],'tomi'],
    ['m15','pibes','2026-08-30',['tincho','colo'],['joaco','agus'],'bo3',[[7,6],[6,4]],'gonza'],
    ['m16','jueves','2026-09-03',['fran','santi'],['tomi','lean'],'bo3',[[6,3],[6,2]],'tomi'],
    ['m17','pibes','2026-09-06',['tomi','bruno'],['gonza','tincho'],'bo3',[[6,1],[6,4]],'gonza'],
    ['m18','jueves','2026-09-10',['fran','juani'],['mati','santi'],'bo3',[[6,4],[6,2]],'tomi'],
    ['m19','jueves','2026-09-10',['tomi','pipo'],['nico','lean'],'bo3',[[6,4],[6,4]],'tomi'],
    ['m20','pibes','2026-09-13',['tomi','bruno'],['facu','agus'],'st',[[7,5],[3,6],[10,8]],'gonza'],
    ['m21','jueves','2026-09-17',['tomi','juani'],['fran','mati'],'bo3',[[6,3],[6,4]],'tomi'],
    ['m22','pibes','2026-09-20',['colo','fede'],['facu','tincho'],'bo3',[[6,2],[6,2]],'gonza'],
    ['m23','pibes','2026-09-20',['tomi','agus'],['gonza','joaco'],'bo3',[[6,3],[7,5]],'tomi'],
    ['m24','jueves','2026-09-24',['nico','juani'],['tomi','mati'],'bo3',[[4,6],[6,3],[6,4]],'tomi'],
    ['m25','pibes','2026-09-27',['bruno','agus'],['facu','joaco'],'one',[[6,3]],'gonza'],
    ['m26','pibes','2026-09-27',['tincho','colo'],['tomi','gonza'],'st',[[3,6],[6,4],[10,5]],'gonza'],
    ['m27','jueves','2026-10-01',['nico','mati'],['tomi','juani'],'st',[[6,4],[3,6],[10,7]],'tomi'],
    ['m28','pibes','2026-10-04',['tomi','joaco'],['rama','colo'],'bo3',[[6,4],[6,2]],'gonza'],
    ['m29','jueves','2026-10-08',['tomi','lean'],['nico','pipo'],'bo3',[[6,3],[6,2]],'tomi'],
    ['m30','pibes','2026-10-11',['joaco','tincho'],['agus','fede'],'bo3',[[6,4],[7,6]],'gonza'],
    ['m31','pibes','2026-10-11',['gonza','colo'],['tomi','bruno'],'bo3',[[6,4],[6,4]],'gonza'],
    ['m32','jueves','2026-10-15',['fran','lean'],['tomi','santi'],'st',[[7,6],[4,6],[10,8]],'tomi'],
    ['m33','pibes','2026-10-18',['bruno','gonza'],['tomi','facu'],'bo3',[[6,3],[6,4]],'gonza'],
    ['m34','jueves','2026-10-22',['tomi','mati'],['nico','juani'],'bo3',[[7,5],[6,4]],'tomi'],
    ['m35','pibes','2026-10-25',['tomi','bruno'],['gonza','facu'],'st',[[6,2],[4,6],[10,7]],'tomi'],
    ['m36','jueves','2026-10-29',['tomi','fran'],['nico','lean'],'bo3',[[6,4],[6,3]],'tomi']
  ];
  var matches = raw.map(function (r, i) {
    return { id: r[0], groupId: r[1], date: r[2], seq: i + 1, teamA: r[3], teamB: r[4], format: r[5], sets: r[6], createdBy: r[7], edited: false };
  });
  return { me: 'tomi', today: '2026-10-31', colors: C, players: players, groups: groups, emptyGroup: emptyGroup, matches: matches };
})();
if (typeof module !== 'undefined') module.exports = PUNTO_SEED;
