import React, { useEffect, useState } from "react";
import { Card, Col, Row, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import ReactApexChart from "react-apexcharts";

export default function ManageLeaves() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [fullName, setFullName] = useState("");

  // Statistics
  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState(0);

  useEffect(() => {
    const fetchUserAndLeaves = async () => {
      setLoading(true);
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setCurrentUser(user);
            const userDocRef = doc(db, "Users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              setFullName(userDoc.data().fullName || "Unknown User");
              await fetchLeaveRequests(user.email);
            }
          }
        });
      } catch (error) {
        console.error("Error fetching user or leaves:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndLeaves();
  }, []);

  const fetchLeaveRequests = async (email) => {
    setLoading(true);
    try {
      const leavesQuery = query(collection(db, "leave_requests"), where("email", "==", email));
      const querySnapshot = await getDocs(leavesQuery);
      const leaves = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLeaveRequests(leaves);

      // Calculate statistics
      setTotalRequests(leaves.length);
      setPendingRequests(leaves.filter((leave) => leave.status === "Pending").length);
      setApprovedRequests(leaves.filter((leave) => leave.status === "Approved").length);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeaveRequest = async () => {
    if (!startDate || !endDate || !reason) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const newLeaveRequest = {
        email: currentUser.email,
        fullName: fullName,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
        status: "Pending", // Default status
      };

      await addDoc(collection(db, "leave_requests"), newLeaveRequest);
      setLeaveRequests([...leaveRequests, newLeaveRequest]);
      setModalShow(false);
      fetchLeaveRequests(currentUser.email); // Update statistics
    } catch (error) {
      console.error("Error adding leave request:", error);
    } finally {
      setLoading(false);
    }
  };

  // ApexCharts Configurations
  const chartOptions = {
    chart: {
      type: "pie",
      height: 300,
    },
    labels: ["Pending", "Approved", "Declined"],
    colors: ["#FFC107", "#28A745", "#DC3545"],
    legend: {
      position: "bottom",
    },
  };

  const chartSeries = [pendingRequests, approvedRequests, totalRequests - (pendingRequests + approvedRequests)];

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="main-title text-primary fw-bold mb-0">
            Manage Your Leaves <span role="img" aria-label="smile">😊</span>
          </h4>
          <Button variant="success" className="fw-medium shadow-sm" onClick={() => setModalShow(true)}>
            Request Leave
          </Button>
        </div>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-secondary">Fetching your leave data...</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <Row className="g-3 mb-4">
              <Col md="4">
                <Card className="shadow">
                  <Card.Body>
                    <Card.Title>Total Requests</Card.Title>
                    <h2 className="text-primary">{totalRequests}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md="4">
                <Card className="shadow">
                  <Card.Body>
                    <Card.Title>Pending Requests</Card.Title>
                    <h2 className="text-warning">{pendingRequests}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md="4">
                <Card className="shadow">
                  <Card.Body>
                    <Card.Title>Approved Requests</Card.Title>
                    <h2 className="text-success">{approvedRequests}</h2>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Leave Requests Table */}
            <Row className="g-3">
              <Col md="6">
                <Card className="shadow">
                  <Card.Body>
                    <Card.Title>Leave Requests Summary</Card.Title>
                    <ReactApexChart options={chartOptions} series={chartSeries} type="pie" height={300} />
                  </Card.Body>
                </Card>
              </Col>
              <Col md="6">
                <Card className="shadow">
                  <Card.Body>
                    <Card.Title>Leave History</Card.Title>
                    {leaveRequests.length > 0 ? (
                      <Table responsive bordered hover>
                        <thead>
                          <tr>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveRequests.map((leave, index) => (
                            <tr key={index}>
                              <td>{leave.startDate}</td>
                              <td>{leave.endDate}</td>
                              <td>{leave.reason}</td>
                              <td>
                                <span
                                  className={`badge bg-${
                                    leave.status === "Approved"
                                      ? "success"
                                      : leave.status === "Declined"
                                      ? "danger"
                                      : "warning"
                                  }`}
                                >
                                  {leave.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p>No leave requests found.</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        <Footer />

        {/* Add Leave Modal */}
        <Modal show={modalShow} onHide={() => setModalShow(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Request Leave</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for leave"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setModalShow(false)}>
              Close
            </Button>
            <Button variant="success" onClick={handleAddLeaveRequest}>
              Submit Request
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </React.Fragment>
  );
}
