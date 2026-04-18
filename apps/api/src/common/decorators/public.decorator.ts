import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca um endpoint como público (não exige autenticação JWT).
 * Use em /auth/login, /auth/signup, /health etc.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
