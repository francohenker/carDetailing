import { IsNumber, IsString, Max } from "class-validator";

export class modifyCarDto {
    @IsNumber()
    @Max(9999999)
    id: number;
    @IsString()
    color: string;
    
}