import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Spinner, Container } from "react-bootstrap";

const AdminRoute = ({ element, ...rest }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "Users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.role === "admin");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Container
        fluid
        className="d-flex main-app justify-content-center align-items-center"
        style={{
          minHeight: "100vh",
      
          color: "#4a5568",
        }}
      >
        <div className="text-center">
          <Spinner
            animation="border"
            variant="primary"
            style={{
              width: "4rem",
              height: "4rem",
              borderWidth: "0.4rem",
            }}
          />
          <p className="mt-3 fs-5">Getting Everything Ready!</p>
        </div>
      </Container>
    );
  }

  if (isAdmin) {
    return element;
  }

  return <Navigate to="/pages/signin2" replace />;
};

export default AdminRoute;
