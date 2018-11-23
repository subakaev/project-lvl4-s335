import validator from 'validate.js';

const validationConstraints = {
  login: {
    userName: {
      presence: true,
      length: {
        minimum: 1,
        tooShort: { message: 'User name cannot be empty' },
      },
    },
    password: {
      presence: true,
      length: {
        minimum: 1,
        tooShort: { message: 'Password cannot be empty' },
      },
    },
  },
  changePassword: {
    currentPassword: {
      presence: true,
      length: {
        minimum: 1,
        tooShort: { message: 'Cannot be empty' },
      },
    },
    password: {
      presence: true,
      length: {
        minimum: 1,
        tooShort: { message: 'Cannot be empty' },
      },
    },
    confirmPassword: {
      presence: true,
      length: {
        minimum: 1,
        tooShort: { message: 'Cannot be empty' },
      },
    },
  },
  updateProfile: {
    firstName: {
      presence: true,
      length: {
        minimum: 1,
        tooShort: { message: 'Cannot be empty' },
      },
    },
    lastName: {
      presence: true,
      length: {
        minimum: 1,
        tooShort: { message: 'Cannot be empty' },
      },
    },
  },
};

const validateForm = (formName, data) => validator.validate(data, validationConstraints[formName]);

export default validateForm;
