import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName?: string;

  @IsString()
  @MinLength(4)
  @IsOptional()
  password?: string;
}
