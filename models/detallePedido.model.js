module.exports = (sequelize, DataTypes) => {
  const DetallePedido = sequelize.define(
    'DetallePedido',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      pedido_id: { type: DataTypes.INTEGER, allowNull: false },
      producto_id: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
      precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      subtotal_linea: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
    },
    {
      tableName: 'detalle_pedidos',
      timestamps: false
    }
  );

  DetallePedido.associate = (models) => {
    DetallePedido.belongsTo(models.Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
    DetallePedido.belongsTo(models.Producto, { foreignKey: 'producto_id', as: 'producto' });
  };

  return DetallePedido;
};
