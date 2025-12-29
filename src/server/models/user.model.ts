/* FILE: src/server/models/user.model.ts */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export enum Role {
  VISITOR = 'VISITOR',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER'
}

export interface UserAttributes {
  id: number;
  email: string;
  password_hash?: string;
  name: string;
  phone?: string;
  role: Role;
  google_id?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare password_hash?: string;
  declare name: string;
  declare phone?: string;
  declare role: Role;
  declare google_id?: string;
  declare avatar_url?: string;
  
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at?: Date;

  static associate(models: any): void {
    User.hasMany(models.ServiceLocation, {
      foreignKey: 'owner_id',
      as: 'ownedLocations'
    });
    
    User.hasMany(models.LocationMember, {
      foreignKey: 'user_id',
      as: 'memberships'
    });
    
    User.hasMany(models.Ticket, {
      foreignKey: 'user_id',
      as: 'tickets'
    });
    
    User.hasMany(models.TicketEvent, {
      foreignKey: 'actor_id',
      as: 'actions'
    });
  }
}

export const initUserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      google_id: {
        type: DataTypes.STRING(191),
        allowNull: true,
        unique: true,
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM(...Object.values(Role)),
        allowNull: false,
        defaultValue: Role.VISITOR,
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
    }
  );

  return User;
};