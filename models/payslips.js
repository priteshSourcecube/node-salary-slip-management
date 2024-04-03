'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payslips extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Payslips.added_by = Payslips.belongsTo(models.Users, { foreignKey: "added_by", as: "addedBy" })
    }
  }
  Payslips.init({
    added_by: DataTypes.INTEGER,
    file: DataTypes.STRING,
    file_name: DataTypes.STRING,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Payslips',
  });
  return Payslips;
};