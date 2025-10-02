import axios from "axios";
const API_BASE = "http://localhost:4000/api/files";

export const getPresignUrl = (payload) => axios.post(`${API_BASE}/presign`, payload);
export const registerSingle = (payload) => axios.post(`${API_BASE}/register`, payload);

export const initiateMultipart = (payload) => axios.post(`${API_BASE}/multipart/initiate`, payload);
export const completeMultipart = (payload) => axios.post(`${API_BASE}/multipart/complete`, payload);
export const abortMultipart = (payload) => axios.post(`${API_BASE}/multipart/abort`, payload);

export const deleteFile = (id) => axios.delete(`${API_BASE}/${id}`);
export const getViewUrl = (payload) => axios.post(`${API_BASE}/view`, payload);
