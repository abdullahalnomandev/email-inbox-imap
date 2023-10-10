import express, { Application } from "express";
import imap from "./imap/imapConfig";
import 'dotenv/config'
const app:Application = express();

const port = process.env.PORT ;

app.use(express.json());

const connectedToDb = async () => {
  try {
    await imap();
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to connect.", error);
  }
};  



connectedToDb();
