import axios from "axios";
import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { IUserConfig } from "../types/imapConfigType";
import getUserInfo from "../utils/getUserInfo";
import "dotenv/config";
import stuckedProcessEmails from "./getStuckedMail";
import updateErrorDate from "../utils/updatImapErrorTime";

const processEmailsForUser = (config: IUserConfig | any) => {
  const { id, imap_error_start_time, imap_error_solve_time, ...userConfig } =
    config;
  let isError = "not_error";

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

    // SET IMAP START ERROR TIME
    imap.once("error", async (err) => {
      if (err) {
        isError = "error";
      }
      const currentDateTime = new Date().toISOString();
      if (!imap_error_start_time) {
        await updateErrorDate({ imap_error_start_time: currentDateTime }, id);
      }
    });


    // SET IMAP ERROR SOLVE TIME 
    setTimeout(() => {
      handleImapErrorSolveTime();
    }, 2000);

    const handleImapErrorSolveTime = async () => { 
       if ( isError === "not_error" && !imap_error_solve_time && imap_error_start_time) {
        const imap_error_solve_time = new Date().toISOString();
        await updateErrorDate({ imap_error_solve_time }, id);
        if(userConfig.imap_error_start_time && userConfig.imap_error_solve_time){
           await stuckedProcessEmails(userConfig);
           await updateErrorDate({ imap_error_start_time: null,imap_error_solve_time:null }, userConfig.id);
        }
        console.log("success-solve time", isError, imap_error_solve_time);
      }
    }

    // CONNECT IMAP
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
        processEmailsForUser(userConfig);
      }
    }
  } catch (error) {
    console.log("error", error);
  }
};
export default imap;
