module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Task name cannot be empty',
        },
      },
    },
    description: {
      type: DataTypes.STRING,
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Status must not be empty',
        },
      },
    },
    creatorId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'Creator cannot be empty',
        },
      },
    },
    assignedToId: {
      type: DataTypes.INTEGER,
    },
  }, {});
  Task.associate = (models) => {
    Task.belongsToMany(models.Tag, { through: 'TagTask' });
  };
  return Task;
};
