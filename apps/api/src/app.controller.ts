import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'Assessor API',
      version: '0.1.0',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  health() {
    return { status: 'healthy' };
  }
}
