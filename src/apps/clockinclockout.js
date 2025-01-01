import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Table,
  Spinner,
} from "react-bootstrap";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

export default function ClockInClockOutPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [displayName, setDisplayName] = useState("User");
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockEntries, setClockEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayTotal, setDayTotal] = useState({ hours: 0, minutes: 0 });
  const [weekTotal, setWeekTotal] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          await fetchUserFullName(user.email);
          await fetchClockEntries(user.email);
        }
        setLoading(false);
      });
    };

    fetchUserData();
  }, []);

  const fetchUserFullName = async (email) => {
    try {
      const usersQuery = query(collection(db, "Users"), where("email", "==", email));
      const querySnapshot = await getDocs(usersQuery);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setDisplayName(userData.fullName || "User");
      }
    } catch (error) {
      console.error("Error fetching user full name:", error);
    }
  };

  const fetchClockEntries = async (email) => {
    try {
      const entriesQuery = query(
        collection(db, "clock_entries"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(entriesQuery);
      const entries = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClockEntries(entries);

      calculateTotals(entries);
    } catch (error) {
      console.error("Error fetching clock entries:", error);
    }
  };

  const calculateTotals = (entries) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday of the current week
    startOfWeek.setHours(0, 0, 0, 0); // Start of the day

    let dailyMinutes = 0;
    let weeklyMinutes = 0;

    entries.forEach((entry) => {
      const clockIn = new Date(entry.clockIn);
      const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
      const duration = clockOut ? (clockOut - clockIn) / 1000 / 60 : 0; // in minutes

      // Calculate daily total
      if (clockIn.toDateString() === today.toDateString()) {
        dailyMinutes += duration;
      }

      // Calculate weekly total
      if (clockIn >= startOfWeek) {
        weeklyMinutes += duration;
      }
    });

    setDayTotal({
      hours: Math.floor(dailyMinutes / 60),
      minutes: (dailyMinutes % 60).toFixed(2),
    });

    setWeekTotal({
      hours: Math.floor(weeklyMinutes / 60),
      minutes: (weeklyMinutes % 60).toFixed(2),
    });
  };

  const handleClockIn = async () => {
    try {
      const now = new Date();
      setIsClockedIn(true);

      await addDoc(collection(db, "clock_entries"), {
        email: currentUser.email,
        clockIn: now.toISOString(),
        clockOut: null,
      });

      await fetchClockEntries(currentUser.email);
    } catch (error) {
      console.error("Error during clock-in:", error);
    }
  };

  const handleClockOut = async () => {
    try {
      const now = new Date();
      setIsClockedIn(false);

      const latestEntry = clockEntries.find((entry) => entry.clockOut === null);
      if (latestEntry) {
        const docRef = doc(db, "clock_entries", latestEntry.id);
        await updateDoc(docRef, {
          clockOut: now.toISOString(),
        });
      }

      await fetchClockEntries(currentUser.email);
    } catch (error) {
      console.error("Error during clock-out:", error);
    }
  };

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4 p-xxl-5">
        <h1 className="text-center mb-4">Clock In and Clock Out</h1>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            <Row className="g-4">
              {/* Left Panel */}
              <Col lg={4}>
                <Card className="shadow-sm rounded-3">
                  <Card.Header className="bg-primary text-white text-center">
                    {new Date().toLocaleDateString()}
                  </Card.Header>
                  <Card.Body className="text-center">
                    <img
                      src={
                        currentUser?.photoURL ||
                        "https://via.placeholder.com/100"
                      }
                      alt="User"
                      className="img-thumbnail rounded-circle mb-3"
                      style={{ width: "100px", height: "100px" }}
                    />
                    <h4>{displayName}</h4>
                    <p className="text-muted">{currentUser?.email}</p>
                  </Card.Body>
                </Card>
                <Card className="mt-3 shadow-sm rounded-3">
                  <Card.Body className="text-center">
                    <h5>Day Total</h5>
                    <p>
                      {dayTotal.hours}h {dayTotal.minutes}m
                    </p>
                    <hr />
                    <h5>Week Total</h5>
                    <p>
                      {weekTotal.hours}h {weekTotal.minutes}m
                    </p>
                  </Card.Body>
                </Card>
              </Col>

              {/* Right Panel */}
              <Col lg={8}>
                <Card className="shadow-sm rounded-3 text-center ">
                  <Card.Body>
                    <h3>Clock In to {displayName}'s Work</h3>
                    <div className="d-flex justify-content-center gap-3 mt-4">
                      <Button
                        variant="success"
                        size="lg"
                        className="px-4 py-3"
                        disabled={isClockedIn}
                        onClick={handleClockIn}
                      >
                        Clock In
                      </Button>
                      <Button
                        variant="warning"
                        size="lg"
                        className="px-4 py-3"
                        disabled={!isClockedIn}
                        onClick={handleClockOut}
                      >
                        Clock Out
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Clock Entries Table */}
            <Row className="mt-5">
              <Col lg={12}>
                <Card className="shadow-sm rounded-3">
                  <Card.Header className="bg-info text-white">
                    Previous Clock Entries
                  </Card.Header>
                  <Card.Body>
                    {clockEntries.length > 0 ? (
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clockEntries.map((entry, index) => {
                            const clockInDate = new Date(entry.clockIn);
                            const clockOutDate = entry.clockOut
                              ? new Date(entry.clockOut)
                              : null;
                            const duration =
                              clockOutDate &&
                              clockInDate &&
                              (clockOutDate - clockInDate) / 1000 / 60;

                            return (
                              <tr key={entry.id}>
                                <td>{index + 1}</td>
                                <td>
                                  {clockInDate.toLocaleString() || "N/A"}
                                </td>
                                <td>
                                  {clockOutDate?.toLocaleString() || "N/A"}
                                </td>
                                <td>
                                  {duration
                                    ? `${Math.floor(duration / 60)}h ${(
                                        duration % 60
                                      ).toFixed(2)}m`
                                    : "N/A"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center">No clock entries found.</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
      <Footer />
    </React.Fragment>
  );
}
