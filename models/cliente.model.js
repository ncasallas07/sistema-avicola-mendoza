module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define(
    'Cliente',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre_razon_social: { type: DataTypes.STRING(200), allowNull: false },
      documento: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      telefono: { type: DataTypes.STRING(20), allowNull: true },
      correo: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
      direccion: { type: DataTypes.STRING(255), allowNull: true },
      zona: { type: DataTypes.STRING(100), allowNull: true },
      ciudad: { type: DataTypes.STRING(100), allowNull: true },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      }
    },
    {
      tableName: 'clientes',
      createdAt: 'fecha_registro',
      updatedAt: false
    }
  );

  Cliente.associate = (models) => {
    Cliente.hasMany(models.Pedido, { foreignKey: 'cliente_id', as: 'pedidos' });
  };

  return Cliente;
};
