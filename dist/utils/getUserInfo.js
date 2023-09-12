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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_ws_1 = require("graphql-ws");
const ws_1 = __importDefault(require("ws"));
require("dotenv/config");
const headers = {
    "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
};
const client = (0, graphql_ws_1.createClient)({
    url: process.env.HASURA_ENDPOINT,
    //  Repleace wss: insearted of https:
    connectionParams: {
        headers,
    },
    webSocketImpl: ws_1.default
});
const getUserInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscription = client.iterate({
            query: `
          subscription GET_CHANNEL_EMAIL {
          payload: channel_email(where: {imap_enabled: {_eq: true}}) {
            user: imap_username
            password: imap_password
            host: imap_host_address
            port: imap_port
            tls: imap_requires_ssl
          }
        }
      `,
        });
        return subscription;
    }
    catch (error) {
        console.error("Subscription error:", error);
    }
});
exports.default = getUserInfo;
