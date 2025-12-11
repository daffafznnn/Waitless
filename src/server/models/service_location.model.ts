/* FILE: src/server/models/service_location.model.ts */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface ServiceLocationAttributes {
  id: number;
  owner_id: number;
  name: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceLocationCreationAttributes extends Optional<ServiceLocationAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class ServiceLocation extends Model<ServiceLocationAttributes, ServiceLocationCreationAttributes> implements ServiceLocationAttributes {
  public id!: number;
  public owner_id!: number;
  public name!: string;
  public address?: string;
  public city?: string;
  public lat?: number;
  public lng?: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any): void {
    ServiceLocation.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner'
    });
    
    ServiceLocation.hasMany(models.LocationMember, {
      foreignKey: 'location_id',
      as: 'members'
    });
    
    ServiceLocation.hasMany(models.Counter, {
      foreignKey: 'location_id',
      as: 'counters'
    });
    
    ServiceLocation.hasMany(models.Ticket, {
      foreignKey: 'location_id',
      as: 'tickets'
    });
    
    ServiceLocation.hasMany(models.DailySummary, {
      foreignKey: 'location_id',
      as: 'dailySummaries'
    });
  }
}

export const initServiceLocationModel = (sequelize: Sequelize): typeof ServiceLocation => {
  ServiceLocation.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      owner_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
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
      modelName: 'ServiceLocation',
      tableName: 'service_locations',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['owner_id'],
        },
        {
          fields: ['city'],
        },
      ],
    }
  );

  return ServiceLocation;
};