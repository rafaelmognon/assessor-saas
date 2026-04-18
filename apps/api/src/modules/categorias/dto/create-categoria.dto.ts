import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { CategoriaTipo } from '@prisma/client';

export class CreateCategoriaDto {
  @IsString()
  @Length(1, 50)
  nome!: string;

  @IsString()
  @Length(1, 4) // emoji
  icone!: string;

  @IsString()
  @Length(1, 30)
  cor!: string;

  @IsEnum(CategoriaTipo)
  tipo!: CategoriaTipo;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  metaMensal?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
