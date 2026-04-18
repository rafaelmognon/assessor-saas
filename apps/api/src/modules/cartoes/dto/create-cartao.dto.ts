import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { CartaoBandeira, CartaoTipo } from '@prisma/client';

export class CreateCartaoDto {
  @IsString()
  @Length(1, 50)
  apelido!: string;

  @IsEnum(CartaoTipo)
  tipo!: CartaoTipo;

  @IsEnum(CartaoBandeira)
  bandeira!: CartaoBandeira;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Últimos 4 deve ser exatamente 4 dígitos' })
  ultimos4!: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  cor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  limite?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaFecha?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaVence?: number;
}
