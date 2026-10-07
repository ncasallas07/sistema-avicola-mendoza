module.exports = (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define(
    'PasswordResetToken',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: { type: DataTypes.INTEGER, allowNull: false },
      token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expira_en: { type: DataTypes.DATE, allowNull: false },
      usado_en: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: 'password_reset_tokens',
      createdAt: 'fecha_creacion',
      updatedAt: false
    }
  );

  PasswordResetToken.associate = (models) => {
    PasswordResetToken.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  };

  return PasswordResetToken;
};
