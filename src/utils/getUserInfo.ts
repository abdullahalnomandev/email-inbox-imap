import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import 'dotenv/config'
const headers = {
  "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
};
const client = createClient({
  url: process.env.HASURA_ENDPOINT as string ,
    //  Repleace wss: insearted of https:
  connectionParams: {
    headers,
  },
  webSocketImpl: WebSocket
});

const getUserInfo = async () => {
  try {
    const subscription = client.iterate({
      query: `
          subscription GET_CHANNEL_EMAIL {
          payload: channel_email(where: {imap_enabled: {_eq: true}}) {
            id
            user: imap_username
            password: imap_password
            host: imap_host_address
            port: imap_port
            tls: imap_requires_ssl
            imap_error_start_time
            imap_error_solve_time
          }
        }
      `,
    });

    return subscription;
 
  } catch (error) {
    console.error("Subscription error:", error);
  }
}

export default getUserInfo;