import { TIPO_AUTO } from "../../enums/tipo_auto.enum";
export class createCarDto {
    marca: string;
    model: string;
    patente: string;
    color: string;
    type: TIPO_AUTO
}
