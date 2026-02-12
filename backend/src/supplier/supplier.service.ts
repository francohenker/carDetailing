import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { Users } from '../users/entities/users.entity';
import { Role } from '../roles/role.enum';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create(createSupplierDto);
    return await this.supplierRepository.save(supplier);
  }

  async findAll(): Promise<Supplier[]> {
    return await this.supplierRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async update(
    id: number,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, updateSupplierDto);
    return await this.supplierRepository.save(supplier);
  }

  async remove(id: number): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.remove(supplier);
  }

  async toggleActive(id: number): Promise<Supplier> {
    const supplier = await this.findOne(id);
    supplier.isActive = !supplier.isActive;
    return await this.supplierRepository.save(supplier);
  }

  async createSupplierAccount(
    supplierId: number,
    password: string,
  ): Promise<{ supplier: Supplier; message: string }> {
    const supplier = await this.findOne(supplierId);

    if (supplier.userId) {
      throw new BadRequestException('Este proveedor ya tiene una cuenta de usuario');
    }

    // Check if email is already used by another user
    const existingUser = await this.usersRepository.findOne({
      where: { email: supplier.email },
    });
    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con este email');
    }

    const user = new Users(
      supplier.contactPerson || supplier.name,
      '',
      password,
      supplier.email,
      supplier.phone,
      Role.SUPPLIER,
    );
    const savedUser = await this.usersRepository.save(this.usersRepository.create(user));

    supplier.userId = savedUser.id;
    supplier.user = savedUser;
    await this.supplierRepository.save(supplier);

    return { supplier, message: 'Cuenta de proveedor creada exitosamente' };
  }
}
