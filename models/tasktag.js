module.exports = (sequelize, DataTypes) => {
  const TaskTag = sequelize.define('TaskTag', {
    TaskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {});
  return TaskTag;
};
