/*
 * Copyright (c) 2024-2026 GEAG. Todos los derechos reservados.
 * Este código es confidencial y propietario. No está permitida su distribución ni modificación.
 */
import API from "./api";

export const getOfferings = (p=1, s=50) => API.get(`/finance/offerings?page=${p}&size=${s}`);
export const createOffering = (data) => API.post("/finance/offerings", data);
export const deleteOffering = (id) => API.delete(`/finance/offerings/${id}`);

export const getIncomes = (p=1, s=50) => API.get(`/finance/incomes?page=${p}&size=${s}`);
export const createIncome = (data) => API.post("/finance/incomes", data);
export const deleteIncome = (id) => API.delete(`/finance/incomes/${id}`);

export const getExpenses = (p=1, s=50) => API.get(`/finance/expenses?page=${p}&size=${s}`);
export const createExpense = (formData) => API.post("/finance/expenses", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const deleteExpense = (id) => API.delete(`/finance/expenses/${id}`);


export const getMonthlySummary = (month, year) =>
  API.get(`/finance/summary?month=${month}&year=${year}&_t=${Date.now()}`);

export const getFixedExpenses = () => API.get("/finance/fixed-expenses");
export const createFixedExpense = (data) => API.post("/finance/fixed-expenses", data);
export const getFixedExpense = (id) => API.get(`/finance/fixed-expenses/${id}`);
export const updateFixedExpense = (id, data) => API.put(`/finance/fixed-expenses/${id}`, data);
export const deleteFixedExpense = (id) => API.delete(`/finance/fixed-expenses/${id}`);

export const getDeposits = (p=1, s=50) => API.get(`/finance/deposits?page=${p}&size=${s}`);
export const createDeposit = (formData) => API.post("/finance/deposits", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const deleteDeposit = (id) => API.delete(`/finance/deposits/${id}`);

// Caja General
export const getCashRegister = (month, year) => {
  const params = month && year ? `?month=${month}&year=${year}` : "";
  return API.get(`/finance/cash-register${params}`);
};

// Inyecciones Caja → Banco
export const getInjections = (p=1, s=50) => API.get(`/finance/injections?page=${p}&size=${s}`);
export const createInjection = (formData) => API.post("/finance/injections", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const deleteInjection = (id) => API.delete(`/finance/injections/${id}`);

// Cuentas Bancarias
export const getBankAccounts = () => API.get("/finance/bank-accounts");
export const createBankAccount = (data) => API.post("/finance/bank-accounts", data);
export const deleteBankAccount = (id) => API.delete(`/finance/bank-accounts/${id}`);
