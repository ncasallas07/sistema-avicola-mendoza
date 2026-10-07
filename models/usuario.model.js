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
      },
      // Datos de empleado (sección "Ampliar información de usuarios/empleados").
      // Todos nullable: no afectan a los usuarios ya existentes.
      tipo_documento: { type: DataTypes.ENUM('CC', 'CE', 'PA', 'TI'), allowNull: true },
      numero_documento: { type: DataTypes.STRING(30), allowNull: true, unique: true },
      telefono: { type: DataTypes.STRING(20), allowNull: true },
      direccion: { type: DataTypes.STRING(255), allowNull: true },
      rh: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), allowNull: true },
      eps: { type: DataTypes.STRING(150), allowNull: true },
      arl: { type: DataTypes.STRING(150), allowNull: true },
      cargo: { type: DataTypes.STRING(100), allowNull: true },
      fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_ingreso: { type: DataTypes.DATEONLY, allowNull: true }
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
    Usuario.hasMany(models.PasswordResetToken, { foreignKey: 'usuario_id', as: 'tokensRecuperacion' });
  };

  return Usuario;
};
