const express = require('express');
const { faker } = require('@faker-js/faker');

const app = express();
const PORT = process.env.PORT || 4000;

// Generate 200 fake workers
const workers = Array.from({ length: 200 }, (_, i) => ({
  id: faker.string.uuid(),
  workerType: 'Employee',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  userName: faker.internet.userName(),
  email: faker.internet.email(),
  jobTitle: faker.person.jobTitle(),
  organization: {
    id: faker.string.uuid(),
    name: faker.company.name(),
  },
  hireDate: faker.date.past({ years: 10 }).toISOString().split('T')[0],
  status: 'Active',
}));

// Paginated /workers endpoint
app.get('/workers', (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 50;
  const paged = workers.slice(offset, offset + limit);
  res.json({
    workers: paged,
    count: paged.length,
    total: workers.length,
    links: {
      next:
        offset + limit < workers.length
          ? `${req.protocol}://${req.get('host')}/workers?offset=${offset + limit}&limit=${limit}`
          : null,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Mock Workday API running on port ${PORT}`);
}); 