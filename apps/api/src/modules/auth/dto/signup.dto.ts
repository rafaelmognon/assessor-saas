import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @IsString()
  @MinLength(2, { message: 'Nome muito curto' })
  @MaxLength(100)
  nome!: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter ao menos 8 caracteres' })
  @MaxLength(72) // bcrypt limit
  @Matches(/(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Senha deve conter letras e números',
  })
  senha!: string;

  @IsString()
  @Matches(/^\+?\d{10,15}$/, {
    message: 'WhatsApp inválido. Use formato com DDD (ex: +5554999999999)',
  })
  whatsapp!: string;
}
