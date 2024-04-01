'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Employees extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Employees.init({
    emp_id: DataTypes.STRING,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    joining_date: DataTypes.DATE,
    paid_leave: DataTypes.INTEGER,
    remaining_leave: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Employees',
  });
  return Employees;
};