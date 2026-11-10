import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity('contact_messages')
export class ContactMessage {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    name!: string;

    @Column()
    email!: string;

    @Column({ length: 150 })
    subject!: string;

    @Column({ type: 'text' })
    message!: string;

    // Set when the email to the team was sent. NULL means it has not been sent (yet or because of an SMTP error)
    @Column({ type: 'timestamp', nullable: true })
    sentAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

}
