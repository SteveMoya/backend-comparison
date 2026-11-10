import { app } from './app';

app.listen(3001);

console.log(`🚀 Bun server running on port ${app.server?.port}`);
