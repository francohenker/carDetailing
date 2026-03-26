import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { Between, Repository } from 'typeorm';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { Car } from '../car/entities/car.entity';
import { ServicioService } from '../servicio/servicio.service';
import { ModifyTurnoDto } from './dto/modify.turno.dto';
import { estado_turno } from '../enums/estado_turno.enum';
import { Users } from '../users/entities/users.entity';
import { MailService } from '../mail.services';
import { ProductoService } from '../producto/producto.service';
import { empresaInfo } from '../config/empresa.config';
import { WorkspaceService } from './workspace.service';
import { WorkSpace } from './entities/workspace.entity';
import { SystemConfigService } from '../config/system-config.service';

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    private servicioService: ServicioService,
    private mailService: MailService,
    private productoService: ProductoService,
    private workspaceService: WorkspaceService,
    private systemConfigService: SystemConfigService,
  ) {}

  async createTurno(car: Car, turnoView: CreateTurnoDto): Promise<Turno> {
    // Validar que el tipo de vehículo esté activo
    const activeTypes = await this.systemConfigService.getActiveVehicleTypes();
    if (!activeTypes.includes(car.type)) {
      throw new HttpException(
        `El tipo de vehículo '${car.type}' no está activo. No se pueden registrar nuevos turnos con este tipo de vehículo.`,
        400,
      );
    }

    const servicios = await this.servicioService.findByIds(turnoView.services);

    // Detectar si hay servicios multi-día
    const isMultiDay = this.hasMultiDayServices(servicios);

    if (isMultiDay) {
      // Validación para servicios multi-día
      const durationDays = this.getMultiDayDuration(servicios);
      await this.validateMultiDayAvailability(
        turnoView.date,
        durationDays,
        servicios,
      );
      // La duración total se calcula automáticamente
      const calculatedDuration = this.calculateTotalDuration(
        servicios,
        turnoView.duration,
      );
      turnoView.duration = calculatedDuration;
    } else {
      // Validación estándar para servicios de un día
      await this.validateTimeSlotAvailability(
        turnoView.date,
        turnoView.duration,
      );
    }

    // Buscar un espacio disponible para asignar
    let workspace: WorkSpace | null = null;
    if (isMultiDay) {
      // Para servicios multi-día, buscar workspace para TODOS los días
      const durationDays = this.getMultiDayDuration(servicios);
      workspace = await this.findAvailableWorkspaceForMultiDays(
        turnoView.date,
        durationDays,
      );
    } else {
      // Para servicios normales, buscar workspace para ese día/horario
      workspace = await this.findAvailableWorkspace(
        turnoView.date,
        turnoView.duration,
      );
    }

    const newTurno = new Turno(
      car,
      estado_turno.PENDIENTE,
      turnoView.observacion,
      servicios,
      turnoView.date,
      turnoView.duration,
      turnoView.totalPrice,
    );
    if (workspace) {
      newTurno.workspace = workspace;
    }
    const turno = this.turnoRepository.create(newTurno);
    this.turnoRepository.save(turno);

    // Enviar email de confirmación con formato HTML
    const htmlContent = this.generateTurnoCreatedEmailTemplate(
      newTurno,
      isMultiDay,
      isMultiDay ? this.getMultiDayDuration(servicios) : 0,
    );
    this.mailService.sendHtmlMail(
      newTurno.car.user.email,
      '✅ Turno Confirmado - Car Detailing',
      htmlContent,
      `Turno agendado para el ${this.mailService.formateDate(newTurno.fechaHora)} en el auto ${newTurno.car.marca} ${newTurno.car.model} ${newTurno.car.patente}`,
    );
    return turno;
  }

  private async validateTimeSlotAvailability(
    requestedDateTime: Date,
    duration: number,
  ): Promise<void> {
    // Asegurarse de que sea un objeto Date válido
    const dateObj = new Date(requestedDateTime);

    // Obtener la fecha para buscar turnos del día
    const dateString = dateObj.toISOString().split('T')[0];

    // Obtener todos los turnos del día
    const existingTurnos = await this.findDate(dateString);

    // Obtener cantidad de espacios activos
    const activeWorkspaces = await this.workspaceService.getActiveCount();
    // Si no hay espacios configurados, funciona como antes (1 turno por slot)
    const maxConcurrent = activeWorkspaces > 0 ? activeWorkspaces : 1;

    // Crear las fechas de inicio y fin del nuevo turno
    const newTurnoStart = new Date(dateObj);
    const newTurnoEnd = new Date(dateObj);
    newTurnoEnd.setMinutes(newTurnoEnd.getMinutes() + duration);

    // Contar cuántos turnos se solapan con el horario solicitado
    let overlappingCount = 0;
    for (const existingTurno of existingTurnos) {
      const existingStart = new Date(existingTurno.fechaHora);
      const existingEnd = new Date(existingTurno.fechaHora);
      existingEnd.setMinutes(
        existingEnd.getMinutes() + (existingTurno.duration || 60),
      );

      // Verificar si hay solapamiento
      const hasOverlap =
        newTurnoStart < existingEnd && newTurnoEnd > existingStart;

      if (hasOverlap) {
        overlappingCount++;
      }
    }

    // Solo bloquear si todos los espacios están ocupados
    if (overlappingCount >= maxConcurrent) {
      throw new HttpException(
        `El horario solicitado (${newTurnoStart.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - ${newTurnoEnd.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}) ` +
          `no tiene espacios disponibles. Todos los ${maxConcurrent} espacio(s) están ocupados en ese horario.`,
        400,
      );
    }
  }

  /**
   * Encuentra un espacio de trabajo disponible para un turno en un horario dado.
   */
  private async findAvailableWorkspace(
    requestedDateTime: Date,
    duration: number,
  ): Promise<WorkSpace | null> {
    const activeWorkspaces = await this.workspaceService.findActive();
    if (activeWorkspaces.length === 0) return null;

    const dateObj = new Date(requestedDateTime);
    const dateString = dateObj.toISOString().split('T')[0];
    const existingTurnos = await this.findDate(dateString);

    const newTurnoStart = new Date(dateObj);
    const newTurnoEnd = new Date(dateObj);
    newTurnoEnd.setMinutes(newTurnoEnd.getMinutes() + duration);

    // Recopilar todos los workspaces libres en el horario solicitado
    const freeWorkspaces: WorkSpace[] = [];
    for (const workspace of activeWorkspaces) {
      let isFree = true;
      for (const turno of existingTurnos) {
        if (turno.workspace?.id !== workspace.id) continue;

        const existingStart = new Date(turno.fechaHora);
        const existingEnd = new Date(turno.fechaHora);
        existingEnd.setMinutes(
          existingEnd.getMinutes() + (turno.duration || 60),
        );

        if (newTurnoStart < existingEnd && newTurnoEnd > existingStart) {
          isFree = false;
          break;
        }
      }
      if (isFree) freeWorkspaces.push(workspace);
    }

    if (freeWorkspaces.length === 0) return null;

    // Selección aleatoria (Fisher-Yates shuffle, tomar el primero)
    for (let i = freeWorkspaces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freeWorkspaces[i], freeWorkspaces[j]] = [
        freeWorkspaces[j],
        freeWorkspaces[i],
      ];
    }
    return freeWorkspaces[0];
  }

  /**
   * Encuentra un espacio de trabajo disponible durante TODOS los días de un servicio multi-día
   * @param startDate - Fecha de inicio (será primer día del período)
   * @param durationDays - Número de días que durará el servicio
   * @returns WorkSpace disponible durante todo el período, o null si no hay
   */
  private async findAvailableWorkspaceForMultiDays(
    startDate: Date,
    durationDays: number,
  ): Promise<WorkSpace | null> {
    const activeWorkspaces = await this.workspaceService.findActive();
    if (activeWorkspaces.length === 0) return null;

    const dateObj = new Date(startDate);
    dateObj.setHours(0, 0, 0, 0);

    // Para cada workspace, verificar que esté libre durante TODOS los días
    for (const workspace of activeWorkspaces) {
      let isAvailableForAllDays = true;

      for (let dayOffset = 0; dayOffset < durationDays; dayOffset++) {
        const currentDate = new Date(dateObj);
        currentDate.setDate(currentDate.getDate() + dayOffset);
        const dateString = currentDate.toISOString().split('T')[0];

        // Obtener todos los turnos de ese día
        const existingTurnos = await this.findDate(dateString);

        // Verificar si ese workspace está asignado a algún turno ese día
        const workspaceUsedThatDay = existingTurnos.some(
          (t) => t.workspace?.id === workspace.id,
        );

        if (workspaceUsedThatDay) {
          isAvailableForAllDays = false;
          break;
        }
      }

      // Si este workspace está disponible todos los días, devolverlo
      if (isAvailableForAllDays) {
        return workspace;
      }
    }

    return null;
  }

  /**
   * Calcula el precio total de un turno basado en los servicios y tipo de vehículo
   * @param servicios - Array de servicios con precios
   * @param tipoVehiculo - Tipo de vehículo para obtener el precio correcto
   * @returns Precio total calculado
   */
  private calculateTotalPrice(servicios: any[], tipoVehiculo: string): number {
    const tipoVehiculoUpper = tipoVehiculo.toUpperCase();

    return servicios.reduce((total, servicio) => {
      // Buscar el precio para el tipo de vehículo específico
      const precioServicio = servicio.precio?.find(
        (p: any) => p.tipoVehiculo === tipoVehiculoUpper,
      );

      return total + (precioServicio ? Number(precioServicio.precio) : 0);
    }, 0);
  }

  /**
   * Detecta si hay servicios multi-día en un array de servicios
   * @param servicios - Array de servicios
   * @returns true si hay al menos un servicio multi-día
   */
  private hasMultiDayServices(servicios: any[]): boolean {
    return servicios.some((s) => s.isMultiDay === true && s.durationDays > 0);
  }

  /**
   * Calcula la duración total en minutos de un turno considerando servicios multi-día
   * Si hay servicios multi-día, retorna: durationDays * horasTrabajo * 60
   * @param servicios - Array de servicios del turno
   * @param duration - Duración base en minutos
   * @returns Duración total en minutos
   */
  private calculateTotalDuration(servicios: any[], duration: number): number {
    // Verificar si hay servicios multi-día
    const multiDayServices = servicios.filter(
      (s) => s.isMultiDay === true && s.durationDays > 0,
    );

    if (multiDayServices.length > 0) {
      // Tomar el servicio multi-día con más días
      const maxDays = Math.max(...multiDayServices.map((s) => s.durationDays));
      const horasTrabajo = empresaInfo.horarioAtencion.horasTrabajo;
      return maxDays * horasTrabajo * 60; // Convertir a minutos
    }

    return duration;
  }

  /**
   * Obtiene el número de días que un turno ocupará
   * @param servicios - Array de servicios del turno
   * @returns Número de días
   */
  private getMultiDayDuration(servicios: any[]): number {
    const multiDayServices = servicios.filter(
      (s) => s.isMultiDay === true && s.durationDays > 0,
    );

    if (multiDayServices.length > 0) {
      return Math.max(...multiDayServices.map((s) => s.durationDays));
    }

    return 0;
  }

  /**
   * Valida disponibilidad considerando servicios multi-día
   * Para servicios multi-día, valida que TODOS los días tengan espacio disponible en algún workspace
   */
  private async validateMultiDayAvailability(
    requestedDateTime: Date,
    durationDays: number,
    servicios: any[],
  ): Promise<void> {
    const dateObj = new Date(requestedDateTime);
    dateObj.setHours(0, 0, 0, 0);

    const activeWorkspaces = await this.workspaceService.getActiveCount();
    const maxConcurrent = activeWorkspaces > 0 ? activeWorkspaces : 1;

    // Verificar que haya un workspace disponible para TODO el período
    const workspaceForPeriod = await this.findAvailableWorkspaceForMultiDays(
      requestedDateTime,
      durationDays,
    );

    if (!workspaceForPeriod) {
      throw new HttpException(
        `No hay espacios de trabajo disponibles para los ${durationDays} día(s) solicitados. ` +
          `Todos los espacios están ocupados en una o más fechas del período.`,
        400,
      );
    }

    // Además, validar que cada día individual tenga espacio
    for (let dayOffset = 0; dayOffset < durationDays; dayOffset++) {
      const currentDate = new Date(dateObj);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dateString = currentDate.toISOString().split('T')[0];

      const existingTurnos = await this.findDate(dateString);

      // Contar turnos multi-día que se solapan en este día
      let overlappingMultiDayCount = 0;
      for (const turno of existingTurnos) {
        if (turno.servicio?.some((s: any) => s.isMultiDay)) {
          overlappingMultiDayCount++;
        }
      }

      if (overlappingMultiDayCount >= maxConcurrent) {
        throw new HttpException(
          `El día ${currentDate.toLocaleDateString('es-AR')} (día ${dayOffset + 1} del servicio) ` +
            `no tiene espacios disponibles para servicios multi-día. Todos los ${maxConcurrent} espacio(s) están ocupados.`,
          400,
        );
      }
    }
  }

  //VERIFICAR!!!!!!!!!!, agregar validaciones con respecto a la fecha (y posiblemente a los demas campos, try no funciona como deberia)
  async modifyTurno(turno: ModifyTurnoDto): Promise<Turno> {
    const existingTurno = await this.turnoRepository.findOne({
      where: { id: turno.turnoId },
      relations: ['car', 'car.user', 'servicio', 'pago'],
    });
    if (!existingTurno) {
      throw new HttpException('Turno not found', 404);
    }

    // Validación: no se pueden modificar servicios si el turno ya fue pagado
    const pagosCompletados =
      existingTurno.pago?.filter((p) => p.estado === 'PAGADO') || [];
    const totalPagado = pagosCompletados.reduce((sum, p) => sum + p.monto, 0);

    if (totalPagado > 0) {
      // Verificar si los servicios están siendo modificados
      const existingServiceIds = existingTurno.servicio
        .map((s) => s.id)
        .sort()
        .join(',');
      const newServiceIds = [...turno.servicios].sort().join(',');

      if (existingServiceIds !== newServiceIds) {
        throw new HttpException(
          'No se pueden modificar los servicios de un turno que ya tiene pagos registrados. Solo se puede cambiar la fecha y observación.',
          400,
        );
      }
    }

    // Validar disponibilidad del nuevo horario si cambió la fecha
    const existingDate = new Date(existingTurno.fechaHora).getTime();
    const newDate = new Date(turno.fechaHora).getTime();
    if (existingDate !== newDate) {
      const duration = existingTurno.duration || 60;
      await this.validateTimeSlotAvailability(turno.fechaHora, duration);
    }

    try {
      existingTurno.fechaHora = turno.fechaHora;
      existingTurno.estado = turno.estado;
      existingTurno.observacion = turno.observacion;

      const servicios = await this.servicioService.findByIds(turno.servicios);
      existingTurno.servicio = servicios;

      // Recalcular el precio total basado en los nuevos servicios
      const nuevoTotalPrice = this.calculateTotalPrice(
        servicios,
        existingTurno.car.type,
      );
      existingTurno.totalPrice = nuevoTotalPrice;

      this.turnoRepository.save(existingTurno);
    } catch (error) {
      throw new HttpException('Error modifying Turno: ' + error.message, 500);
    }

    // Enviar email de modificación con formato HTML
    const htmlContent = this.generateTurnoModifiedEmailTemplate(existingTurno);
    this.mailService.sendHtmlMail(
      existingTurno.car.user.email,
      '📅 Turno Modificado - Car Detailing',
      htmlContent,
      `Turno reagendado para el ${this.mailService.formateDate(existingTurno.fechaHora)} en el auto ${existingTurno.car.marca} ${existingTurno.car.model} ${existingTurno.car.patente}`,
    );
    return existingTurno;
  }

  async deleteTurno(turnoId: number): Promise<void> {
    const turno = await this.turnoRepository.findOneBy({ id: turnoId });
    if (turno) {
      await this.turnoRepository.remove(turno);
    } else {
      throw new HttpException('Turno not found', 404);
    }

    // Enviar email de cancelación con formato HTML
    const htmlContent = this.generateTurnoCancelledEmailTemplate(turno);
    this.mailService.sendHtmlMail(
      turno.car.user.email,
      '❌ Turno Cancelado - Car Detailing',
      htmlContent,
      `Turno cancelado que estaba agendado para el ${this.mailService.formateDate(turno.fechaHora)} en el auto ${turno.car.marca} ${turno.car.model} ${turno.car.patente}`,
    );
  }

  async findById(turnoId: number): Promise<Turno> {
    return await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['car', 'car.user', 'servicio'], // Assuming you want to load related entities
    });
  }

  // NEED TO FIX THIS METHOD TO GET TURNOS BY USER,dont work properly
  async findByUser(user: Users): Promise<Turno[]> {
    return await this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.car', 'car')
      .leftJoinAndSelect('car.user', 'user')
      .leftJoinAndSelect('turno.servicio', 'servicio')
      .leftJoinAndSelect('turno.pago', 'pago')
      .where('user.id = :userId', { userId: user.id })
      .orderBy('turno.fechaHora', 'DESC')
      .getMany();
  }

  async findDate(targetDate?: string): Promise<Turno[]> {
    // Si no se proporciona fecha, usar la fecha actual
    const baseDate = targetDate ? new Date(targetDate) : new Date();

    // Inicio del día: 00:00:00.000
    const startDate = new Date(baseDate);
    startDate.setHours(0, 0, 0, 0);

    // Final del día: 23:59:59.999
    const endDate = new Date(baseDate);
    endDate.setHours(23, 59, 59, 999);

    const turnos = await this.turnoRepository.find({
      where: {
        fechaHora: Between(startDate, endDate),
        estado: estado_turno.PENDIENTE, // Solo turnos activos que ocupan horarios
      },
      relations: ['car', 'car.user', 'servicio', 'workspace'],
    });

    return turnos;
  }

  /**
   * Encuentra todos los turnos de un día específico dado como objeto Date
   * Acepta fechas en formato: "Fri Dec 12 2025 00:00:00 GMT-0300"
   * @param targetDate - Objeto Date con la fecha a buscar
   * @returns Array de turnos del día especificado
   */
  async findTurnosByDate(targetDate: Date): Promise<Turno[]> {
    // Crear objeto Date asegurando que sea válido
    const dateObj = new Date(targetDate);

    // Validar que la fecha sea válida
    if (isNaN(dateObj.getTime())) {
      throw new HttpException('Fecha inválida proporcionada', 400);
    }

    // Inicio del día: 00:00:00.000
    const startDate = new Date(dateObj);
    startDate.setHours(0, 0, 0, 0);

    // Final del día: 23:59:59.999
    const endDate = new Date(dateObj);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `🔍 Buscando turnos entre ${startDate.toISOString()} y ${endDate.toISOString()}`,
    );

    const turnos = await this.turnoRepository.find({
      where: {
        fechaHora: Between(startDate, endDate),
        estado: estado_turno.PENDIENTE, // Solo turnos activos que ocupan horarios
      },
      relations: ['car', 'car.user', 'servicio', 'workspace'],
      order: {
        fechaHora: 'ASC',
      },
    });

    console.log(
      `✅ Encontrados ${turnos.length} turnos para la fecha ${dateObj.toLocaleDateString('es-AR')}`,
    );

    return turnos;
  }

  async getAvailableTimeSlots(
    targetDate: string,
    duration: number,
    isMultiDay: boolean = false,
    multiDayDuration: number = 0,
  ): Promise<any> {
    // Si es multi-día, validar disponibilidad para TODOS los días
    if (isMultiDay && multiDayDuration > 0) {
      try {
        const dateObj = new Date(targetDate + 'T00:00:00');
        // Validar que hay un workspace disponible para todo el período
        const availableWorkspace =
          await this.findAvailableWorkspaceForMultiDays(
            dateObj,
            multiDayDuration,
          );

        if (!availableWorkspace) {
          // No hay workspace disponible para el período multi-día
          return {
            date: targetDate,
            duration: duration,
            isMultiDay: true,
            multiDayDuration: multiDayDuration,
            totalSpaces: await this.workspaceService.getActiveCount(),
            slots: [], // Retornar slots vacíos - no hay disponibilidad
            occupiedTurnos: [],
            message: `No hay espacios de trabajo disponibles para los ${multiDayDuration} día(s) completos solicitados.`,
          };
        }

        // Validar cada día individual
        for (let dayOffset = 0; dayOffset < multiDayDuration; dayOffset++) {
          const currentDate = new Date(dateObj);
          currentDate.setDate(currentDate.getDate() + dayOffset);
          const dateString = currentDate.toISOString().split('T')[0];

          const existingTurnos = await this.findDate(dateString);
          const activeWorkspaces = await this.workspaceService.getActiveCount();
          const maxConcurrent = activeWorkspaces > 0 ? activeWorkspaces : 1;

          // Contar turnos multi-día
          let overlappingMultiDayCount = 0;
          for (const turno of existingTurnos) {
            if (turno.servicio?.some((s: any) => s.isMultiDay)) {
              overlappingMultiDayCount++;
            }
          }

          if (overlappingMultiDayCount >= maxConcurrent) {
            // No hay disponibilidad en alguno de los días
            return {
              date: targetDate,
              duration: duration,
              isMultiDay: true,
              multiDayDuration: multiDayDuration,
              totalSpaces: maxConcurrent,
              slots: [], // Retornar vacío
              occupiedTurnos: [],
              message: `El día ${currentDate.toLocaleDateString('es-AR')} (día ${dayOffset + 1} del servicio) no tiene espacios disponibles.`,
            };
          }
        }

        // Si llegamos aquí, hay disponibilidad multi-día
        // Retornar solo el primer slot disponible (ya que es multi-día, no hay "horarios")
        return {
          date: targetDate,
          duration: duration,
          isMultiDay: true,
          multiDayDuration: multiDayDuration,
          totalSpaces: await this.workspaceService.getActiveCount(),
          slots: [
            {
              time: '08:00', // Horario de inicio (empresa comienza a las 8:00)
              available: true,
              availableSpaces: 1,
              isMultiDaySlot: true,
            },
          ],
          occupiedTurnos: [],
          message: `Disponibilidad confirmada para los ${multiDayDuration} día(s) solicitados.`,
        };
      } catch (error) {
        return {
          date: targetDate,
          duration: duration,
          isMultiDay: true,
          multiDayDuration: multiDayDuration,
          totalSpaces: await this.workspaceService.getActiveCount(),
          slots: [],
          occupiedTurnos: [],
          message: `Error validando disponibilidad: ${error.message}`,
        };
      }
    }

    // Lógica original para servicios de un solo día
    // Obtener todos los turnos del día especificado
    const turnos = await this.findTurnosByDate(
      new Date(targetDate + 'T00:00:00'),
    );

    // Obtener cantidad de espacios activos
    const activeWorkspaces = await this.workspaceService.getActiveCount();
    const maxConcurrent = activeWorkspaces > 0 ? activeWorkspaces : 1;

    // Configuración de horarios de trabajo
    const workStartHour = 8; // 8:00 AM
    const workEndHour = 19; // 7:00 PM
    const slotInterval = 60; // Intervalos de 60 minutos

    // Crear lista de todos los slots posibles
    const allSlots: string[] = [];
    for (let hour = workStartHour; hour < workEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeString);
      }
    }

    // Crear mapa de ocupación por slot (cuántos turnos hay en cada slot)
    const occupiedSlotCounts = new Map<string, number>();

    for (const turno of turnos) {
      const turnoStart = new Date(turno.fechaHora);

      const turnoStartTime = `${turnoStart.getHours().toString().padStart(2, '0')}:${turnoStart.getMinutes().toString().padStart(2, '0')}`;

      // Marcar como ocupados todos los slots que coinciden con la duración del turno
      const turnoDuration = turno.duration || 60; // Duración por defecto si no está definida
      const slotsToBlock = Math.ceil(turnoDuration / slotInterval);

      const startSlotIndex = allSlots.indexOf(turnoStartTime);
      if (startSlotIndex !== -1) {
        for (let i = 0; i < slotsToBlock; i++) {
          if (startSlotIndex + i < allSlots.length) {
            const slotKey = allSlots[startSlotIndex + i];
            occupiedSlotCounts.set(
              slotKey,
              (occupiedSlotCounts.get(slotKey) || 0) + 1,
            );
          }
        }
      }
    }

    // Determinar slots disponibles considerando la duración solicitada y espacios
    const availableSlots: {
      time: string;
      available: boolean;
      availableSpaces: number;
    }[] = [];
    const slotsNeeded = Math.ceil(duration / slotInterval);

    for (let i = 0; i <= allSlots.length - slotsNeeded; i++) {
      const currentTime = allSlots[i];

      // Verificar la ocupación máxima en los slots necesarios
      let maxOccupied = 0;
      for (let j = 0; j < slotsNeeded; j++) {
        if (i + j < allSlots.length) {
          const count = occupiedSlotCounts.get(allSlots[i + j]) || 0;
          maxOccupied = Math.max(maxOccupied, count);
        }
      }

      const spacesAvailable = maxConcurrent - maxOccupied;

      availableSlots.push({
        time: currentTime,
        available: spacesAvailable > 0,
        availableSpaces: Math.max(0, spacesAvailable),
      });
    }

    // Agregar los slots restantes como no disponibles si no hay suficiente tiempo
    for (let i = allSlots.length - slotsNeeded + 1; i < allSlots.length; i++) {
      if (i >= 0) {
        availableSlots.push({
          time: allSlots[i],
          available: false,
          availableSpaces: 0,
        });
      }
    }

    return {
      date: targetDate,
      duration: duration,
      totalSpaces: maxConcurrent,
      slots: availableSlots,
      occupiedTurnos: turnos.map((t) => {
        return {
          id: t.id,
          fechaHora: t.fechaHora,
          duration: t.duration,
          servicios: t.servicio.map((s) => s.name),
          workspace: t.workspace?.name || null,
        };
      }),
    };
  }

  async findAll(): Promise<Turno[]> {
    return await this.turnoRepository.find({
      relations: ['car', 'car.user', 'servicio', 'pago', 'workspace'],
      order: {
        fechaHora: 'DESC',
      },
    });
  }

  async markAsCompleted(turnoId: number): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['car', 'car.user', 'servicio', 'servicio.Producto'],
    });

    if (!turno) {
      throw new Error('Turno not found');
    }

    turno.estado = estado_turno.FINALIZADO;

    // Descontar stock automáticamente de los productos asociados a los servicios
    try {
      await this.productoService.descontarStockPorServicios(turno.servicio);
      console.log(`Stock descontado automáticamente para turno ${turnoId}`);
    } catch (error) {
      console.error(`Error descontando stock para turno ${turnoId}:`, error);
      // No fallar el turno si hay error con el stock, solo loguear
    }

    return await this.turnoRepository.save(turno);
  }

  async cancelTurno(turnoId: number): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['car', 'car.user', 'servicio', 'pago'],
    });

    if (!turno) {
      throw new Error('Turno not found');
    }

    // Validación: no se puede cancelar si el turno ya está pagado
    const pagosCompletados =
      turno.pago?.filter((p) => p.estado === 'PAGADO') || [];
    const totalPagado = pagosCompletados.reduce((sum, p) => sum + p.monto, 0);
    if (totalPagado >= turno.totalPrice) {
      throw new HttpException(
        'No se puede cancelar un turno que ya está pagado',
        400,
      );
    }

    // Verificar que el turno se puede cancelar (más de 24 horas antes)
    const turnoDate = new Date(turno.fechaHora);
    const now = new Date();
    const timeDiff = turnoDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff <= 24) {
      throw new HttpException(
        'No se puede cancelar un turno con menos de 24 horas de anticipación',
        400,
      );
    }

    turno.estado = estado_turno.CANCELADO;

    // Enviar email de cancelación con formato HTML
    const htmlContent = this.generateTurnoCancelledEmailTemplate(turno);
    this.mailService.sendHtmlMail(
      turno.car.user.email,
      '❌ Turno Cancelado - Car Detailing',
      htmlContent,
      `Turno cancelado que estaba agendado para el ${this.mailService.formateDate(turno.fechaHora)} en el auto ${turno.car.marca} ${turno.car.model} ${turno.car.patente}`,
    );
    return await this.turnoRepository.save(turno);
  }

  // ============ TEMPLATES DE EMAIL HTML ============

  private generateTurnoCreatedEmailTemplate(
    turno: Turno,
    isMultiDay: boolean = false,
    durationDays: number = 0,
  ): string {
    const serviciosList = turno.servicio
      .map(
        (servicio) => `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; background-color: #f8f9fa;">
            <strong>${servicio.name}</strong>
            ${servicio.isMultiDay ? '<br><span style="color: #d32f2f; font-size: 12px;">⏱️ Servicio Multi-Día</span>' : ''}
          </td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
            ${servicio.isMultiDay ? `${servicio.durationDays} día(s)` : `${servicio.duration} min`}
          </td>
        </tr>
      `,
      )
      .join('');

    const durationHours = Math.floor(turno.duration / 60);
    const durationMinutes = turno.duration % 60;

    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Turno Confirmado - Car Detailing</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background-color: white; 
              border-radius: 12px; 
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #28a745, #20c997); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600; 
            }
            .content { 
              padding: 30px 20px; 
            }
            .success-box {
              background-color: #d4edda;
              border: 2px solid #c3e6cb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .info-section {
              background-color: #e3f2fd;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .car-info {
              background-color: #f8f9fa;
              border-left: 4px solid #007bff;
              padding: 15px;
              margin: 15px 0;
            }
            .multi-day-alert {
              background-color: #fff3cd;
              border: 2px solid #ffc107;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
              border-radius: 8px;
              overflow: hidden;
            }
            th { 
              background: linear-gradient(135deg, #007bff, #0056b3); 
              color: white; 
              padding: 15px; 
              font-weight: 600; 
              text-align: left; 
            }
            .date-time {
              font-size: 24px;
              font-weight: bold;
              color: #28a745;
              text-align: center;
              margin: 20px 0;
            }
            .total-price {
              font-size: 20px;
              font-weight: bold;
              color: #007bff;
              text-align: center;
              background-color: #e3f2fd;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer { 
              background-color: #f8f9fa;
              padding: 20px; 
              border-top: 1px solid #dee2e6; 
              font-size: 13px; 
              color: #6c757d; 
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ ¡Turno Confirmado!</h1>
              <p>Tu cita ha sido agendada exitosamente</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <h2 style="margin: 0; color: #155724;">🎉 ¡Perfecto!</h2>
                <p style="margin: 10px 0 0 0; color: #155724;">Hemos recibido tu solicitud y tu turno está confirmado.</p>
              </div>

              <div class="date-time">
                📅 ${this.mailService.formateDate(turno.fechaHora)} a las ${new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              <div class="car-info">
                <h3 style="margin-top: 0; color: #007bff;">🚗 Información del Vehículo</h3>
                <p><strong>Marca:</strong> ${turno.car.marca}</p>
                <p><strong>Modelo:</strong> ${turno.car.model}</p>
                <p><strong>Patente:</strong> ${turno.car.patente}</p>
                <p><strong>Color:</strong> ${turno.car.color}</p>
                <p><strong>Tipo:</strong> ${turno.car.type}</p>
              </div>

              <div class="info-section">
                <h3 style="margin-top: 0; color: #1976d2;">🛠️ Servicios Solicitados</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${serviciosList}
                  </tbody>
                </table>
                <p><strong>Duración total estimada:</strong> ${durationHours > 0 ? `${durationHours}h ${durationMinutes}min` : `${turno.duration} minutos`}</p>
              </div>

              ${
                isMultiDay
                  ? `
                <div class="multi-day-alert">
                  <h3 style="margin-top: 0; color: #d32f2f;">⏱️ Servicio Multi-Día</h3>
                  <p style="margin: 10px 0;"><strong>Este turno durará ${durationDays} día(s) completo(s)</strong></p>
                  <p style="margin: 10px 0; color: #666;">Tu vehículo ocupará el espacio de trabajo durante todo ese período (${empresaInfo.horarioAtencion.horaInicio}:00 - ${empresaInfo.horarioAtencion.horaFin}:00 diarios)</p>
                  <p style="margin: 0; color: #d32f2f;">⚠️ Solo podrás retirar tu vehículo cuando se complete el servicio.</p>
                </div>
              `
                  : ''
              }

              <div class="total-price">
                💰 Total: $${turno.totalPrice.toLocaleString('es-AR')}
              </div>

              ${
                turno.workspace
                  ? `
                <div style="background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2e7d32;">📍 Espacio de Trabajo Asignado</h3>
                  <p style="margin: 0;"><strong>${turno.workspace.name}</strong></p>
                  ${
                    turno.workspace.description
                      ? `<p style="margin: 8px 0 0 0; color: #555;">${turno.workspace.description}</p>`
                      : ''
                  }
                </div>
              `
                  : ''
              }

              ${
                turno.observacion
                  ? `
                <div class="info-section">
                  <h3 style="margin-top: 0; color: #1976d2;">📝 Observaciones</h3>
                  <p>${turno.observacion}</p>
                </div>
              `
                  : ''
              }

              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #856404;">📋 Información Importante</h4>
                <ul style="margin: 0; color: #856404;">
                  <li>Llegá 10 minutos antes de tu turno</li>
                  <li>Traé las llaves y documentación del vehículo</li>
                  <li>Si necesitás cancelar, hacelo con 24hs de anticipación</li>
                  <li>Podés contactarnos por cualquier consulta</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>¡Gracias por confiar en Car Detailing!</strong></p>
              <p>📧 ${empresaInfo.email} | 📞 ${empresaInfo.telefono}</p>
              <p>📍${empresaInfo.sucursal.direccion} - ${empresaInfo.sucursal.localidad}, ${empresaInfo.sucursal.provincia}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateTurnoModifiedEmailTemplate(turno: Turno): string {
    const serviciosList = turno.servicio
      .map(
        (servicio) => `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; background-color: #f8f9fa;">
            <strong>${servicio.name}</strong>
          </td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
            ${servicio.duration} min
          </td>
        </tr>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Turno Modificado - Car Detailing</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background-color: white; 
              border-radius: 12px; 
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #ffc107, #e0a800); 
              color: #333; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600; 
            }
            .content { 
              padding: 30px 20px; 
            }
            .warning-box {
              background-color: #fff3cd;
              border: 2px solid #ffc107;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .info-section {
              background-color: #e3f2fd;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .car-info {
              background-color: #f8f9fa;
              border-left: 4px solid #007bff;
              padding: 15px;
              margin: 15px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
              border-radius: 8px;
              overflow: hidden;
            }
            th { 
              background: linear-gradient(135deg, #007bff, #0056b3); 
              color: white; 
              padding: 15px; 
              font-weight: 600; 
              text-align: left; 
            }
            .date-time {
              font-size: 24px;
              font-weight: bold;
              color: #ffc107;
              text-align: center;
              margin: 20px 0;
            }
            .footer { 
              background-color: #f8f9fa;
              padding: 20px; 
              border-top: 1px solid #dee2e6; 
              font-size: 13px; 
              color: #6c757d; 
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Turno Modificado</h1>
              <p>Tu cita ha sido reagendada</p>
            </div>
            
            <div class="content">
              <div class="warning-box">
                <h2 style="margin: 0; color: #856404;">🔄 Cambios Realizados</h2>
                <p style="margin: 10px 0 0 0; color: #856404;">Los detalles de tu turno han sido actualizados.</p>
              </div>

              <div class="date-time">
                📅 Nueva fecha: ${this.mailService.formateDate(turno.fechaHora)} a las ${new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              <div class="car-info">
                <h3 style="margin-top: 0; color: #007bff;">🚗 Información del Vehículo</h3>
                <p><strong>Marca:</strong> ${turno.car.marca}</p>
                <p><strong>Modelo:</strong> ${turno.car.model}</p>
                <p><strong>Patente:</strong> ${turno.car.patente}</p>
                <p><strong>Color:</strong> ${turno.car.color}</p>
                <p><strong>Tipo:</strong> ${turno.car.type}</p>
              </div>

              <div class="info-section">
                <h3 style="margin-top: 0; color: #1976d2;">🛠️ Servicios</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${serviciosList}
                  </tbody>
                </table>
                <p><strong>Duración total estimada:</strong> ${turno.duration} minutos</p>
              </div>

              ${
                turno.observacion
                  ? `
                <div class="info-section">
                  <h3 style="margin-top: 0; color: #1976d2;">📝 Observaciones</h3>
                  <p>${turno.observacion}</p>
                </div>
              `
                  : ''
              }

              <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #0c5460;">💡 Recordatorio</h4>
                <ul style="margin: 0; color: #0c5460;">
                  <li>Llegá 10 minutos antes de tu nuevo horario</li>
                  <li>Si tenés alguna duda, no dudes en contactarnos</li>
                  <li>Agendá este nuevo horario en tu calendario</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Gracias por tu flexibilidad - Car Detailing</strong></p>
              <p>📧 info@cardetailing.com | 📞 +54 11 1234-5678</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateTurnoCancelledEmailTemplate(turno: Turno): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Turno Cancelado - Car Detailing</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f8f9fa;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background-color: white; 
              border-radius: 12px; 
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #dc3545, #c82333); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 600; 
            }
            .content { 
              padding: 30px 20px; 
            }
            .cancel-box {
              background-color: #f8d7da;
              border: 2px solid #f5c6cb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .info-section {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .car-info {
              background-color: #f8f9fa;
              border-left: 4px solid #dc3545;
              padding: 15px;
              margin: 15px 0;
            }
            .date-time {
              font-size: 20px;
              font-weight: bold;
              color: #dc3545;
              text-align: center;
              margin: 20px 0;
              text-decoration: line-through;
            }
            .footer { 
              background-color: #f8f9fa;
              padding: 20px; 
              border-top: 1px solid #dee2e6; 
              font-size: 13px; 
              color: #6c757d; 
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Turno Cancelado</h1>
              <p>Tu cita ha sido cancelada</p>
            </div>
            
            <div class="content">
              <div class="cancel-box">
                <h2 style="margin: 0; color: #721c24;">😔 Lamentamos informarte</h2>
                <p style="margin: 10px 0 0 0; color: #721c24;">Tu turno ha sido cancelado.</p>
              </div>

              <div class="date-time">
                📅 ${this.mailService.formateDate(turno.fechaHora)} a las ${new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              <div class="car-info">
                <h3 style="margin-top: 0; color: #dc3545;">🚗 Detalles del Turno Cancelado</h3>
                <p><strong>Vehículo:</strong> ${turno.car.marca} ${turno.car.model}</p>
                <p><strong>Patente:</strong> ${turno.car.patente}</p>
                <p><strong>Color:</strong> ${turno.car.color}</p>
                <p><strong>Tipo:</strong> ${turno.car.type}</p>
              </div>

              <div class="info-section">
                <h3 style="margin-top: 0; color: #495057;">📞 ¿Querés agendar un nuevo turno?</h3>
                <p>Entendemos que a veces surgen imprevistos. Estamos aquí para ayudarte a reprogramar tu cita cuando te sea conveniente.</p>
                <ul>
                  <li>Llamanos al +54 11 1234-5678</li>
                  <li>Escribinos a info@cardetailing.com</li>
                  <li>Visitá nuestro sitio web para agendar online</li>
                </ul>
              </div>

              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #155724;">💚 Te esperamos pronto</h4>
                <p style="margin: 0; color: #155724;">Estaremos encantados de cuidar tu vehículo cuando estés listo para agendar una nueva cita.</p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Car Detailing - Siempre a tu servicio</strong></p>
              <p>📧 info@cardetailing.com | 📞 +54 11 1234-5678</p>
              <p>Esperamos verte pronto 💙</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
