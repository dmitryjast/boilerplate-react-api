import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../users/user.entity";

@Entity('password_resets')
export class PasswordReset {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    token!: string;

    @Column()
    expiresAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

}