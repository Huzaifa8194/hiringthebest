import React, { useState, useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Alert,
  Form,
  Spinner,
} from "react-bootstrap";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

export default function MyPayrollsPage() {
  const [startDate, setStartDate] = useState(new Date());
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPayrolls = async () => {
      setLoading(true);
      try {
        const payrollQuery = await getDocs(collection(db, "payrolls"));
        const payrollData = payrollQuery.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPayrolls(payrollData);
        return payrollData;
      } catch (error) {
        console.error("Error fetching payrolls:", error);
        return [];
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUserEmail(user.email);
          const fetchedPayrolls = await fetchPayrolls();
          filterPayrollsByMonth(startDate, fetchedPayrolls);
        }
      });
    };

    fetchData();
  }, [startDate]);

  const filterPayrollsByMonth = (date, payrollList) => {
    const selectedMonth = date.getMonth();
    const selectedYear = date.getFullYear();

    const filteredByMonth = payrollList.filter((payroll) => {
      const payrollDate = new Date(payroll.date);
      return (
        payroll.email === currentUserEmail &&
        payrollDate.getMonth() === selectedMonth &&
        payrollDate.getFullYear() === selectedYear
      );
    });

    setFilteredPayrolls(filteredByMonth);
  };

  const handleDateChange = (date) => {
    setStartDate(date);
    filterPayrollsByMonth(date, payrolls);
  };

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4 p-xxl-5">
        <h1 className="text-center mb-4">My Payrolls</h1>
        <Alert variant="info" className="text-center shadow-sm">
          Use the filter to view payrolls for a specific month.
        </Alert>

        {/* Filter Section */}
        <Row className="g-4 mb-4">
          <Col lg={12}>
            <Card className="shadow-sm rounded-3">
              <Card.Header className="bg-primary text-white text-center">
                Filter Payrolls by Month
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
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Payrolls Section */}
        <Row className="g-4 mt-3">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p>Loading payrolls...</p>
            </div>
          ) : filteredPayrolls.length > 0 ? (
            filteredPayrolls.map((payroll) => (
              <Col md={6} key={payroll.id}>
                <Card
                  className="p-3 border-primary shadow-sm rounded-3 animate__animated animate__fadeInUp payroll-card"
                  style={{
                    animationDelay: `${0.1 * (payroll.id % 5)}s`,
                    transition: "transform 0.3s",
                  }}
                >
                  <Card.Body>
                    <h5 className="text-center fw-bold mb-3">
                      {payroll.username}
                    </h5>
                    <Row>
                      <Col sm={6}>
                        <Card
                          className="inner-card shadow-sm text-center py-3 hover-card"
                          style={{ border: "none", transition: "transform 0.2s" }}
                        >
                          <h6>Email</h6>
                          <p>{payroll.email}</p>
                        </Card>
                      </Col>
                      <Col sm={6}>
                        <Card
                          className="inner-card shadow-sm text-center py-3 hover-card"
                          style={{ border: "none", transition: "transform 0.2s" }}
                        >
                          <h6>Salary</h6>
                          <p>${payroll.salary}</p>
                        </Card>
                      </Col>
                    </Row>
                    <Row>
                      <Col sm={6}>
                        <Card
                          className="inner-card shadow-sm text-center py-3 hover-card"
                          style={{ border: "none", transition: "transform 0.2s" }}
                        >
                          <h6>Date</h6>
                          <p>{payroll.date}</p>
                        </Card>
                      </Col>
                      <Col sm={6}>
                        <Card
                          className="inner-card shadow-sm text-center py-3 hover-card"
                          style={{ border: "none", transition: "transform 0.2s" }}
                        >
                          <h6>Created At</h6>
                          <p>
                            {new Date(payroll.CreatedAt).toLocaleString()}
                          </p>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <p className="text-center">No payrolls found for this month.</p>
          )}
        </Row>

        {/* Additional Information */}
        <Row className="g-4 mt-5">
          <Col md={4}>
            <Card className="shadow-sm rounded-3 hover-card">
              <Card.Body className="text-center">
                <h6 className="fw-bold">Contact Support</h6>
                <p className="text-muted mb-0">
                 Need Help? You can reach out to us at{" "}
                  <a href="mailto:support@example.com">support@example.com</a>.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm rounded-3 hover-card">
              <Card.Body className="text-center">
                <h6 className="fw-bold">Payroll Tips</h6>
                <p className="text-muted mb-0">
                  Ensure your payroll information is always accurate and up-to-date.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm rounded-3 hover-card">
              <Card.Body className="text-center">
                <h6 className="fw-bold">Fun Fact</h6>
                <p className="text-muted mb-0">
                  Payrolls are processed faster during the last quarter of the year!
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
      <Footer />
      {/* Styles */}
      <style>{`
        .hover-card:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
        }
        .payroll-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </React.Fragment>
  );
}
