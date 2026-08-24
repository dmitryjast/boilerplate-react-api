import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Exclude } from 'class-transformer'

export enum UserRole {
    ADMIN = 'admin',
    EDITOR = 'editor',
    MANAGER = 'manager',
    USER = 'user',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @Column({ unique: true})
    email!: string;

    @Exclude()
    @Column()
    password!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    userRole!: UserRole;

    @Column({ nullable: true })
    firstName!: string;

    @Column({ nullable: true })
    lastName!: string;

    @Column({ nullable: true })
    userPicture!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ nullable: true })
    verifiedAt!: Date;



}
