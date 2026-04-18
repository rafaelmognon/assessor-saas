import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { CartoesModule } from './modules/cartoes/cartoes.module';
import { TransacoesModule } from './modules/transacoes/transacoes.module';
import { CompromissosModule } from './modules/compromissos/compromissos.module';
import { NotasModule } from './modules/notas/notas.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriasModule,
    CartoesModule,
    TransacoesModule,
    CompromissosModule,
    NotasModule,
    AiModule,
    WhatsAppModule,
  ],
  controllers: [AppController],
  providers: [
    // Guard global: TODO endpoint precisa de JWT, salvo @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Interceptor multi-tenant: seta app.current_user_id antes de cada request autenticado
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
