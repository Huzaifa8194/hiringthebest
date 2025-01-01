import React, { useEffect, useState } from "react";
import { Card, Col, Row, Button, Form, Spinner, Table, InputGroup, Modal } from "react-bootstrap";
import { db } from "../firebaseConfig";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

export default function ManageAllLeaves() {
  const [allLeaveRequests, setAllLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [detailsModalShow, setDetailsModalShow] = useState(false);

  useEffect(() => {
    const fetchAllLeaveRequests = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "leave_requests"));
        const leaves = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllLeaveRequests(leaves);
        setFilteredRequests(leaves);

        // Extract unique user names for the search dropdown
        const uniqueUsers = [...new Set(leaves.map((leave) => leave.fullName))];
        setUserOptions(uniqueUsers);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllLeaveRequests();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setLoading(true);
    try {
      const leaveDocRef = doc(db, "leave_requests", id);
      await updateDoc(leaveDocRef, { status: newStatus });

      // Update the local state
      const updatedRequests = allLeaveRequests.map((leave) =>
        leave.id === id ? { ...leave, status: newStatus } : leave
      );
      setAllLeaveRequests(updatedRequests);
      setFilteredRequests(updatedRequests);
      setDetailsModalShow(false);
    } catch (error) {
      console.error("Error updating leave status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = allLeaveRequests;

    if (searchDate) {
      filtered = filtered.filter(
        (leave) =>
          new Date(leave.startDate).toISOString().slice(0, 10) <= searchDate &&
          new Date(leave.endDate).toISOString().slice(0, 10) >= searchDate
      );
    }

    if (searchUser) {
      filtered = filtered.filter((leave) =>
        leave.fullName.toLowerCase().includes(searchUser.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const clearFilters = () => {
    setSearchDate("");
    setSearchUser("");
    setFilteredRequests(allLeaveRequests);
  };

  const handleRowClick = (leave) => {
    setSelectedLeave(leave);
    setDetailsModalShow(true);
  };

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="main-title mb-0">Manage All Leaves</h4>
        </div>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <Row className="g-3 mb-4">
              <Col md="6" lg="4">
                <Form.Group>
                  <Form.Label>Search by Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md="6" lg="4">
                <Form.Group>
                  <Form.Label>Search by Username</Form.Label>
                  <InputGroup>
                    <Form.Control
                      list="userOptions"
                      placeholder="Type to search"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                    />
                    <datalist id="userOptions">
                      {userOptions.map((user, index) => (
                        <option key={index} value={user} />
                      ))}
                    </datalist>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md="6" lg="4" className="d-flex align-items-end">
                <div>
                  <Button variant="primary" className="me-2" onClick={handleSearch}>
                    Search
                  </Button>
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </Col>
            </Row>

            {/* Leave Requests Table */}
            <Row className="g-3">
              <Col md="12">
                <Card className="card-one">
                  <Card.Header>
                    <Card.Title as="h6">All Leave Requests</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {filteredRequests.length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((leave, index) => (
                            <tr key={index} onClick={() => handleRowClick(leave)} style={{ cursor: "pointer" }}>
                              <td>{leave.fullName}</td>
                              <td>{leave.email}</td>
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

        {/* Leave Details Modal */}
        {selectedLeave && (
          <Modal show={detailsModalShow} onHide={() => setDetailsModalShow(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Leave Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                <strong>Username:</strong> {selectedLeave.fullName}
              </p>
              <p>
                <strong>Email:</strong> {selectedLeave.email}
              </p>
              <p>
                <strong>Start Date:</strong> {selectedLeave.startDate}
              </p>
              <p>
                <strong>End Date:</strong> {selectedLeave.endDate}
              </p>
              <p>
                <strong>Reason:</strong> {selectedLeave.reason}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`badge bg-${
                    selectedLeave.status === "Approved"
                      ? "success"
                      : selectedLeave.status === "Declined"
                      ? "danger"
                      : "warning"
                  }`}
                >
                  {selectedLeave.status}
                </span>
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="success"
                onClick={() => handleStatusChange(selectedLeave.id, "Approved")}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => handleStatusChange(selectedLeave.id, "Declined")}
              >
                Decline
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </React.Fragment>
  );
}
