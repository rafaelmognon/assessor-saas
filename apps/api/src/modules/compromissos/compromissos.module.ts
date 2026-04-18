import { Module } from '@nestjs/common';
import { CompromissosController } from './compromissos.controller';

@Module({ controllers: [CompromissosController] })
export class CompromissosModule {}
