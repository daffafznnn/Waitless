/* FILE: src/server/models/counter.model.ts */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface CounterAttributes {
  id: number;
  location_id: number;
  name: string;
  description?: string;
  prefix: string;
  open_time: string;
  close_time: string;
  capacity_per_day: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CounterCreationAttributes extends Optional<CounterAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Counter extends Model<CounterAttributes, CounterCreationAttributes> implements CounterAttributes {
  public id!: number;
  public location_id!: number;
  public name!: string;
  public description?: string;
  public prefix!: string;
  public open_time!: string;
  public close_time!: string;
  public capacity_per_day!: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any): void {
    Counter.belongsTo(models.ServiceLocation, {
      foreignKey: 'location_id',
      as: 'location'
    });
    
    Counter.hasMany(models.Ticket, {
      foreignKey: 'counter_id',
      as: 'tickets'
    });
  }
}

export const initCounterModel = (sequelize: Sequelize): typeof Counter => {
  Counter.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      location_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'service_locations',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      prefix: {
        type: DataTypes.STRING(4),
        allowNull: false,
        defaultValue: 'A',
      },
      open_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      close_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      capacity_per_day: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Counter',
      tableName: 'counters',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['location_id'],
        },
        {
          fields: ['is_active'],
        },
      ],
    }
  );

  return Counter;
};