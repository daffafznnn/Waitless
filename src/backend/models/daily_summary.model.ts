/* FILE: src/server/models/daily_summary.model.ts */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface DailySummaryAttributes {
  id: number;
  location_id: number;
  date_for: string;
  total_issued: number;
  total_done: number;
  total_hold: number;
  total_cancel: number;
  avg_service_seconds: number;
}

export interface DailySummaryCreationAttributes extends Optional<DailySummaryAttributes, 'id'> {}

export class DailySummary extends Model<DailySummaryAttributes, DailySummaryCreationAttributes> implements DailySummaryAttributes {
  // Use 'declare' to avoid shadowing Sequelize getters
  declare id: number;
  declare location_id: number;
  declare date_for: string;
  declare total_issued: number;
  declare total_done: number;
  declare total_hold: number;
  declare total_cancel: number;
  declare avg_service_seconds: number;

  static associate(models: any): void {
    DailySummary.belongsTo(models.ServiceLocation, {
      foreignKey: 'location_id',
      as: 'location'
    });
  }
}

export const initDailySummaryModel = (sequelize: Sequelize): typeof DailySummary => {
  DailySummary.init(
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
      date_for: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      total_issued: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_done: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_hold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_cancel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      avg_service_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'DailySummary',
      tableName: 'daily_summaries',
      underscored: true,
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['location_id', 'date_for'],
          name: 'uq_summary_loc_date'
        },
      ],
    }
  );

  return DailySummary;
};