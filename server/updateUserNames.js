const db = require('./config/database');

const updates = [
  { id: '4fe33ce5-7da0-4eef-a1d3-9fbe3b1033fe', first: 'Ken', last: 'Howe' },
  { id: '414bba05-fd28-4738-8a57-730470cd9463', first: 'Matt', last: 'Murphy' },
  { id: '5d329cb0-b452-491d-8e1f-c7bbdaab37d7', first: 'Nathan', last: 'Agius' },
];

(async () => {
  for (const u of updates) {
    await db.query(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
      [u.first, u.last, u.id]
    );
  }
  console.log('Updated user names to Ken Howe, Matt Murphy, Nathan Agius');
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
}); 