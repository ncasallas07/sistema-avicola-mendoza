module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      password: { type: DataTypes.STRING(255), allowNull: false },
      rol_id: { type: DataTypes.INTEGER, allowNull: false },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      }
    },
    {
      tableName: 'usuarios',
      createdAt: 'fecha_creacion',
      updatedAt: false
    }
  );

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Rol, { foreignKey: 'rol_id', as: 'rol' });
    Usuario.hasMany(models.Pedido, { foreignKey: 'usuario_id', as: 'pedidos' });
    Usuario.hasMany(models.MovimientoInventario, { foreignKey: 'usuario_id', as: 'movimientos' });
  };

  return Usuario;
};
