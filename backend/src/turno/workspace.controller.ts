import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
@UseGuards(AuthGuard, RolesGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: { name: string; description?: string }) {
    return await this.workspaceService.create(body.name, body.description);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return await this.workspaceService.findAll();
  }

  @Get('active')
  async findActive() {
    return await this.workspaceService.findActive();
  }

  @Get('count')
  async getActiveCount() {
    return { count: await this.workspaceService.getActiveCount() };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.workspaceService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string; description?: string },
  ) {
    return await this.workspaceService.update(id, body.name, body.description);
  }

  @Patch(':id/toggle')
  @Roles(Role.ADMIN)
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return await this.workspaceService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.workspaceService.remove(id);
    return { message: 'Espacio eliminado correctamente' };
  }
}
