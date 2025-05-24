import { BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn, } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { Role } from 'src/enums/role';
import { Car } from 'src/car/entities/car.entity';


@Entity()
export class Users {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true, type: 'varchar', length: 50 })
    username: string

    // @Column({ type: 'varchar', length: 50, nullable: true })
    // firstname: string

    // @Column({ type: 'varchar', length: 50, unique: true })
    // lastname: string

    @Exclude()
    @Column({type: 'varchar', length: 100, nullable: true})
    password: string

    @Column({type: 'enum', enum: Role, default: Role.USER})
    role: Role

    @Column({type: 'varchar', length: 100, unique: true, nullable: true})
    email: string

    @Column({type: 'varchar', length: 15, unique: true})
    telefono: string

    @OneToMany(() => Car, (car) => car.user)
    cars: Car[];

    async validatePassword(password: string): Promise<boolean> {
        return await bcrypt.compareSync(password, this.password);
    }

    @BeforeInsert()
    async hashPassword() {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }

    constructor(username: string, password: string, email: string, telefono: string, role: Role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.telefono = telefono;
        this.role = role;
    }
}