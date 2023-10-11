import axios from "axios";
import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { IUserConfig } from "../types/imapConfigType";
import getUserInfo from "../utils/getUserInfo";
import "dotenv/config";
import stuckedProcessEmails from "./getStuckedMail";
import updateErrorDate from "../utils/updatImapErrorTime";

const processEmailsForUser = (config: IUserConfig | any) => {

  const { id, imap_error_start_time, imap_error_solve_time, ...userConfig } = config;
  let isError = false;

  try {
    const imap = new Imap(userConfig);
    function openInbox(cb: any) {
      imap.openBox("INBOX", true, cb);
    }

    imap.once("ready", () => {
      openInbox((err: any, box: any) => {
        
        if (err) throw err;
        imap.on("mail", (numNewMsgs) => {
          // Fetch the newest unseen message
          const f = imap.seq.fetch(
            box.messages.total - numNewMsgs + 1 + ":" + box.messages.total,
            { bodies: "" }
          );

          f.on("message", (msg, seqno) => {
            msg.on("body", (stream, info) => {
              let buffer = "";

              stream.on("data", (chunk) => {
                buffer += chunk.toString("utf8");
              });

              stream.on("end", () => {
                simpleParser(buffer, (err, parsed) => {
                  if (err) {
                    console.error("Parsing error:", err);
                    return;
                  }

                  console.log(parsed);

                  if (parsed) {
                    axios
                      .post(process.env.WINDMILL_WEBHOOK_URL as string, {
                        id,
                        htmlResponse: parsed,
                      })
                      .catch((error) => {
                        console.error("Axios POST error:", error);
                      });
                  }
                });
              });
            });
          });
        });
      });
    });



    imap.once("error", async  (err) => {
      console.error(
        "IMAP Error:",
        imap_error_start_time,
        imap_error_solve_time,
        err
      );

      // Mutation for error start time
      isError = true;
      const currentDateTime = new Date().toISOString();
      console.log("failed","hire...",currentDateTime)

      if (!imap_error_start_time) {
        await  updateErrorDate({ imap_error_start_time: currentDateTime,},id);
      }
    });


      
     // Mutation for error solve time
    if(!isError &&  !imap_error_solve_time && imap_error_start_time){
      const imap_error_solve_time = new Date().toISOString();
      // updateErrorDate({  imap_error_solve_time},id);
       console.log("success",isError, imap_error_solve_time)
    }


    imap.once("end", () => {
      console.log("Connection ended");
    });

    imap.connect();
  } catch (error) {
    console.error("Error creating IMAP connection:", error); 
  }
};

const imap = async () => {
  try {
    const subscription = (await getUserInfo()) || [];
    for await (const event of subscription) {
      const getUsers = event?.data?.payload;
      console.log("getUsers..", getUsers);
      for (const userConfig of getUsers as IUserConfig[]) {
        // toISOString()
        // stuckedProcessEmails(userConfig, new Date("2023-10-08T12:51:34.031Z"), new Date("2023-10-09T13:03:35.707Z"));
        // stuckedProcessEmails(userConfig, new Date("2023-10-08T12:51:34.031Z"), new Date("2023-10-09T13:03:35.707Z"));
        // processEmailsForUser(userConfig);
         processEmailsForUser(userConfig);

      }
    }
  } catch (error) {
    console.log("error", error);
  } 
};
export default imap;
