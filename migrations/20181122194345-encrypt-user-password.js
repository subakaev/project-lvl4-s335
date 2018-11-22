module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn('Users', 'passwordDigest', { type: Sequelize.STRING, allowNull: false });
    queryInterface.removeColumn('Users', 'password');
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn('Users', 'passwordDigest');
    queryInterface.addColumn('Users', 'password', { type: Sequelize.STRING, allowNull: false });
  },
};
