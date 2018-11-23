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
};

const validateForm = (formName, data) => validator.validate(data, validationConstraints[formName]);

export default validateForm;
