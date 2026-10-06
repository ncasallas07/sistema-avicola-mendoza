module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define(
    'Rol',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      descripcion: { type: DataTypes.STRING(255), allowNull: true },
      estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      }
    },
    {
      tableName: 'roles',
      createdAt: 'fecha_creacion',
      updatedAt: false
    }
  );

  Rol.associate = (models) => {
    Rol.hasMany(models.Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
    Rol.belongsToMany(models.Permiso, {
      through: models.RolPermiso,
      foreignKey: 'rol_id',
      otherKey: 'permiso_id',
      as: 'permisos'
    });
  };

  return Rol;
};
