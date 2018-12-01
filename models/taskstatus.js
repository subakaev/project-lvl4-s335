module.exports = (sequelize, DataTypes) => {
  const TaskStatus = sequelize.define('TaskStatus', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Name cannot be empty',
        },
      },
    },
  }, {});
  TaskStatus.associate = (models) => {
    TaskStatus.hasMany(models.Task, { foreignKey: 'statusId', as: 'Status' });
  };
  return TaskStatus;
};
