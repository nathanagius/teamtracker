const db = require('./config/database');

const requests = [
  {
    request_type: 'add_member',
    requester_id: '4fe33ce5-7da0-4eef-a1d3-9fbe3b1033fe',
    team_id: null,
    user_id: '414bba05-fd28-4738-8a57-730470cd9463',
    details: { note: 'Add Matt to team' },
  },
  {
    request_type: 'remove_member',
    requester_id: '414bba05-fd28-4738-8a57-730470cd9463',
    team_id: null,
    user_id: '5d329cb0-b452-491d-8e1f-c7bbdaab37d7',
    details: { note: 'Remove Nathan from team' },
  },
  {
    request_type: 'create_team',
    requester_id: '5d329cb0-b452-491d-8e1f-c7bbdaab37d7',
    team_id: null,
    user_id: null,
    details: { name: 'New Team', description: 'A new team for testing' },
  },
];

(async () => {
  for (const req of requests) {
    await db.query(
      'INSERT INTO change_requests (request_type, requester_id, team_id, user_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.request_type, req.requester_id, req.team_id, req.user_id, JSON.stringify(req.details)]
    );
  }
  console.log('Inserted 3 approval workflow records');
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
}); 