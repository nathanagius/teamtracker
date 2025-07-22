const axios = require('axios');
const { faker } = require('@faker-js/faker');

const API_BASE_URL = 'http://localhost:3001/api';
const NUM_USERS = 9; // 3 per team for 3 teams
const ROLES = ['Engineering Manager', 'Technical Product Owner', 'Engineer'];

async function main() {
  try {
    // 1. Fetch all teams
    const teamsRes = await axios.get(`${API_BASE_URL}/teams`);
    const teams = teamsRes.data;
    if (!teams.length) throw new Error('No teams found');

    // 2. Fetch all skills
    const skillsRes = await axios.get(`${API_BASE_URL}/skills`);
    const skills = skillsRes.data;
    if (!skills.length) throw new Error('No skills found');

    // 3. Create random users
    const users = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const first_name = faker.person.firstName();
      const last_name = faker.person.lastName();
      const email = faker.internet.email({ firstName: first_name, lastName: last_name });
      const role = ROLES[i % ROLES.length];
      const hire_date = faker.date.past({ years: 5 }).toISOString().split('T')[0];
      const userRes = await axios.post(`${API_BASE_URL}/users`, {
        first_name,
        last_name,
        email,
        role,
        hire_date,
      });
      users.push(userRes.data);
      console.log(`Created user: ${first_name} ${last_name} (${role})`);
    }

    // 4. Assign each user to a random team and random skills
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const team = teams[i % teams.length];
      const start_date = new Date().toISOString().split('T')[0];
      await axios.post(`${API_BASE_URL}/team-members`, {
        team_id: team.id,
        user_id: user.id,
        start_date,
      });
      console.log(`Assigned ${user.first_name} ${user.last_name} to team ${team.name}`);

      // Assign 2-3 random skills
      const numSkills = faker.number.int({ min: 2, max: 3 });
      const shuffledSkills = faker.helpers.shuffle(skills);
      for (let j = 0; j < numSkills; j++) {
        const skill = shuffledSkills[j];
        const proficiency_level = faker.number.int({ min: 1, max: 5 });
        const years_experience = faker.number.float({ min: 0, max: 10, precision: 0.1 });
        await axios.post(`${API_BASE_URL}/skills/user/${user.id}`, {
          skill_id: skill.id,
          proficiency_level,
          years_experience,
        });
        console.log(`  Added skill: ${skill.name} (Level ${proficiency_level}, ${years_experience.toFixed(1)} yrs)`);
      }
    }

    console.log('Seeding complete!');
  } catch (err) {
    if (err.response) {
      console.error('API error:', err.response.data);
    } else {
      console.error(err);
    }
  }
}

main(); 