import axios from "axios";
import Imap from "node-imap";
import { simpleParser } from "mailparser";
import "dotenv/config";
import { IUserConfig } from "../../types/imapConfigType";

const stuckedProcessEmails = (
  config: IUserConfig | any ,

) => {
  const { id,startTime,solveTime, ...userConfig } = config;

  console.log("CONFIG",config)

  try {
    const imap = new Imap(userConfig);

    function openInbox(cb: any) {
      imap.openBox("INBOX", true, cb);
    }

    imap.once("ready", () => {
      openInbox((err: any, box: any) => {
        // if (err) throw err;
        if(err) {
          console.log("error", err);
        }

        // Construct the search criteria for the date range
        const searchCriteria = [
          "ALL",
          ["SINCE", startTime],
          ["BEFORE", solveTime],
        ];

        imap.search(searchCriteria, (err: any, results: number[]) => {
          // if (err) throw err;

          if(err){
            console.log(err)
          }

          // Fetch the matching messages
          const f = imap.fetch(results, { bodies: "" });

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

    imap.once("error", (err) => {
      console.error("IMAP Error:", err);
    });

    imap.once("end", () => {
      console.log("Connection ended");
    });

    imap.connect();
  } catch (error) {
    console.error("Error creating IMAP connection:", error);
  }
};

export default stuckedProcessEmails;