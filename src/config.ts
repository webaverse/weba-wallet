import AccountsAbi from "./abi/Accounts.json";

export const config = {
  sidechainURL: "http://13.57.177.184:8545",
  authServerURL: "https://auth.webaverse.com",
  accountsContract: {
    abi: AccountsAbi.abi,
    address: "0xEE64CB0278f92a4A20cb8F2712027E89DE0eB85e",
  },
  allowedOrigins: ["https://app.webaverse.com", "http://localhost:1234", "http://localhost:3000"],
};
