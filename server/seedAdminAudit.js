const db = require('./config/database');

const users = [
  { id: '4fe33ce5-7da0-4eef-a1d3-9fbe3b1033fe', name: 'Ken Howe' },
  { id: '414bba05-fd28-4738-8a57-730470cd9463', name: 'Matt Murphy' },
  { id: '5d329cb0-b452-491d-8e1f-c7bbdaab37d7', name: 'Nathan Agius' },
];

(async () => {
  for (let i = 1; i <= 5; i++) {
    const user = users[(i - 1) % users.length];
    await db.query(
      'INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id, summary) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ['users', null, 'UPDATE', null, null, user.id, `${user.name} did something audit-worthy #${i}`]
    );
  }
  console.log('Reseeded 5 audit records for 3 users');
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
}); 