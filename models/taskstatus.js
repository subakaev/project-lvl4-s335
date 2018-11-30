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
  // TaskStatus.associate = function(models) {
    // associations can be defined here
  // };
  return TaskStatus;
};
