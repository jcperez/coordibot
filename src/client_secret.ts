// Load the Google configuration from env var
// Expecting an object with the following structure
// {
//   "type",
//   "project_id",
//   "private_key_id",
//   "private_key",
//   "client_email",
//   "client_id",
//   "auth_uri",
//   "token_uri",
//   "auth_provider_x509_cert_url",
//   "client_x509_cert_url"
// }
import * as config from 'config';

const privateKey = JSON.parse(config.get('GOOGLE_CONFIG') || '{}');

export { privateKey };
