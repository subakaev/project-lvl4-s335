import { encrypt } from '../lib/secure';

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
    passwordDigest: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        this.setDataValue('passwordDigest', encrypt(value));
        this.setDataValue('password', value);
        return value;
      },
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
  User.associate = (models) => {
    User.hasMany(models.Task, { foreignKey: 'creatorId', as: 'Creator' });
    User.hasMany(models.Task, { foreignKey: 'assignedToId', as: 'AssignedTo' });
  };
  return User;
};
