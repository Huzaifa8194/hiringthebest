import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Col,
  Row,
  Button,
  Form,
  Modal,
  Alert,
  InputGroup,
  Dropdown,
  Tabs,
  Tab,
  Spinner,
} from "react-bootstrap";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";


export default function Tasks() {
  const [startDate, setStartDate] = useState(new Date());
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterUser, setFilterUser] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newPayroll, setNewPayroll] = useState({});
  const [editPayroll, setEditPayroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch payrolls, users, and current user email
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const payrollQuery = await getDocs(collection(db, "payrolls"));
      const payrollData = payrollQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayrolls(payrollData);
      filterPayrollsByMonth(startDate, payrollData);

      const usersQuery = await getDocs(collection(db, "Users"));
      const usersData = usersQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);

      setLoading(false);
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
      }
    });

    fetchData();
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filterPayrollsByMonth = (date, payrollList = payrolls) => {
    const selectedMonth = date.getMonth();
    const selectedYear = date.getFullYear();
    const filteredByMonth = payrollList.filter((payroll) => {
      const payrollDate = new Date(payroll.date);
      return (
        payrollDate.getMonth() === selectedMonth &&
        payrollDate.getFullYear() === selectedYear
      );
    });

    const finalFiltered = filterUser
      ? filteredByMonth.filter((payroll) => payroll.username === filterUser)
      : filteredByMonth;

    setFilteredPayrolls(finalFiltered);
  };

  const handleDateChange = (date) => {
    setStartDate(date);
    filterPayrollsByMonth(date);
  };

  const handleFilterChange = (username) => {
    setFilterUser(username);
    setDropdownVisible(false);
    filterPayrollsByMonth(startDate, payrolls);
  };

  const handleSearchUsers = (searchText) => {
    setDropdownVisible(true);
    if (!searchText) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.fullName.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleUserSelect = (userId) => {
    const selected = users.find((user) => user.id === userId);
    setSelectedUser(selected);
    setNewPayroll({
      ...newPayroll,
      username: selected.fullName,
      email: selected.email,
    });
    setDropdownVisible(false);
  };

  const handleAddPayroll = async () => {
    if (!newPayroll.username || !newPayroll.email || !newPayroll.salary || !newPayroll.date) {
      alert("Please fill in all fields before adding the payroll.");
      return;
    }

    try {
      setOperationLoading(true);
      const createdAt = new Date().toISOString();
      const payrollWithMetadata = {
        ...newPayroll,
        CreatedAt: createdAt,
        CreatedBy: currentUserEmail,
      };

      await addDoc(collection(db, "payrolls"), payrollWithMetadata);

      setNewPayroll({});
      setShowModal(false);
      refreshPayrolls();
    } catch (error) {
      console.error("Error adding payroll:", error);
      alert("Failed to add payroll. Please try again.");
    } finally {
      setOperationLoading(false);
    }
  };

  const refreshPayrolls = async () => {
    setLoading(true);
    const payrollQuery = await getDocs(collection(db, "payrolls"));
    const payrollData = payrollQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPayrolls(payrollData);
    filterPayrollsByMonth(startDate, payrollData);
    setLoading(false);
  };

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4 p-xxl-5 ">
        <h1 className="text-center mb-4">Payroll Management</h1>
        <Alert variant="info" className="text-center shadow-sm">
          Select a month from the calendar to view payrolls or add a new one.
          Use the search dropdown to filter payrolls by username.
        </Alert>

        <Row className="g-4">
          <Col lg={4}>
            <Card className="shadow-sm rounded-3">
              <Card.Header className="bg-primary text-white text-center">
                Filter Payrolls
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Filter by Month</Form.Label>
                  <Form.Control
                    type="month"
                    className="shadow-sm"
                    value={`${startDate.getFullYear()}-${String(
                      startDate.getMonth() + 1
                    ).padStart(2, "0")}`}
                    onChange={(e) => handleDateChange(new Date(e.target.value))}
                  />
                </Form.Group>
                <Form.Group
                  className="mb-3 position-relative"
                  ref={dropdownRef}
                >
                  <Form.Label>Search Username</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type to search"
                      className="shadow-sm"
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      onFocus={() => setDropdownVisible(true)}
                    />
                  </InputGroup>
                  {dropdownVisible && (
                    <div className="dropdown-menu w-100 show">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="dropdown-item"
                            onClick={() => handleFilterChange(user.fullName)}
                          >
                            {user.fullName}
                          </div>
                        ))
                      ) : (
                        <div className="dropdown-item">No results found</div>
                      )}
                    </div>
                  )}
                </Form.Group>
              </Card.Body>
            </Card>
            <Button
              className="w-100 mt-3 shadow-sm"
              variant="success"
              onClick={() => setShowModal(true)}
            >
              Add New Payroll
            </Button>
          </Col>

          {/* Payroll List */}
          <Col lg={8}>
            <Tabs defaultActiveKey="list" className="mb-3 shadow-sm rounded-3">
              <Tab eventKey="list" title="Payroll List">
                <Card className="shadow-sm rounded-3">
                  <Card.Header className="bg-info text-white text-center">
                    Payrolls for {startDate.toLocaleString("default", { month: "long" })}{" "}
                    {startDate.getFullYear()}
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" />
                        <p>Loading payrolls...</p>
                      </div>
                    ) : filteredPayrolls.length > 0 ? (
                      <Row className="g-3">
                        {filteredPayrolls.map((payroll) => (
                          <Col md={6} key={payroll.id}>
                            <Card className="p-3 border-primary shadow-sm rounded-3">
                              <Card.Title>{payroll.username}</Card.Title>
                              <Card.Text>
                                <strong>Email:</strong> {payroll.email}
                              </Card.Text>
                              <Card.Text>
                                <strong>Salary:</strong> ${payroll.salary}
                              </Card.Text>
                              <Card.Text>
                                <strong>Date:</strong> {payroll.date}
                              </Card.Text>
                              <Card.Text>
                                <strong>Created By:</strong> {payroll.CreatedBy}
                              </Card.Text>
                              <Card.Text>
                                <small className="text-muted">
                                  Created At:{" "}
                                  {new Date(payroll.CreatedAt).toLocaleString()}
                                </small>
                              </Card.Text>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <p className="text-center">
                        No payrolls found for this month or user.
                      </p>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Col>
        </Row>

        {/* Add Payroll Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Payroll</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3 position-relative" ref={dropdownRef}>
                <Form.Label>Search and Select User</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Type to search"
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    onFocus={() => setDropdownVisible(true)}
                  />
                </InputGroup>
                {dropdownVisible && (
                  <div className="dropdown-menu w-100 show">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="dropdown-item"
                          onClick={() => handleUserSelect(user.id)}
                        >
                          {user.fullName} ({user.email})
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item">No results found</div>
                    )}
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  value={newPayroll.username || ""}
                  readOnly
                  className="shadow-sm"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newPayroll.email || ""}
                  readOnly
                  className="shadow-sm"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Salary</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter salary amount"
                  value={newPayroll.salary || ""}
                  onChange={(e) =>
                    setNewPayroll({ ...newPayroll, salary: e.target.value })
                  }
                  className="shadow-sm"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Payment Date</Form.Label>
                <Form.Control
                  type="date"
                  value={newPayroll.date || ""}
                  onChange={(e) =>
                    setNewPayroll({ ...newPayroll, date: e.target.value })
                  }
                  className="shadow-sm"
                />
              </Form.Group>

              {operationLoading && (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p>Processing...</p>
                </div>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddPayroll}
              disabled={operationLoading}
            >
              Add Payroll
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
      <Footer />
    </React.Fragment>
  );
}
