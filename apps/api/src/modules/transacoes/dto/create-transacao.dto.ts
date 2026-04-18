import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { FormaPagamento, OrigemTransacao, TransacaoTipo } from '@prisma/client';

export class CreateTransacaoDto {
  @IsString()
  @Length(1, 255)
  descricao!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor!: number;

  @IsEnum(TransacaoTipo)
  tipo!: TransacaoTipo;

  @IsEnum(FormaPagamento)
  formaPagamento!: FormaPagamento;

  @IsOptional()
  @IsEnum(OrigemTransacao)
  origem?: OrigemTransacao;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  cartaoId?: string;

  // Parcelamento
  @IsOptional()
  @IsInt()
  @Min(1)
  parcelaAtual?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  parcelasTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorTotal?: number;
}
