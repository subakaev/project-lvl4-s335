const getStatus = (id, name) => ({
  id,
  name,
  createdAt: new Date(),
  updatedAt: new Date(),
});

module.exports = {
  up: queryInterface => queryInterface.bulkInsert('TaskStatuses', [
    getStatus(1, 'Новый'),
    getStatus(2, 'В работе'),
    getStatus(3, 'На тестировании'),
    getStatus(4, 'Завершен'),
  ], {}),

  down: queryInterface => queryInterface.bulkDelete('TaskStatuses', null, {}),
};
