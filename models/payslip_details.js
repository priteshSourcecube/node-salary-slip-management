'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payslip_details extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Payslip_details.emp_id = Payslip_details.belongsTo(models.Employees, { foreignKey: "emp_id", as: "employee" })
    }
  }
  Payslip_details.init({
    payslip_id: DataTypes.STRING,
    emp_id: DataTypes.STRING,
    salary: DataTypes.INTEGER,
    working_days: DataTypes.INTEGER,
    leave: DataTypes.INTEGER,
    gross_pay: DataTypes.INTEGER,
    deduction: DataTypes.INTEGER,
    net_pay: DataTypes.INTEGER,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Payslip_details',
  });
  return Payslip_details;
};