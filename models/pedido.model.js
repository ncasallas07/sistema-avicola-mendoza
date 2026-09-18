module.exports = (sequelize, DataTypes) => {
  const Pedido = sequelize.define(
    'Pedido',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      numero_pedido: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      cliente_id: { type: DataTypes.INTEGER, allowNull: false },
      usuario_id: { type: DataTypes.INTEGER, allowNull: false },
      estado: {
        type: DataTypes.ENUM('Pendiente', 'Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'Pendiente'
      },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      observaciones: { type: DataTypes.STRING(500), allowNull: true }
    },
    {
      tableName: 'pedidos',
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    }
  );

  Pedido.associate = (models) => {
    Pedido.belongsTo(models.Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
    Pedido.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'creadoPor' });
    Pedido.hasMany(models.DetallePedido, { foreignKey: 'pedido_id', as: 'detalles' });
    Pedido.hasMany(models.MovimientoInventario, { foreignKey: 'pedido_id', as: 'movimientos' });
  };

  return Pedido;
};
