import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import authService from '../../services/auth.service';
// import useAuthStore from '../../store/auth.store'; // loginAction was unused as per previous lint, and store is updated by authService
import styles from './LoginPage.module.css'; // Import CSS Module

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // const loginAction = useAuthStore((state) => state.login); // Unused

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    const result = await authService.login({ email, password });

    setLoading(false);
    if (result.success) {
      // authService.login updates the store directly via useAuthStore.getState().login(...)
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginPaper}>
        <h1 className={styles.loginTitle}>SMS Login</h1>
        <Form onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert variant="danger" className={styles.errorMessage}>
              {error}
            </Alert>
          )}
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </Form.Group>

          {/* TODO: Add remember me if needed */}
          {/* <Form.Group className="mb-3" controlId="formBasicCheckbox">
            <Form.Check type="checkbox" label="Remember me" />
          </Form.Group> */}

          <Button
            variant="primary"
            type="submit"
            className={`w-100 ${styles.submitButton}`}
            disabled={loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" role="status" aria-hidden="true">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* TODO: Add links for Forgot Password or Register if applicable */}
          {/* <Row className="mt-3">
            <Col xs>
              <a href="#forgot-password">Forgot password?</a>
            </Col>
            <Col xs className="text-end">
              <a href="#register">Don't have an account? Sign Up</a>
            </Col>
          </Row> */}
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
