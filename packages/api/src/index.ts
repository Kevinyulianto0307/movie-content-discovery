import './env.ts'; // load root .env before the db client reads DATABASE_URL
import { buildServer } from './server.ts';

const app = buildServer();
const port = Number(process.env.API_PORT ?? 3000);

app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
