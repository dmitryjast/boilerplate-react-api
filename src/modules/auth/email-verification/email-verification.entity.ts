import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../users/user.entity";

@Entity('email_verifications')
export class EmailVerification {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ nullable: true })
    token!: string;

    @Column({ nullable: true })
    tokenExpiresAt!: Date;

    @Column({ nullable: true })
    code!: string;

    @Column({ nullable: true })
    codeExpiresAt!: Date;

}