import axios from 'axios';

const tenantId = '';
const clientId = '';
const clientSecret = '';
const userEmail = 'jordan@solution-logique.fr';

async function getToken() {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  const res = await axios.post(url, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return res.data.access_token;
}

async function getMails() {
  const token = await getToken();

  const res = await axios.get(
    `https://graph.microsoft.com/v1.0/users/${userEmail}/messages?$top=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log('📨 Emails reçus :');
  res.data.value.forEach((msg, i) => {
    console.log(`\n#${i + 1} - ${msg.subject} [${msg.sender?.emailAddress?.address}]`);
  });
}

getMails().catch((err) => {
  console.error('❌ Erreur :', err.response?.data || err.message);
});
