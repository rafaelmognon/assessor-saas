import { Module } from '@nestjs/common';
import { TransacoesController } from './transacoes.controller';

@Module({
  controllers: [TransacoesController],
})
export class TransacoesModule {}
