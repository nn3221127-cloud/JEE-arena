/**
 * Typed API Client wrapper for JEE Test Arena Express backend.
 */

export interface AuthUser {
  user_id: string;
  name: string;
  role: 'admin' | 'member';
  token: string;
}

export interface QuestionDraft {
  id?: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 0-100
  extraction_source?: string;
}

export interface TestSummary {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  question_count: number;
  estimated_time_minutes: number;
  created_at: string;
  subjects: string[];
}

export interface AttemptSession {
  attempt_id: string;
  test_id: string;
  test_title: string;
  estimated_time_minutes: number;
  questions: Array<{
    id: string;
    question_text: string;
    options: string[];
    correct_option_index: number;
    explanation?: string;
    subject: string;
    topic: string;
    image_url?: string;
  }>;
  start_time: string;
}

export interface ResultsSummary {
  attempt_id: string;
  test_id: string;
  test_title: string;
  score: number;
  total_questions: number;
  accuracy_percentage: number;
  time_spent_text: string;
  subject_breakdown: Array<{ subject: string; total: number; correct: number; accuracy: number }>;
  weak_topics: Array<{ topic: string; subject: string; wrong_count: number; accuracy: number }>;
  answers_review: Array<{
    question_id: string;
    question_text: string;
    options: string[];
    user_selected_index: number;
    correct_option_index: number;
    is_correct: boolean;
    explanation?: string;
    subject: string;
    topic: string;
  }>;
  team_comparison: Array<{
    rank: number;
    user_name: string;
    user_id: string;
    score: number;
    total: number;
    accuracy: number;
    is_current_user: boolean;
    has_attempted?: boolean;
  }>;
}

export interface LeaderboardUser {
  rank: number;
  user_id: string;
  user_name: string;
  tests_taken: number;
  total_score: number;
  overall_accuracy: number;
  current_streak: number;
  avatar_letter: string;
}

export interface TopicStat {
  subject: string;
  topic: string;
  total_attempted: number;
  wrong_count: number;
  accuracy: number;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('jee_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('jee_auth_token', token);
    } else {
      localStorage.removeItem('jee_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'An error occurred during request execution.');
    }

    return response.json();
  }

  // Auth
  async login(password: string): Promise<AuthUser> {
    const res = await this.request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Admin Dashboard
  async getAdminStats(): Promise<{ total_tests: number; avg_accuracy: number; active_members: number }> {
    return this.request('/admin/stats');
  }

  // Tests
  async getTests(): Promise<TestSummary[]> {
    return this.request('/tests');
  }

  async getTest(id: string): Promise<any> {
    return this.request(`/tests/${id}`);
  }

  async createTest(data: { title: string; description?: string; questions: QuestionDraft[] }): Promise<TestSummary> {
    return this.request('/tests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTest(id: string, data: Partial<TestSummary & { questions: QuestionDraft[] }>): Promise<TestSummary> {
    return this.request(`/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async publishTest(id: string): Promise<TestSummary> {
    return this.request(`/tests/${id}/publish`, {
      method: 'POST'
    });
  }

  async archiveTest(id: string): Promise<TestSummary> {
    return this.request(`/tests/${id}/archive`, {
      method: 'POST'
    });
  }

  // Question Extraction Flow
  async extractQuestions(formDataOrText: FormData | { raw_text: string }): Promise<{ questions: QuestionDraft[]; warning?: string }> {
    if (formDataOrText instanceof FormData) {
      return this.request('/extract', {
        method: 'POST',
        body: formDataOrText
      });
    } else {
      return this.request('/extract', {
        method: 'POST',
        body: JSON.stringify(formDataOrText)
      });
    }
  }

  // Test Taking Flow
  async startAttempt(test_id: string): Promise<AttemptSession> {
    return this.request('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ test_id })
    });
  }

  async submitAnswer(attempt_id: string, question_id: string, selected_index: number): Promise<{
    is_correct: boolean;
    correct_option_index: number;
    explanation?: string;
  }> {
    return this.request('/attempts/answer', {
      method: 'POST',
      body: JSON.stringify({ attempt_id, question_id, selected_index })
    });
  }

  async finishAttempt(attempt_id: string): Promise<ResultsSummary> {
    return this.request('/attempts/finish', {
      method: 'POST',
      body: JSON.stringify({ attempt_id })
    });
  }

  async getResults(attempt_id: string): Promise<ResultsSummary> {
    return this.request(`/attempts/${attempt_id}/results`);
  }

  // Leaderboard & Member Stats
  async getLeaderboard(test_id?: string): Promise<LeaderboardUser[]> {
    const query = test_id ? `?test_id=${test_id}` : '';
    return this.request(`/leaderboard${query}`);
  }

  async getWeakTopics(): Promise<TopicStat[]> {
    return this.request('/members/weak-topics');
  }

  async retakeWeakQuestions(): Promise<TestSummary> {
    return this.request('/members/retake-test', { method: 'POST' });
  }

  async getPastAttempts(): Promise<Array<{
    attempt_id: string;
    test_title: string;
    date: string;
    score: number;
    total: number;
    accuracy: number;
  }>> {
    return this.request('/members/attempts');
  }
}

export const api = new ApiClient();
