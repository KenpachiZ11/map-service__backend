import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
