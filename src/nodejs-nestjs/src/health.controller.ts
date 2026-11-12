import { Controller, Get } from '@nestjs/common';

/**
 * Liveness probe used by the benchmark harness.
 * Lives outside the `api` global prefix so it answers on `/health`,
 * the same path every other adapter exposes.
 */
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
