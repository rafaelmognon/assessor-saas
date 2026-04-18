import { Module } from '@nestjs/common';
import { CartoesController } from './cartoes.controller';

@Module({ controllers: [CartoesController] })
export class CartoesModule {}
