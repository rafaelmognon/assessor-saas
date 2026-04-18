import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { NotaOrigem, NotaTag } from '@prisma/client';

export class CreateNotaDto {
  @IsOptional()
  @IsString()
  @Length(0, 200)
  titulo?: string;

  @IsString()
  @Length(1, 10000)
  conteudo!: string;

  @IsOptional()
  @IsEnum(NotaTag)
  tag?: NotaTag;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  cor?: string;

  @IsOptional()
  @IsBoolean()
  fixada?: boolean;

  @IsOptional()
  @IsEnum(NotaOrigem)
  origem?: NotaOrigem;
}
