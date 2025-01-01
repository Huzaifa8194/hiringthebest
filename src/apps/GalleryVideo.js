  import React, { useState, useEffect } from "react";
  import { Carousel, Card, Col, Row, Button, Form, Modal, Dropdown } from "react-bootstrap";
  import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
  import { db } from "../firebaseConfig"; // Import Firebase Firestore configuration
  import Header from "../layouts/Header";
  import Footer from "../layouts/Footer";

  export default function AnnouncementsPage() {

    // Log latestAnnouncements when it changes

    const [announcements, setAnnouncements] = useState([]);
    const [latestAnnouncements, setLatestAnnouncements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentEditId, setCurrentEditId] = useState(null);
    const [newAnnouncement, setNewAnnouncement] = useState({
      title: "",
      description: "",
      image: "",
      date: "",
    });

    // Fetch announcements from Firestore
    useEffect(() => {
      const fetchAnnouncements = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "announcements"));
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Ensure date is a valid Date object for rendering
            const parsedData = data.map((item) => ({
              ...item,
              date: item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date),
            }));

            // Sort by date (newest first)
            const sortedData = parsedData.sort((a, b) => b.date - a.date);

            setAnnouncements(sortedData);
            setLatestAnnouncements(sortedData.slice(0, 2)); // First two announcements for the carousel

            console.log(sortedData)

          } else {
            setAnnouncements([]);
            setLatestAnnouncements([]);
          }
        } catch (error) {
          console.error("Error fetching announcements:", error);
        }
      };

      fetchAnnouncements();

    }, []);


    useEffect(() => {
      console.log("Latest Announcements in Carousel:", latestAnnouncements);
    }, [latestAnnouncements]);
    
    // Add or Edit announcement in Firestore
    const handleSaveAnnouncement = async () => {
      if (newAnnouncement.title && newAnnouncement.description && newAnnouncement.date) {
        try {
          const announcementWithTimestamp = {
            ...newAnnouncement,
            date: Timestamp.fromDate(new Date(newAnnouncement.date)),
          };

          if (editMode) {
            // Update existing announcement
            const announcementRef = doc(db, "announcements", currentEditId);
            await updateDoc(announcementRef, announcementWithTimestamp);

            // Update UI
            const updatedAnnouncements = announcements.map((item) =>
              item.id === currentEditId
                ? { ...item, ...announcementWithTimestamp, date: new Date(newAnnouncement.date) }
                : item
            );
            setAnnouncements(updatedAnnouncements);
            setLatestAnnouncements(updatedAnnouncements.slice(0, 2));
          } else {
            // Add new announcement
            const docRef = await addDoc(collection(db, "announcements"), announcementWithTimestamp);

            // Update UI
            const addedAnnouncement = {
              id: docRef.id,
              ...announcementWithTimestamp,
              date: new Date(newAnnouncement.date),
            };
            setAnnouncements([addedAnnouncement, ...announcements]);
            setLatestAnnouncements([addedAnnouncement, ...latestAnnouncements.slice(0, 1)]);
          }

          // Clear form and close modal
          setNewAnnouncement({ title: "", description: "", image: "", date: "" });
          setShowModal(false);
          setEditMode(false);
          setCurrentEditId(null);
        } catch (error) {
          console.error("Error saving announcement:", error);
        }
      }
    };

    // Delete announcement from Firestore
    const handleDeleteAnnouncement = async (id) => {
      try {
        await deleteDoc(doc(db, "announcements", id));

        // Update UI
        const updatedAnnouncements = announcements.filter((item) => item.id !== id);
        setAnnouncements(updatedAnnouncements);
        setLatestAnnouncements(updatedAnnouncements.slice(0, 2));
      } catch (error) {
        console.error("Error deleting announcement:", error);
      }
    };

    // Open modal for editing an announcement
    const handleEditAnnouncement = (announcement) => {
      setEditMode(true);
      setCurrentEditId(announcement.id);
      setNewAnnouncement({
        title: announcement.title,
        description: announcement.description,
        image: announcement.image,
        date: announcement.date.toISOString().split("T")[0], // Convert date to "YYYY-MM-DD" format
      });
      setShowModal(true);
    };

    return (
      <React.Fragment>
        <Header />
        <div className="main main-app p-3 p-lg-4 p-xxl-5">
          {/* Carousel for Latest Announcements */}
          <h2 className="mb-3">Recent Announcements</h2>
          {latestAnnouncements.length > 0 ? (
            
            <Carousel slide>
             
              {latestAnnouncements.map((announcement, index) => (
                
                <Carousel.Item key={index}>
                  <div className="video-headline">
                    <img
                      src={announcement.image}
                      alt={announcement.title || "Announcement EROR"}
                    />
                    <div className="video-headline-body p-4">
                      <div>
                        <h1 className="video-title mb-2">{announcement.title}</h1>
                        <p className="opacity-75 mb-3">{announcement.description}</p>
                        <p className="opacity-50 mb-0">
                          <small>{announcement.date.toLocaleDateString()}</small>
                        </p>
                      </div>
                    </div>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <p className="text-center mt-4">No announcements to display.</p>
          )}

          {/* Button to Create Announcements */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <h2 className="mb-0">All Announcements</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Create Announcement
            </Button>
          </div>

          {/* List of All Announcements */}
          {announcements.length > 0 ? (
            announcements.map((announcement, index) => (
              <Card className="card-video my-4 my-xxl-5 position-relative" key={announcement.id}>
                <Dropdown align="end" className="position-absolute top-0 end-0 m-2">
                  <Dropdown.Toggle variant="link" className="p-0">
                    <i className="ri-more-2-fill"></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleEditAnnouncement(announcement)}>
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleDeleteAnnouncement(announcement.id)}>
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Card.Body className="p-3 p-sm-4">
                  <Row className="g-3 g-sm-4">
                    <Col xl="7">
                      <div className="video-player">
                        <img
                          src={announcement.image || "https://via.placeholder.com/800x400"}
                          className="video-player-img"
                          alt={announcement.title}
                        />
                      </div>
                    </Col>
                    <Col xl>
                      <Card.Title>{announcement.title}</Card.Title>
                      <p className="d-flex gap-3 fs-sm text-secondary">
                        <span>{announcement.date.toLocaleDateString()}</span>
                      </p>
                      <p>{announcement.description}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))
          ) : (
            <p className="text-center mt-4">No announcements found.</p>
          )}

          <Footer />
        </div>

        {/* Modal for Creating/Editing Announcements */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Edit Announcement" : "Create Announcement"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter announcement details"
                  value={newAnnouncement.description}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, description: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image URL (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter image URL"
                  value={newAnnouncement.image}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, image: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={newAnnouncement.date}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, date: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAnnouncement}>
              {editMode ? "Save Changes" : "Create"}
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
