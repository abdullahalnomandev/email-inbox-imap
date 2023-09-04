import axios from "axios";
import Imap from "node-imap";
import { simpleParser } from "mailparser";
import { IUserConfig } from "../types/imapConfigType";
import getUserInfo from "../utils/getUserInfo";

const processEmailsForUser = (config:IUserConfig | any) => {
  try {
    const imap = new Imap(config);

    function openInbox(cb:any) {
      imap.openBox("INBOX", true, cb);
    }

    imap.once("ready", () => {
      openInbox((err:any, box:any) => {
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
                      .post(
                        "https://wm.azt4vo.easypanel.host/api/w/fluent/capture_u/u/noman/email_trigger__imap_",
                        { htmlResponse: parsed }
                      )
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

const imap = async () => {
  try {
    const subscription = await getUserInfo() || [];
    for await (const event of subscription) {
      // console.log(JSON.stringify(event.data.data, null, 2));
       const getUsers = event?.data?.payload;
       console.log("getUsers",getUsers)
      for (const userConfig of getUsers as IUserConfig[]) {
        processEmailsForUser(userConfig);
      }
    }
  } catch (error) {
    console.log("error", error);
  }
};
export default imap;
