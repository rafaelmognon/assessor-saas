import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Interceptor multi-tenant.
 *
 * Após a auth (que popula req.user), seta a variável `app.current_user_id`
 * na conexão Postgres. Isso ativa as policies RLS — qualquer query que
 * passe (mesmo se o código esquecer o filtro userId) é automaticamente
 * limitada às linhas do tenant.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    if (req.user?.userId) {
      await this.prisma.setTenant(req.user.userId);
    }
    return next.handle();
  }
}
