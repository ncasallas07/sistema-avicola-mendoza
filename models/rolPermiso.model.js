module.exports = (sequelize, DataTypes) => {
  const RolPermiso = sequelize.define(
    'RolPermiso',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      rol_id: { type: DataTypes.INTEGER, allowNull: false },
      permiso_id: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      tableName: 'rol_permisos',
      timestamps: false
    }
  );

  return RolPermiso;
};
