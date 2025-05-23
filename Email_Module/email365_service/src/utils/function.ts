import axios from 'axios';

export async function getToken() {
  const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', process.env.CLIENT_ID ?? '');
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', process.env.CLIENT_SECRET ?? '');
  params.append('grant_type', 'client_credentials');

  const res = await axios.post<{ access_token: string }>(url, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (res.data.access_token) {
    const token = res.data.access_token;
    return token;
  } else {
    throw new Error('Failed to get token');
  }
}
