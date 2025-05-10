import { BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn, } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { Role } from 'src/enums/role';
import { Car } from 'src/car/entities/car.entity';


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    username: string

    @Exclude()
    @Column()
    password: string

    @Column()
    admin: Role

    @Column()
    email: string

    @Column()
    telefono: number

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




    constructor(username: string, password: string, admin: Role) {
        this.username = username;
        this.password = password;
        this.admin = admin;
    }
}