'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payslip_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      payslip_id: {
        type: Sequelize.STRING
      },
      emp_id: {
        type: Sequelize.STRING
      },
      salary: {
        type: Sequelize.INTEGER
      },
      working_days: {
        type: Sequelize.INTEGER
      },
      leave: {
        type: Sequelize.INTEGER
      },
      gross_pay: {
        type: Sequelize.INTEGER
      },
      deduction: {
        type: Sequelize.INTEGER
      },
      net_pay: {
        type: Sequelize.INTEGER
      },
      deletedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payslip_details');
  }
};