'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('password_reset_tokens', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Nunca se guarda el token en claro: solo su hash SHA-256 (ver
      // services/passwordReset.service.js), para que una fuga de la base de
      // datos no permita restablecer contraseñas ajenas.
      token_hash: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      expira_en: { type: Sequelize.DATE, allowNull: false },
      usado_en: { type: Sequelize.DATE, allowNull: true },
      fecha_creacion: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
    await queryInterface.addIndex('password_reset_tokens', ['usuario_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('password_reset_tokens');
  }
};
