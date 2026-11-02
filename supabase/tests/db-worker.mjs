// Proceso auxiliar de los tests de base de datos: un Postgres embebido (PGlite) al que Jest le
// habla por líneas JSON. Se usa un proceso aparte porque PGlite es ESM puro y Jest no lo carga.
import { PGlite } from '@electric-sql/pglite';
import readline from 'node:readline';

const pg = new PGlite();
await pg.waitReady;
const rl = readline.createInterface({ input: process.stdin });
const send = (m) => process.stdout.write(JSON.stringify(m) + '\n');

let chain = Promise.resolve();
rl.on('line', (line) => {
  const { id, op, sql, params } = JSON.parse(line);
  chain = chain.then(async () => {
    try {
      if (op === 'exec') {
        await pg.exec(sql);
        send({ id, rows: [] });
      } else {
        const r = await pg.query(sql, params ?? []);
        send({ id, rows: r.rows });
      }
    } catch (e) {
      send({ id, error: { message: e.message, code: e.code, detail: e.detail, hint: e.hint } });
    }
  });
});
send({ id: 0, ready: true });
rl.on('close', () => pg.close().then(() => process.exit(0)));
