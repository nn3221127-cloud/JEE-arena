/**
 * Centralized Permission Model for JEE Test Arena
 */

export interface UserRolePermissions {
  canAttemptQuiz: boolean;
  canTrackProgress: boolean;
  canManageTests: boolean;
  canViewAdminAnalytics: boolean;
}

export const PERMISSIONS = {
  canAttemptQuiz: (role?: string): boolean => {
    // All valid roles (admin, member) are eligible learners who can attempt quizzes
    return role === 'admin' || role === 'member';
  },

  canTrackProgress: (role?: string): boolean => {
    // All valid roles track personal test attempt progress and history
    return role === 'admin' || role === 'member';
  },

  canManageTests: (role?: string): boolean => {
    // Strictly admin privileges: test creation, activation, deactivation, archiving, paper extraction
    return role === 'admin';
  },

  canViewAdminAnalytics: (role?: string): boolean => {
    // Strictly admin privileges: overall platform statistics
    return role === 'admin';
  }
};
