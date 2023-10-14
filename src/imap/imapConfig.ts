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
      // console.log("okay", config.user);
      handleImapErrorSolveTime();
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
        isError = true;
      }
      const currentDateTime = new Date().toISOString();
      if (!imap_error_start_time) {
        await updateErrorDate({ imap_error_start_time: currentDateTime }, id);
      }
    });


    // ERROR SOLVE FUNCTION
    const handleImapErrorSolveTime = async () => {
      if (isError !== true && !imap_error_solve_time && imap_error_start_time) {
        // UPDATE ERROR SOLVE TIME
        const imapErrorSolveDate = new Date().toISOString();
        const updateImapSolveTime = await updateErrorDate( { imap_error_solve_time: imapErrorSolveDate },id);

        const { imap_error_solve_time: solveTime,  imap_error_start_time: startTime} = updateImapSolveTime.data;
        if (solveTime && startTime) {
          // GET ALL STUCKED EMAILS
          await stuckedProcessEmails({ solveTime, startTime, ...config });

          // RESET ERROR AS NULL
          await updateErrorDate(
            { imap_error_start_time: null, imap_error_solve_time: null },
            id
          );
        }
      }
    };

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
      for (const userConfig of getUsers as IUserConfig[]) {
        processEmailsForUser(userConfig);
      }
    }
  } catch (error) {
    console.log("error", error);
  }
};
export default imap;
