import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { CompromissoOrigem } from '@prisma/client';

export class CreateCompromissoDto {
  @IsString()
  @Length(1, 200)
  titulo!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  descricao?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  local?: string;

  @IsDateString()
  inicio!: string;

  @IsOptional()
  @IsDateString()
  fim?: string;

  @IsOptional()
  @IsBoolean()
  diaInteiro?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  cor?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  lembretesMinutos?: number[];

  @IsOptional()
  @IsEnum(CompromissoOrigem)
  origem?: CompromissoOrigem;
}
