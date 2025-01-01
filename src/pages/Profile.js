import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import { db, auth } from "../firebaseConfig";
import Footer from "../layouts/Footer";

import Header from "../layouts/Header";
export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    emergencyInfo: "",
    otherInfo: "",
  });
  const [error, setError] = useState("");

  // Monitor auth state and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch user data from Firestore
        try {
          const userDocRef = doc(db, "Users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setFormData({
              username: data.username || "",
              email: data.email || "",
              emergencyInfo: data.emergencyInfo || "",
              otherInfo: data.otherInfo || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validate the form data
  const validateForm = () => {
    if (!formData.email.trim()) return "Email is required.";
    if (!formData.username.trim()) return "Username is required.";
    return null;
  };

  // Save updated data to Firestore
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError("No user is logged in.");
      return;
    }

    try {
      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        username: formData.username,
        email: formData.email,
        emergencyInfo: formData.emergencyInfo,
        otherInfo: formData.otherInfo,
      });
      setUserData(formData); // Update local state
      setEditMode(false);
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to update user data. Please try again.");
    }
  };

  if (!user) {
    return <p>Loading user information...</p>;
  }

  return (
    <React.Fragment>
         <Header />
    
      <div className="main main-app p-4 p-lg-5">
        <Row className="g-5">
          {/* Profile Overview */}
          <Col xl={4}>
            <Card className="shadow-sm rounded-3">
              <Card.Body className="text-center">
                <img
                  src="https://via.placeholder.com/150"
                  alt="User Avatar"
                  className="img-fluid rounded-circle mb-3"
                  style={{ width: "120px", height: "120px" }}
                />
                <h5 className="fw-bold">{userData?.username || "User"}</h5>
                <p className="text-muted">{userData?.email || "No email provided"}</p>
                <Button variant="primary" className="mt-3 px-4">
                  Upload Picture
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Personal Information - Cards Layout */}
          <Col xl={8}>
            <Card className="shadow-sm rounded-3">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <span>Personal Information</span>
                {!editMode && (
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                )}
              </Card.Header>
              <Card.Body>
                {editMode ? (
                  <Form>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Username</Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Emergency Info</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="emergencyInfo"
                            value={formData.emergencyInfo}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Other Info</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="otherInfo"
                            value={formData.otherInfo}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="mt-3">
                      <Button variant="success" onClick={handleSave} className="me-2">
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <Row className="g-3">
                    <Col md={6}>
                      <Card className="shadow-sm border-0">
                        <Card.Body>
                          <h6 className="fw-bold">Email</h6>
                          <p className="text-muted">{userData?.email || "Not provided"}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="shadow-sm border-0">
                        <Card.Body>
                          <h6 className="fw-bold">Username</h6>
                          <p className="text-muted">{userData?.username || "Not provided"}</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="shadow-sm border-0">
                        <Card.Body>
                          <h6 className="fw-bold">Emergency Info</h6>
                          <p className="text-muted">
                            {userData?.emergencyInfo || "No emergency info provided"}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="shadow-sm border-0">
                        <Card.Body>
                          <h6 className="fw-bold">Other Info</h6>
                          <p className="text-muted">
                            {userData?.otherInfo || "No additional info provided"}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                )}
                {error && <p className="text-danger mt-3">{error}</p>}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Informational Cards */}
        <Row className="g-4 mt-5">
          <Col md={4}>
            <Card className="shadow-sm rounded-3">
              <Card.Body>
                <h6 className="fw-bold">Security Tip</h6>
                <p className="text-muted mb-0">
                  Never share your password with anyone. Always use a secure and unique password.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm rounded-3">
              <Card.Body>
                <h6 className="fw-bold">Profile Visibility</h6>
                <p className="text-muted mb-0">
                  Ensure your profile information is accurate and up-to-date for better communication.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm rounded-3">
              <Card.Body>
                <h6 className="fw-bold">Contact Support</h6>
                <p className="text-muted mb-0">
                  Need help? Contact our support team at support@example.com.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Footer />
      </div>
    </React.Fragment>
  );
}
