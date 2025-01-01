import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import Firebase auth
import bg1 from "../assets/img/bg1.jpg";

export default function Signin2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true); // Set loading to true

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      console.log("User signed in:", userCredential.user);
      navigate("/dashboard/sales"); // Redirect to dashboard or the appropriate page
    } catch (error) {
      console.error("Error during sign in:", error.message);
      setError(error.message); // Display error message to user
    } finally {
      setLoading(false); // Set loading to false after process completes
    }
  };

  return (
    <div className="page-sign d-block py-0">
      <Row className="g-0">
        <Col md="7" lg="5" xl="4" className="col-wrapper">
          <Card className="card-sign">
            <Card.Header>
              <Link to="/" className="header-logo mb-5">InisghtIT</Link>
              <Card.Title>Sign In</Card.Title>
              <Card.Text>Welcome back! Please sign in to continue.</Card.Text>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSignin}>
                <div className="mb-4">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <Form.Label className="d-flex justify-content-between">
                    Password <Link to="/pages/forgot-password">Forgot password?</Link>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="mb-3 text-danger">{error}</div>}
                <Button 
                  type="submit" 
                  className="btn-sign" 
                  disabled={loading} // Disable button when loading
                >
                  {loading ? "Logging in..." : "Sign In"} {/* Change button text */}
                </Button>
              </Form>
            </Card.Body>
            <Card.Footer>
              Don't have an account? <Link to="/pages/signup2">Create an Account</Link>
            </Card.Footer>
          </Card>
        </Col>
        <Col className="d-none d-lg-block">
          <img src={bg1} className="auth-img" alt="" />
        </Col>
      </Row>
    </div>
  );
}
