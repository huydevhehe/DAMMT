import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000", // BE đang chạy port 4000
  headers: {
    "Content-Type": "application/json",
  },
});
