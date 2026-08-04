import axios from "axios";
import { auth } from "@/lib/firebase";

const apiURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
    baseURL: typeof window !== "undefined" && (!apiURL || !apiURL.startsWith("https://"))
        ? "/api"
        : (apiURL || "http://localhost:8000/api"),
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;

    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});