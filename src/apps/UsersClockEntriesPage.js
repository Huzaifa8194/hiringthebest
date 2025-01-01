import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";

export default function UsersClockEntriesPage() {
  const [users, setUsers] = useState([]);
  const [clockEntries, setClockEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUsersAndEntries = async () => {
      setLoading(true);
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "Users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);

        // Fetch all clock entries
        const clockEntriesSnapshot = await getDocs(collection(db, "clock_entries"));
        const entriesData = clockEntriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClockEntries(entriesData);
        setFilteredEntries(entriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndEntries();
  }, []);

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

  const handleSearch = (text) => {
    setSearchText(text);
    setDropdownVisible(true);

    if (!text) {
      setFilteredEntries(clockEntries);
      return;
    }

    const filtered = clockEntries.filter((entry) => {
      const user = users.find((user) => user.email === entry.email);
      return user?.fullName.toLowerCase().includes(text.toLowerCase());
    });

    setFilteredEntries(filtered);
  };

  const handleDateFilter = (date) => {
    setSelectedDate(date);
    if (!date) {
      setFilteredEntries(clockEntries);
      return;
    }

    const filtered = clockEntries.filter((entry) => {
      const clockInDate = new Date(entry.clockIn).toDateString();
      return clockInDate === new Date(date).toDateString();
    });

    setFilteredEntries(filtered);
  };

  const calculateTotals = (entries) => {
    let dailyMinutes = 0;
    let weeklyMinutes = 0;

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday of the current week
    startOfWeek.setHours(0, 0, 0, 0); // Start of the day

    entries.forEach((entry) => {
      const clockIn = new Date(entry.clockIn);
      const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
      const duration = clockOut ? (clockOut - clockIn) / 1000 / 60 : 0;

      // Daily total
      if (clockIn.toDateString() === today.toDateString()) {
        dailyMinutes += duration;
      }

      // Weekly total
      if (clockIn >= startOfWeek) {
        weeklyMinutes += duration;
      }
    });

    return {
      dailyHours: Math.floor(dailyMinutes / 60),
      dailyMinutes: (dailyMinutes % 60).toFixed(2),
      weeklyHours: Math.floor(weeklyMinutes / 60),
      weeklyMinutes: (weeklyMinutes % 60).toFixed(2),
    };
  };

  return (
    <React.Fragment>
      <Header />
      <div className="main main-app p-3 p-lg-4 p-xxl-5">
        <h1 className="text-center mb-4">Users and Clock Entries</h1>

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* Search and Filter */}
            <Row className="mb-4">
              <Col lg={6} ref={dropdownRef}>
                <Form.Label>Search by User</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Type to search"
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setDropdownVisible(true)}
                  />
                </InputGroup>
                {dropdownVisible && (
                  <div className="dropdown-menu w-100 show">
                    {users
                      .filter((user) =>
                        user.fullName.toLowerCase().includes(searchText.toLowerCase())
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          className="dropdown-item"
                          onClick={() => {
                            handleSearch(user.fullName);
                            setSearchText(user.fullName);
                            setDropdownVisible(false);
                          }}
                        >
                          {user.fullName}
                        </div>
                      ))}
                  </div>
                )}
              </Col>
              <Col lg={6}>
                <Form.Label>Filter by Date</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateFilter(e.target.value)}
                />
              </Col>
            </Row>

            {/* Clock Entries Table */}
            <Card className="shadow-sm rounded-3">
              <Card.Header className="bg-primary text-white">Clock Entries</Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Day Total</th>
                      <th>Week Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry, index) => {
                      const user = users.find((user) => user.email === entry.email);
                      const clockIn = new Date(entry.clockIn).toLocaleString();
                      const clockOut = entry.clockOut
                        ? new Date(entry.clockOut).toLocaleString()
                        : "N/A";

                      const totals = calculateTotals(
                        clockEntries.filter((e) => e.email === entry.email)
                      );

                      return (
                        <tr key={entry.id}>
                          <td>{index + 1}</td>
                          <td>{user?.fullName || "Unknown User"}</td>
                          <td>{entry.email}</td>
                          <td>{clockIn}</td>
                          <td>{clockOut}</td>
                          <td>
                            {totals.dailyHours}h {totals.dailyMinutes}m
                          </td>
                          <td>
                            {totals.weeklyHours}h {totals.weeklyMinutes}m
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </React.Fragment>
  );
}
