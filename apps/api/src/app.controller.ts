import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // GET /health. Railway (or any uptime monitor) calls this to ask "is the API running?".
  // It is public and touches no database, so it stays fast and can't leak anything.
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
