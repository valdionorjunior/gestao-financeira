import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { Account, Budget, Category, Goal, Transaction, FinancialSummary, User, Subcategory } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout()
        }
        return Promise.reject(error)
      },
    )
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async register(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/register', { email, password, name })
    return response.data
  }

  async getCurrentUser() {
    const response = await this.client.get<User>('/auth/me')
    return response.data
  }

  // Accounts endpoints
  async getAccounts() {
    const response = await this.client.get<Account[]>('/accounts')
    return response.data
  }

  async getAccount(id: string) {
    const response = await this.client.get<Account>(`/accounts/${id}`)
    return response.data
  }

  async createAccount(data: Partial<Account>) {
    const response = await this.client.post<Account>('/accounts', data)
    return response.data
  }

  async updateAccount(id: string, data: Partial<Account>) {
    const response = await this.client.put<Account>(`/accounts/${id}`, data)
    return response.data
  }

  async deleteAccount(id: string) {
    await this.client.delete(`/accounts/${id}`)
  }

  // Categories endpoints
  async getCategories() {
    const response = await this.client.get<Category[]>('/categories')
    return response.data
  }

  async createCategory(data: Partial<Category>) {
    const response = await this.client.post<Category>('/categories', data)
    return response.data
  }

  async updateCategory(id: string, data: Partial<Category>) {
    const response = await this.client.put<Category>(`/categories/${id}`, data)
    return response.data
  }

  async deleteCategory(id: string) {
    await this.client.delete(`/categories/${id}`)
  }

  // Subcategories endpoints
  async createSubcategory(categoryId: string, data: Partial<Subcategory>) {
    const response = await this.client.post<Subcategory>(`/categories/${categoryId}/subcategories`, data)
    return response.data
  }

  async updateSubcategory(categoryId: string, subcategoryId: string, data: Partial<Subcategory>) {
    const response = await this.client.put<Subcategory>(`/categories/${categoryId}/subcategories/${subcategoryId}`, data)
    return response.data
  }

  async deleteSubcategory(categoryId: string, subcategoryId: string) {
    await this.client.delete(`/categories/${categoryId}/subcategories/${subcategoryId}`)
  }

  // Transactions endpoints
  async getTransactions(filters?: Record<string, any>) {
    const response = await this.client.get<Transaction[]>('/transactions', { params: filters })
    return response.data
  }

  async getTransaction(id: string) {
    const response = await this.client.get<Transaction>(`/transactions/${id}`)
    return response.data
  }

  async createTransaction(data: Partial<Transaction>) {
    const endpoint = data.type === 'TRANSFER' ? '/transactions/transfer' : '/transactions'
    const response = await this.client.post<Transaction>(endpoint, data)
    return response.data
  }

  async updateTransaction(id: string, data: Partial<Transaction>) {
    const response = await this.client.put<Transaction>(`/transactions/${id}`, data)
    return response.data
  }

  async deleteTransaction(id: string) {
    await this.client.delete(`/transactions/${id}`)
  }

  // Budgets endpoints
  async getBudgets() {
    const response = await this.client.get<Budget[]>('/budgets')
    return response.data
  }

  async createBudget(data: Partial<Budget>) {
    const response = await this.client.post<Budget>('/budgets', data)
    return response.data
  }

  async updateBudget(id: string, data: Partial<Budget>) {
    const response = await this.client.put<Budget>(`/budgets/${id}`, data)
    return response.data
  }

  async deleteBudget(id: string) {
    await this.client.delete(`/budgets/${id}`)
  }

  // Goals endpoints
  async getGoals() {
    const response = await this.client.get<Goal[]>('/goals')
    return response.data
  }

  async createGoal(data: Partial<Goal>) {
    const response = await this.client.post<Goal>('/goals', data)
    return response.data
  }

  async updateGoal(id: string, data: Partial<Goal>) {
    const response = await this.client.put<Goal>(`/goals/${id}`, data)
    return response.data
  }

  async deleteGoal(id: string) {
    await this.client.delete(`/goals/${id}`)
  }

  // Dashboard endpoints
  async getFinancialSummary() {
    const response = await this.client.get<FinancialSummary>('/dashboard/summary')
    return response.data
  }

  // AI endpoints
  async getFinancialInsights() {
    const response = await this.client.get('/ai/insights')
    return response.data
  }

  async categorizeTransaction(description: string) {
    const response = await this.client.post('/ai/categorize', { description })
    return response.data
  }
}

export const apiClient = new ApiClient()
