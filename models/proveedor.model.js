module.exports = (sequelize, DataTypes) => {
  const Proveedor = sequelize.define(
    'Proveedor',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_razon_social: { type: DataTypes.STRING(200), allowNull: false },
      identificacion: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      telefono: { type: DataTypes.STRING(20), allowNull: true },
      correo: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
      direccion: { type: DataTypes.STRING(255), allowNull: true },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      }
    },
    {
      tableName: 'proveedores',
      createdAt: 'fecha_registro',
      updatedAt: false
    }
  );

  return Proveedor;
};
