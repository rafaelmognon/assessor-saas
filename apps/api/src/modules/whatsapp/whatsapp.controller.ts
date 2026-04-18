import { Controller, Delete, Get, Post } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { WhatsAppService } from './whatsapp.service';

@Controller('me/whatsapp')
export class WhatsAppController {
  constructor(private readonly service: WhatsAppService) {}

  @Post('connect')
  connect(@CurrentUser() user: RequestUser) {
    return this.service.connect(user.userId);
  }

  @Get('status')
  status(@CurrentUser() user: RequestUser) {
    return this.service.getStatus(user.userId);
  }

  @Delete()
  disconnect(@CurrentUser() user: RequestUser) {
    return this.service.disconnect(user.userId);
  }
}
