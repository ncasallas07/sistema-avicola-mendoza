module.exports = (sequelize, DataTypes) => {
  const Permiso = sequelize.define(
    'Permiso',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      codigo: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      modulo: { type: DataTypes.STRING(50), allowNull: false },
      descripcion: { type: DataTypes.STRING(255), allowNull: true },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      }
    },
    {
      tableName: 'permisos',
      createdAt: 'fecha_creacion',
      updatedAt: false
    }
  );

  Permiso.associate = (models) => {
    Permiso.belongsToMany(models.Rol, {
      through: models.RolPermiso,
      foreignKey: 'permiso_id',
      otherKey: 'rol_id',
      as: 'roles'
    });
  };

  return Permiso;
};
