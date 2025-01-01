import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Button } from "react-bootstrap";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Doughnut, Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setCurrentUser(user);

            // Fetch current user information
            const userQuery = query(
              collection(db, "Users"),
              where("email", "==", user.email)
            );
            const userSnapshot = await getDocs(userQuery);
            const userInfo = userSnapshot.docs[0]?.data() || null;
            setUserData(userInfo);

            // Fetch leave requests data
            const leaveRequestsQuery = query(collection(db, "leave_requests"), where("email", "==", user.email));
            const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
            const leaveRequests = leaveRequestsSnapshot.docs.map((doc) => doc.data());

            setTotalRequests(leaveRequests.length);
            setPendingRequests(leaveRequests.filter((req) => req.status === "Pending").length);
            setApprovedRequests(leaveRequests.filter((req) => req.status === "Approved").length);

            // Fetch clock entries to calculate hours worked
            const clockEntriesQuery = query(collection(db, "clock_entries"), where("email", "==", user.email));
            const clockEntriesSnapshot = await getDocs(clockEntriesQuery);
            const clockEntries = clockEntriesSnapshot.docs.map((doc) => doc.data());

            const now = new Date();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            let totalMinutes = 0;

            clockEntries.forEach((entry) => {
              const clockIn = new Date(entry.clockIn);
              const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;

              if (clockIn >= startOfWeek && clockOut) {
                totalMinutes += (clockOut - clockIn) / 1000 / 60; // Convert ms to minutes
              }
            });

            setWeeklyHours((totalMinutes / 60).toFixed(1)); // Convert minutes to hours
          }
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const doughnutData = {
    labels: ["Pending Requests", "Approved Requests"],
    datasets: [
      {
        data: [pendingRequests, approvedRequests],
        backgroundColor: ["#f8b425", "#28a745"],
        hoverBackgroundColor: ["#ffc107", "#32cd32"],
      },
    ],
  };

  const hoursWorkedData = {
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    datasets: [
      {
        label: "Hours Worked",
        data: [0, 0, 0, 0, weeklyHours, 0, 0], // Real weekly hours for Friday, rest is zero for this demo
        backgroundColor: "rgba(80, 111, 217, 0.2)",
        borderColor: "#506fd9",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const hoursWorkedOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4">
        <h4 className="fw-bold mb-4 text-center">Welcome to Your Dashboard</h4>

            {/* User Info Cards */}
            <Row className="g-4 ">
          <Col lg={4}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <i className="ri-user-line fs-48 text-primary mb-3"></i>
                <h5 className="fw-bold">Full Name</h5>
                <p>{userData?.fullName || "Loading"}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <i className="ri-mail-line fs-48 text-primary mb-3"></i>
                <h5 className="fw-bold">Email</h5>
                <p>{userData?.email || "Loading"}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm text-center">
              <Card.Body>
                <i className="ri-shield-user-line fs-48 text-primary mb-3"></i>
                <h5 className="fw-bold">User Type</h5>
                <p>{userData?.role || "Loading"}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h4 className="fw-bold mt-5 mb-4 text-center">Navigate</h4>

        {/* Navigation Cards */}
        <Row className="g-4 ">
          {[
            { name: "User Profile", icon: "ri-user-line", link: "/profile" },
            { name: "Announcements", icon: "ri-notification-line", link: "/announcements" },
            { name: "Payrolls", icon: "ri-money-dollar-circle-line", link: "/payrolls" },
            { name: "Clock In", icon: "ri-time-line", link: "/clock-in" },
            { name: "Calendar", icon: "ri-calendar-line", link: "/calendar" },
            { name: "Manage Leaves", icon: "ri-leaf-line", link: "/manage-leaves" },
            { name: "Paycheck Calculator", icon: "ri-calculator-line", link: "/paycheck-calculator" },
            { name: "Documents", icon: "ri-file-line", link: "/documents" },
            { name: "Yearly Document", icon: "ri-booklet-line", link: "/yearly-document" },
            { name: "Invoice", icon: "ri-file-text-line", link: "/invoice" },
          ].map((item, index) => (
            <Col md={4} lg={3} key={index}>
              <Card className="shadow-sm text-center card-hover">
                <Card.Body>
                  <i className={`${item.icon} fs-48 text-primary mb-3`}></i>
                  <Card.Title className="fw-bold">{item.name}</Card.Title>
                  <Link to={item.link} className="stretched-link">
                    <Button variant="link" className="text-decoration-none">Go</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

    

        {/* Charts */}
        <Row className="g-4 mt-5">
          <Col lg={6}>
            <Card className="shadow-sm">
              <Card.Header className="text-center bg-primary text-white">
                Leave Request Status
              </Card.Header>
              <Card.Body>
                <Doughnut data={doughnutData} />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="shadow-sm">
              <Card.Header className="text-center bg-primary text-white">
                Hours Worked This Week
              </Card.Header>
              <Card.Body>
                <Line data={hoursWorkedData} options={hoursWorkedOptions} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
      <Footer />
    </React.Fragment>
  );
}
