import { IsNumberString, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstname: string;
  @IsString()
  lastname: string;
  @IsString()
  password: string;
  @IsString()
  email: string;
  @IsNumberString()
  @Length(10, 10)
  phone?: string;
}

export class UpdateUserDto {
  @IsString()
  firstname?: string;
  @IsString()
  lastname?: string;
  @IsString()
  password?: string;
  @IsString()
  email?: string;
  @IsNumberString()
  @Length(10, 10)
  phone?: string;
}
