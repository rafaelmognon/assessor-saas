import { Module } from '@nestjs/common';
import { NotasController } from './notas.controller';

@Module({ controllers: [NotasController] })
export class NotasModule {}
