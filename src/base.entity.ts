import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';


@Entity()
export abstract class BaseEntity {
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

}
