import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

let mockUser = { name: 'New Hire', role: 'employee', mustChangePassword: true };
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: mockUser, loading: false, updateUser: () => {}, login: async () => mockUser, logout: async () => {} }),
  AuthProvider: ({ children }) => children,
}));
vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ showToast: () => {} }),
  ToastProvider: ({ children }) => children,
}));

import App from '../App.jsx';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe('forced password change (regression: page used to render blank)', () => {
  it('renders the ChangePassword form for users flagged mustChangePassword', async () => {
    window.history.pushState({}, '', '/change-password');
    const { container } = render(<App />);
    await wait(300);
    expect(container.querySelectorAll('input[type="password"]').length).toBe(3);
  });

  it('associates every password label with its input (accessibility)', async () => {
    window.history.pushState({}, '', '/change-password');
    const { container } = render(<App />);
    await wait(300);
    for (const label of container.querySelectorAll('label')) {
      const target = label.getAttribute('for');
      expect(target && container.querySelector(`#${target}`)).toBeTruthy();
    }
  });
});

describe('login page', () => {
  it('has labels wired to inputs', async () => {
    mockUser = null;
    window.history.pushState({}, '', '/login');
    const { container } = render(<App />);
    await wait(300);
    for (const label of container.querySelectorAll('label')) {
      expect(container.querySelector(`#${label.getAttribute('for')}`)).toBeTruthy();
    }
  });
});
