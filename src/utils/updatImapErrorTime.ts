import axios from "axios";

const endpoint = process.env.HASURA_ENDPOINT as string ;

const headers = {
  "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
};
async function updateErrorDate(errorTimes: object) {
  const graphqlQuery = {
    query: `mutation SET_IMAP_ERROR_TIME($channel_email_id: Int!, $imap_times: channel_email_set_input = {}) {
          payload: update_channel_email_by_pk(pk_columns: {id: $channel_email_id}, _set: $imap_times) {
            id
            imap_error_solve_time
            imap_error_start_time
          }
        }`,
    variables: {
      channel_email_id: 212,
      imap_times: errorTimes,
    },
  };

  try {
    const response = await axios({
      url: endpoint,
      method: "post",
      headers: headers,
      data: graphqlQuery,
    });

    // Access the data property after the Promise has resolved
    return response.data;
  } catch (error) {
    // Handle errors if any
    console.error(error);
  }
}

// Call the function to fetch the data
export default updateErrorDate;
