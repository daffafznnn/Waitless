/* FILE: src/server/repositories/UserRepository.ts */
import { Transaction, Op } from 'sequelize';
import { User, UserAttributes, UserCreationAttributes } from '../models/user.model';

export class UserRepository {
  /**
   * Create a new user
   */
  async create(userData: UserCreationAttributes, transaction?: Transaction): Promise<User> {
    return User.create(userData, { transaction });
  }

  /**
   * Find user by ID
   */
  async findById(id: number, transaction?: Transaction): Promise<User | null> {
    return User.findByPk(id, { transaction });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string, transaction?: Transaction): Promise<User | null> {
    return User.findOne({
      where: { email },
      transaction,
    });
  }

  /**
   * Update user
   */
  async update(
    id: number,
    updates: Partial<UserAttributes>,
    transaction?: Transaction
  ): Promise<[number, User[]]> {
    return User.update(updates, {
      where: { id },
      returning: true,
      transaction,
    });
  }

  /**
   * Delete user (soft delete if paranoid is enabled)
   */
  async delete(id: number, transaction?: Transaction): Promise<number> {
    return User.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: string, transaction?: Transaction): Promise<User[]> {
    return User.findAll({
      where: { role },
      transaction,
    });
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string, transaction?: Transaction): Promise<boolean> {
    const count = await User.count({
      where: { email },
      transaction,
    });
    return count > 0;
  }

  /**
   * Find or create user
   */
  async findOrCreate(
    userData: UserCreationAttributes,
    transaction?: Transaction
  ): Promise<[User, boolean]> {
    return User.findOrCreate({
      where: { email: userData.email },
      defaults: userData,
      transaction,
    });
  }

  /**
   * Get all users with pagination
   */
  async findAllPaginated(
    offset: number = 0,
    limit: number = 20,
    transaction?: Transaction
  ): Promise<{ rows: User[]; count: number }> {
    return User.findAndCountAll({
      offset,
      limit,
      order: [['created_at', 'DESC']],
      transaction,
    });
  }

  /**
   * Search users by name or email
   */
  async search(
    query: string,
    offset: number = 0,
    limit: number = 20,
    transaction?: Transaction
  ): Promise<{ rows: User[]; count: number }> {
    
    return User.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
        ],
      },
      offset,
      limit,
      order: [['created_at', 'DESC']],
      transaction,
    });
  }
}