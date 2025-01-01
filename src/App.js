import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from './layouts/Main';
import NotFound from "./pages/NotFound";

// Import your routes
import publicRoutes from "./routes/PublicRoutes";
import protectedRoutes from "./routes/ProtectedRoutes";

// Import css and scss
import "./assets/css/remixicon.css";
import "./scss/style.scss";

// Import the AdminRoute component
import AdminRoute from './routes/AdminRoutes';  // Import AdminRoute

// Set skin on load
window.addEventListener("load", function () {
  let skinMode = localStorage.getItem("skin-mode");
  let HTMLTag = document.querySelector("html");

  if (skinMode) {
    HTMLTag.setAttribute("data-skin", skinMode);
  }
});

export default function App() {
  return (
    <React.Fragment>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />}>
            {/* Protected Routes with AdminRoute guard */}
            {protectedRoutes.map((route, index) => {
              return (
                <Route
                  path={route.path}
                  element={<AdminRoute element={route.element} />}
                  key={index}
                />
              );
            })}
          </Route>

          {/* Public Routes */}
          {publicRoutes.map((route, index) => {
            return (
              <Route
                path={route.path}
                element={route.element}
                key={index}
              />
            );
          })}

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </React.Fragment>
  );
}