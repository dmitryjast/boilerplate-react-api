import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('settings')
export class Settings {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: 1400 })
    containerWidth!: number;

    @Column({ nullable: true })
    adminEmail!: string;

    @Column({ nullable: true })
    appName!: string;

    @Column({ nullable: true })
    logo!: string;

    @Column({ nullable: true })
    favicon!: string;

    @Column({ nullable: true })
    metaDescription!: string;

    @Column({ nullable: true })
    metaKeywords!: string;

    @Column('jsonb', { nullable: true })
    phones!: string[];

    @Column({ nullable: true })
    address!: string;

    @Column('jsonb', { nullable: true })
    socialNetworks!: object[];

    @Column({ nullable: true })
    googleAnalyticsId!: string;

    @Column({ nullable: true })
    facebookPixelId!: string;

    @Column({ default: false })
    maintenanceMode!: boolean; 

}