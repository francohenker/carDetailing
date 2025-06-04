import { IsNumber, IsString, Max } from "class-validator";

export class CreateServicioDto {
    @IsString()
    name: string;
    @IsString()
    description: string;
    @IsNumber()
    @Max(9999999)
    precio: number;
}
