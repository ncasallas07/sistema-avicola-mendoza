module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define(
    'Producto',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      descripcion: { type: DataTypes.STRING(255), allowNull: true },
      categoria_id: { type: DataTypes.INTEGER, allowNull: false },
      textura_presentacion: { type: DataTypes.STRING(100), allowNull: true },
      unidad_medida: { type: DataTypes.STRING(30), allowNull: false },
      precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      cantidad_disponible: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      }
    },
    {
      tableName: 'productos',
      createdAt: 'fecha_creacion',
      updatedAt: false
    }
  );

  Producto.associate = (models) => {
    Producto.belongsTo(models.Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
    Producto.hasMany(models.DetallePedido, { foreignKey: 'producto_id', as: 'detalles' });
    Producto.hasMany(models.MovimientoInventario, { foreignKey: 'producto_id', as: 'movimientos' });
  };

  return Producto;
};
