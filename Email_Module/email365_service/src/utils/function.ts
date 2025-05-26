import axios from 'axios';

const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

export async function getToken() {
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "❌ Les variables d'environnement TENANT_ID, CLIENT_ID et CLIENT_SECRET doivent être définies.",
    );
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');
  const res = await axios.post<{ access_token: string }>(url, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.data.access_token) {
    throw new Error('❌ Token non reçu depuis Azure AD');
  }

  return res.data.access_token;
}
