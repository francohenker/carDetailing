import { IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstname: string;
  @IsString()
  lastname: string;
  @IsString()
  password: string;
  @IsString()
  email: string;
  @IsString()
  phone: string;
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
  @IsString()
  phone?: string;
}
