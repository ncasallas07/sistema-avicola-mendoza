module.exports = (sequelize, DataTypes) => {
  const MovimientoInventario = sequelize.define(
    'MovimientoInventario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      producto_id: { type: DataTypes.INTEGER, allowNull: false },
      tipo: { type: DataTypes.ENUM('Entrada', 'Salida'), allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
      motivo: {
        type: DataTypes.ENUM('Compra', 'Ajuste', 'Pedido', 'Devolución por cancelación'),
        allowNull: false
      },
      pedido_id: { type: DataTypes.INTEGER, allowNull: true },
      usuario_id: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      tableName: 'movimientos_inventario',
      createdAt: 'fecha',
      updatedAt: false
    }
  );

  MovimientoInventario.associate = (models) => {
    MovimientoInventario.belongsTo(models.Producto, { foreignKey: 'producto_id', as: 'producto' });
    MovimientoInventario.belongsTo(models.Pedido, { foreignKey: 'pedido_id', as: 'pedido' });
    MovimientoInventario.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
  };

  return MovimientoInventario;
};
