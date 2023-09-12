"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const node_imap_1 = __importDefault(require("node-imap"));
const mailparser_1 = require("mailparser");
const getUserInfo_1 = __importDefault(require("../utils/getUserInfo"));
require("dotenv/config");
const processEmailsForUser = (config) => {
    try {
        const imap = new node_imap_1.default(config);
        function openInbox(cb) {
            imap.openBox("INBOX", true, cb);
        }
        imap.once("ready", () => {
            openInbox((err, box) => {
                if (err)
                    throw err;
                imap.on("mail", (numNewMsgs) => {
                    // Fetch the newest unseen message
                    const f = imap.seq.fetch(box.messages.total - numNewMsgs + 1 + ":" + box.messages.total, { bodies: "" });
                    f.on("message", (msg, seqno) => {
                        msg.on("body", (stream, info) => {
                            let buffer = "";
                            stream.on("data", (chunk) => {
                                buffer += chunk.toString("utf8");
                            });
                            stream.on("end", () => {
                                (0, mailparser_1.simpleParser)(buffer, (err, parsed) => {
                                    if (err) {
                                        console.error("Parsing error:", err);
                                        return;
                                    }
                                    console.log(parsed);
                                    if (parsed) {
                                        axios_1.default
                                            .post(process.env.WINDMILL_WEBHOOK_URL, { htmlResponse: parsed })
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
    }
    catch (error) {
        console.error("Error creating IMAP connection:", error);
    }
};
const imap = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d;
    try {
        const subscription = (yield (0, getUserInfo_1.default)()) || [];
        try {
            for (var _e = true, subscription_1 = __asyncValues(subscription), subscription_1_1; subscription_1_1 = yield subscription_1.next(), _a = subscription_1_1.done, !_a; _e = true) {
                _c = subscription_1_1.value;
                _e = false;
                const event = _c;
                const getUsers = (_d = event === null || event === void 0 ? void 0 : event.data) === null || _d === void 0 ? void 0 : _d.payload;
                console.log("getUsers", getUsers);
                for (const userConfig of getUsers) {
                    processEmailsForUser(userConfig);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_e && !_a && (_b = subscription_1.return)) yield _b.call(subscription_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    catch (error) {
        console.log("error", error);
    }
});
exports.default = imap;
