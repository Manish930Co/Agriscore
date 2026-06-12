export interface FirebaseUser {
  uid: string;
  email: string;
  role: 'farmer' | 'admin';
}

// In-memory user database initialized with credentials for developer testing
const MOCK_USERS: Record<string, { uid: string; email: string; passwordHash: string; role: 'farmer' | 'admin' }> = {
  'farmer@agriscore.com': {
    uid: 'farmer-user-id-123',
    email: 'farmer@agriscore.com',
    passwordHash: 'password123', // Simplified representation
    role: 'farmer',
  },
  'admin@agriscore.com': {
    uid: 'admin-user-id-456',
    email: 'admin@agriscore.com',
    passwordHash: 'password123',
    role: 'admin',
  },
};

let currentUser: FirebaseUser | null = null;

export const firebaseAuth = {
  login: async (email: string, password: string): Promise<FirebaseUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanedEmail = email.trim().toLowerCase();
        const user = MOCK_USERS[cleanedEmail];
        
        if (user && user.passwordHash === password) {
          currentUser = {
            uid: user.uid,
            email: user.email,
            role: user.role,
          };
          resolve(currentUser);
        } else {
          reject(new Error('Invalid email or password. Try farmer@agriscore.com / password123 or admin@agriscore.com / password123.'));
        }
      }, 800); // Simulate network latency
    });
  },

  register: async (email: string, password: string, role: 'farmer' | 'admin'): Promise<FirebaseUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const cleanedEmail = email.trim().toLowerCase();
        if (MOCK_USERS[cleanedEmail]) {
          reject(new Error('User already exists with this email address.'));
          return;
        }

        if (password.length < 6) {
          reject(new Error('Password must be at least 6 characters long.'));
          return;
        }

        const newUser = {
          uid: `user-id-${Math.random().toString(36).substr(2, 9)}`,
          email: cleanedEmail,
          passwordHash: password,
          role: role,
        };

        MOCK_USERS[cleanedEmail] = newUser;
        currentUser = {
          uid: newUser.uid,
          email: newUser.email,
          role: newUser.role,
        };
        resolve(currentUser);
      }, 1000);
    });
  },

  getCurrentUser: async (): Promise<FirebaseUser | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(currentUser);
      }, 200);
    });
  },

  logout: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentUser = null;
        resolve();
      }, 400);
    });
  },
};
