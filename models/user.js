export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'User with this email already exists',
      },
      validate: {
        notEmpty: {
          msg: 'Email cannot be empty',
        },
        isEmail: {
          msg: 'Email format is incorrect',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Password cannot be empty',
        },
      },
    },
    firstName: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'First name cannot be empty',
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'Last name cannot be empty',
        },
      },
    },
  }, {});

  return User;
};
