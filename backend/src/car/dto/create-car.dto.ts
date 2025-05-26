import { TIPO_AUTO } from "../../enums/tipo_auto";
export class createCarDto {
    marca: string;
    model: string;
    patente: string;
    color: string;
    type: TIPO_AUTO
}
