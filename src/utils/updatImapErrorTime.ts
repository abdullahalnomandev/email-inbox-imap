import axios from "axios";

const endpoint = process.env.GRAPHQL_ENDPOINT as string;

const headers = {
  "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
};

async function updateErrorDate(errorTimes: object,channel_id:number) {
  const graphqlQuery = {
    query: `mutation SET_IMAP_ERROR_TIME($channel_email_id: Int!, $imap_times: channel_email_set_input = {}) {
          payload: update_channel_email_by_pk(pk_columns: {id: $channel_email_id}, _set: $imap_times) {
            id
            imap_error_solve_time
            imap_error_start_time
          }
        }`,
    variables: {
      channel_email_id: channel_id,
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

    // Check if the response contains data
    if (response.data) {
      return {
        status: "success",
      };
    } else {
      // Handle the case where the response doesn't contain data
      return {
        status: "error",
        message: "Response does not contain data.",
      };
    }
  } catch (error) {
    // Handle errors and log the error message
    return {
      status: "error",
      message:"something went wrong..." // You can customize the error message
    };
  }
}

export default updateErrorDate;
