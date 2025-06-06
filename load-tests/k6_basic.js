import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Fetch all projects
  let projectsRes = http.get(`${BASE_URL}/projects`);
  check(projectsRes, { 'status 200 for projects': (r) => r.status === 200 });

  // Create a temporary client then project
  let clientRes = http.post(`${BASE_URL}/clients`, JSON.stringify({
    firstname: 'Load',
    lastname: 'Tester',
    email: `load.tester.${Math.random()}@example.com`,
  }), { headers: { 'Content-Type': 'application/json' } });
  check(clientRes, { 'create client status 201': (r) => r.status === 201 });
  let clientId = clientRes.json('id');

  let projectRes = http.post(`${BASE_URL}/projects`, JSON.stringify({
    reference: `PRJ-${Math.random()}`,
    name: `Load Project ${Math.random()}`,
    clientId: clientId,
  }), { headers: { 'Content-Type': 'application/json' } });
  check(projectRes, { 'create project status 201': (r) => r.status === 201 });
  let projectId = projectRes.json('id');

  // Delete the created client and project to keep DB clean
  http.del(`${BASE_URL}/projects/${projectId}`);
  http.del(`${BASE_URL}/clients/${clientId}`);

  sleep(1);
}
