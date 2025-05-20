import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3002';

// Circuit breaker implementation (simplified)
class CircuitBreaker {
  constructor() {
    this.states = {};
    this.failureThreshold = 5;
    this.cooldownPeriod = 30000; // 30 seconds
    this.requestTimeout = 1000; // 1 second
  }

  async exec(serviceKey, requestFn) {
    if (this.isOpen(serviceKey)) {
      throw new Error(`Circuit for ${serviceKey} is OPEN`);
    }

    try {
      const response = await Promise.race([
        requestFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.requestTimeout)
        )
      ]);
      
      this.onSuccess(serviceKey);
      return response;
    } catch (error) {
      this.onFailure(serviceKey);
      throw error;
    }
  }

  onSuccess(serviceKey) {
    this.states[serviceKey] = { 
      failures: 0, 
      status: 'CLOSED',
      lastFailure: null 
    };
  }

  onFailure(serviceKey) {
    const state = this.states[serviceKey] || { 
      failures: 0, 
      status: 'CLOSED', 
      lastFailure: null 
    };
    
    state.failures += 1;
    state.lastFailure = Date.now();
    
    if (state.failures >= this.failureThreshold) {
      state.status = 'OPEN';
    }
    
    this.states[serviceKey] = state;
  }

  isOpen(serviceKey) {
    const state = this.states[serviceKey];
    if (!state) return false;
    
    if (state.status === 'OPEN') {
      const timeElapsed = Date.now() - state.lastFailure;
      if (timeElapsed > this.cooldownPeriod) {
        // Move to half-open state and allow request
        state.status = 'HALF-OPEN';
        return false;
      }
      return true;
    }
    return false;
  }
}

const circuitBreaker = new CircuitBreaker();

export async function verifyUser(userId) {
  try {
    const response = await circuitBreaker.exec('user-service', () => 
      axios.get(`${USER_SERVICE_URL}/api/users/${userId}/verify`)
    );
    return response.data;
  } catch (error) {
    console.error('Error verifying user:', error.message);
    throw new Error(`Failed to verify user: ${error.message}`);
  }
}

export async function getBookDetails(bookId) {
  try {
    const response = await circuitBreaker.exec('book-service', () => 
      axios.get(`${BOOK_SERVICE_URL}/api/books/${bookId}`)
    );
    return response.data;
  } catch (error) {
    console.error('Error getting book details:', error.message);
    throw new Error(`Failed to get book details: ${error.message}`);
  }
}

export async function updateBookAvailability(bookId, increment) {
  try {
    const response = await circuitBreaker.exec('book-service', () => 
      axios.patch(`${BOOK_SERVICE_URL}/api/books/${bookId}/availability`, { increment })
    );
    return response.data;
  } catch (error) {
    console.error('Error updating book availability:', error.message);
    throw new Error(`Failed to update book availability: ${error.message}`);
  }
}