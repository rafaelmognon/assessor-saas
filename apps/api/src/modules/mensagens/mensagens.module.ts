import { Module } from '@nestjs/common';
import { MensagensController } from './mensagens.controller';

@Module({ controllers: [MensagensController] })
export class MensagensModule {}
