// src/lib/apiClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:4000/api", // trỏ tới BE của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
