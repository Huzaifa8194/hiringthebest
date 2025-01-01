import React, { useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig"; // Import Firebase auth and Firestore
import bg1 from "../assets/img/bg1.jpg";

export default function Signup2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Add user details to Firestore
      const user = userCredential.user;
      await setDoc(doc(db, "Users", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        role: "Employee", // Default role
        createdAt: new Date(),
      });

      console.log("User registered successfully:", user);
      navigate("/welcome"); // Redirect to a welcome page or dashboard
    } catch (error) {
      console.error("Error during signup:", error.message);
      setError(error.message); // Display error to the user
    }
  };

  return (
    <div className="page-sign d-block py-0">
      <Row className="g-0">
        <Col md="7" lg="5" xl="4" className="col-wrapper">
          <Card className="card-sign">
            <Card.Header>
              <Link to="/" className="header-logo mb-5">dashbyte</Link>
              <Card.Title>Sign Up</Card.Title>
              <Card.Text>It's free to signup and only takes a minute.</Card.Text>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSignup}>
                <div className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <Form.Label>Full name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="mb-3 text-danger">{error}</div>}
                <div className="mb-4">
                  <small>
                    By clicking <strong>Create Account</strong> below, you agree to our terms of service and privacy statement.
                  </small>
                </div>
                <Button type="submit" variant="primary" className="btn-sign">
                  Create Account
                </Button>
              </Form>

              <div className="divider"><span>or sign up using</span></div>

              <Row className="gx-2">
                <Col>
                  <Button variant="" className="btn-facebook">
                    <i className="ri-facebook-fill"></i> Facebook
                  </Button>
                </Col>
                <Col>
                  <Button variant="" className="btn-google">
                    <i className="ri-google-fill"></i> Google
                  </Button>
                </Col>
              </Row>
            </Card.Body>
            <Card.Footer>
              Already have an account? <Link to="/pages/signin2">Sign In</Link>
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
