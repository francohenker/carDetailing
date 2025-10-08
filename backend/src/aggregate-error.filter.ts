import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch(AggregateError)
export class AggregateErrorFilter implements ExceptionFilter {
  catch(exception: AggregateError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Extrae los mensajes de los errores individuales
    const details =
      exception.errors?.map((err: any) => err.message ?? err.toString()) ?? [];

    response.status(500).json({
      statusCode: 500,
      message: 'Ocurrieron múltiples errores durante la operación.',
      details,
    });
  }
}
