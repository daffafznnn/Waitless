/* FILE: src/server/models/location_member.model.ts */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Role } from './user.model';

export interface LocationMemberAttributes {
  id: number;
  location_id: number;
  user_id: number;
  role: Role;
  is_active: boolean;
  created_at: Date;
}

export interface LocationMemberCreationAttributes extends Optional<LocationMemberAttributes, 'id' | 'created_at'> {}

export class LocationMember extends Model<LocationMemberAttributes, LocationMemberCreationAttributes> implements LocationMemberAttributes {
  public id!: number;
  public location_id!: number;
  public user_id!: number;
  public role!: Role;
  public is_active!: boolean;

  public readonly created_at!: Date;

  static associate(models: any): void {
    LocationMember.belongsTo(models.ServiceLocation, {
      foreignKey: 'location_id',
      as: 'location'
    });
    
    LocationMember.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

export const initLocationMemberModel = (sequelize: Sequelize): typeof LocationMember => {
  LocationMember.init(
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
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      role: {
        type: DataTypes.ENUM(...Object.values(Role)),
        allowNull: false,
        defaultValue: Role.ADMIN,
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
    },
    {
      sequelize,
      modelName: 'LocationMember',
      tableName: 'location_members',
      underscored: true,
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['location_id', 'user_id'],
          name: 'uq_member_loc_user'
        },
      ],
    }
  );

  return LocationMember;
};