import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../layouts/Header";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import ReactDatePicker from "react-datepicker";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import moment from "moment";

export default function AppCalendar() {
  const [startDate, setStartDate] = useState(new Date());
  const [isSidebarShow, setSidebarShow] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [eventDetailModalShow, setEventDetailModalShow] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState(""); // Added description state
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserType, setCurrentUserType] = useState("");

  const handleModalClose = () => setModalShow(false);
  const handleModalShow = () => setModalShow(true);

  const handleEventDetailModalClose = () => setEventDetailModalShow(false);

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      setLoading(true); // Show loader
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setCurrentUser(user);
            const userDocRef = doc(db, "Users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const userRole = userData.type || "Employee";
              setCurrentUserType(userRole);

              await fetchEvents(user.email, userRole);
            }
          }
        });
      } catch (error) {
        console.error("Error fetching user or events:", error);
      } finally {
        setLoading(false); // Hide loader
      }
    };

    fetchUserAndEvents();
  }, []);

  const fetchEvents = async (email, userRole) => {
    setLoading(true); // Show loader
    try {
      const collections = [
        "calendar_events",
        "birthday_events",
        "holiday_events",
        "discovered_events",
        "meetup_events",
        "other_events",
      ];

      let allEvents = [];
      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const collectionEvents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })).filter((event) => {
          if (event.createdByUserRole === "admin") {
            return true;
          }
          return event.createdByUserRole === "Employee" && event.email === email;
        });

        allEvents = [...allEvents, ...collectionEvents];
      }
      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false); // Hide loader
    }
  };

  useEffect(() => {
    const filterEvents = () => {
      const selectedDate = moment(startDate).startOf("day");
      const filtered = events.filter((event) =>
        moment(event.start).isSame(selectedDate, "day")
      );
      setFilteredEvents(filtered);
    };
    filterEvents();
  }, [startDate, events]);

  const addNewEvent = async () => {
    setLoading(true); // Show loader
    try {
      if (!eventTitle || !eventStartDate || !eventEndDate || !eventDescription) {
        alert("Please fill in all event details.");
        return;
      }

      const newEvent = {
        title: eventTitle,
        start: moment(eventStartDate).toISOString(),
        end: moment(eventEndDate).toISOString(),
        description: eventDescription, // Include description
        createdByUserRole: currentUserType,
        email: currentUser.email,
      };

      await addDoc(collection(db, "calendar_events"), newEvent);
      setEvents([...events, newEvent]);
      handleModalClose();
    } catch (error) {
      console.error("Error adding event:", error);
    } finally {
      setLoading(false); // Hide loader
    }
  };

  const handleEventClick = (clickInfo) => {
    const clickedEvent = clickInfo.event;
    setSelectedEvent({
      title: clickedEvent.title,
      start: clickedEvent.start,
      end: clickedEvent.end,
      description: clickedEvent.extendedProps.description,
      createdByUserRole: clickedEvent.extendedProps.createdByUserRole,
    });
    setEventDetailModalShow(true);
  };

  return (
    <React.Fragment>
      <Header />
      <div className={"main main-calendar" + (isSidebarShow ? " show" : "")}>
        <div className="calendar-sidebar">
          <PerfectScrollbar className="sidebar-body">
            <div className="d-grid mb-3">
              <Button variant="primary" onClick={handleModalShow}>
                Create New Event
              </Button>
            </div>

            <ReactDatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              inline
            />

            <div className="mb-5"></div>

            <h5 className="section-title section-title-sm mb-4">Events Summary</h5>
            <ul className="event-group mb-5">
              {filteredEvents.map((event) => (
                <li className="event-item" key={event.id}>
                  <div className="event-body">
                    <h6>
                      <Link to="">{event.title}</Link>
                    </h6>
                    <p>
                      {moment(event.start).format("hh:mm A")} -{" "}
                      {moment(event.end).format("hh:mm A")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </PerfectScrollbar>
        </div>

        <div className="calendar-body">
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p>Loading events...</p>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "custom1 prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              eventClick={handleEventClick}
              customButtons={{
                custom1: {
                  icon: "chevron-left",
                  click: function () {
                    setSidebarShow(!isSidebarShow);
                  },
                },
              }}
            />
          )}
        </div>

        {/* Add Event Modal */}
        <Modal show={modalShow} onHide={handleModalClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Create New Event</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Event Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter event description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </Form.Group>
            <Row className="g-3 mt-3">
              <Col>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                />
              </Col>
              <Col>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              Close
            </Button>
            <Button variant="primary" onClick={addNewEvent}>
              Save Event
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Event Details Modal */}
        <Modal show={eventDetailModalShow} onHide={handleEventDetailModalClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Event Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEvent && (
              <>
                <h5>{selectedEvent.title}</h5>
                <p>
                  <strong>Start:</strong> {moment(selectedEvent.start).format("MMMM Do YYYY, h:mm A")}
                </p>
                <p>
                  <strong>End:</strong> {moment(selectedEvent.end).format("MMMM Do YYYY, h:mm A")}
                </p>
                <p>
                  <strong>Description:</strong> {selectedEvent.description || "No description provided"}
                </p>
                <p>
                  <strong>Created By:</strong> {selectedEvent.createdByUserRole}
                </p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleEventDetailModalClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </React.Fragment>
  );
}
