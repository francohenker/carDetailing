import { HttpException, Injectable } from '@nestjs/common';
import { Users } from './entities/users.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/role.enum';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { Supplier } from '../supplier/entities/supplier.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    if(createUserDto.password === null){
      throw new HttpException('Password is required', 400);
    }
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new HttpException('El email ingresado ya está en uso', 400);
    }
    if (createUserDto.phone) {
      const existingPhone = await this.userRepository.findOneBy({
        phone: createUserDto.phone,
      });
      if (existingPhone) {
        throw new HttpException('El número de teléfono ingresado ya está en uso', 400);
      }
    }
    const user = new Users(
      createUserDto.firstname.slice(0, 1).toUpperCase() +
        createUserDto.firstname.slice(1),
      createUserDto.lastname.slice(0, 1).toUpperCase() +
        createUserDto.lastname.slice(1),
      createUserDto.password,
      createUserDto.email,
      createUserDto.phone,
      Role.USER,
    );
    const newUser = this.userRepository.create(user);
    return await this.userRepository.save(newUser);
  }

  async changeRole(id: number, role: Role): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    user.role = role;
    const savedUser = await this.userRepository.save(user);

    // Si el nuevo rol es supplier, vincular automáticamente con un Supplier existente por email
    if (role === Role.SUPPLIER) {
      const existingSupplier = await this.supplierRepository.findOne({
        where: { email: user.email },
      });

      if (existingSupplier && !existingSupplier.userId) {
        // Vincular el supplier existente con este usuario
        existingSupplier.userId = user.id;
        await this.supplierRepository.save(existingSupplier);
      } else if (!existingSupplier) {
        // Crear un nuevo supplier vinculado a este usuario
        const newSupplier = this.supplierRepository.create({
          name: `${user.firstname} ${user.lastname || ''}`.trim(),
          email: user.email,
          phone: user.phone || '',
          address: '',
          contactPerson: `${user.firstname} ${user.lastname || ''}`.trim(),
          isActive: true,
          userId: user.id,
        });
        await this.supplierRepository.save(newSupplier);
      }
    }

    // Si se cambia de supplier a otro rol, desvincular el supplier
    if (role !== Role.SUPPLIER) {
      const linkedSupplier = await this.supplierRepository.findOne({
        where: { userId: user.id },
      });
      if (linkedSupplier) {
        linkedSupplier.userId = null;
        await this.supplierRepository.save(linkedSupplier);
      }
    }

    return savedUser;
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    if (bcrypt.compareSync(password, user.password)) {
      return this.authService.generateAccessToken(user);
    }
    throw new HttpException('User or password incorrect', 401);
  }

  async findOne(id: number): Promise<Users | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async getProfile(id: number): Promise<Users> {
    const user = await this.findOne(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return user;
  }

  async getAllUsers(): Promise<Users[]> {
    return this.userRepository.find();
  }

  async updateProfile(id: number, updatedData: UpdateUserDto): Promise<Users> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    // Actualizar solo los campos proporcionados
    Object.assign(user, updatedData);
    return this.userRepository.save(user);
  }
}
