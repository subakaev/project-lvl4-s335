const getStatus = (id, name) => ({
  id,
  name,
  createdAt: new Date(),
  updatedAt: new Date(),
});

module.exports = {
  up: queryInterface => queryInterface.bulkInsert('TaskStatuses', [
    getStatus(1, 'New'),
    getStatus(2, 'In Progress'),
    getStatus(3, 'Test'),
    getStatus(4, 'Done'),
  ], {}),

  down: queryInterface => queryInterface.bulkDelete('TaskStatuses', null, {}),
};
