module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Tag with this name already exists',
      },
      validate: {
        notEmpty: {
          msg: 'Name cannot be empty',
        },
      },
    },
  }, {});
  Tag.associate = (models) => {
    Tag.belongsToMany(models.Task, { through: 'TaskTags', foreignKey: 'taskId' });
  };
  return Tag;
};
