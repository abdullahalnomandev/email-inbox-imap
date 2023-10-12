export interface IUserConfig {
  id:number;
  user: String;
  password: String;
  host: String;
  port: Number;
  tls: boolean;
  imap_error_start_time: Date,
  imap_error_solve_time: Date
};
