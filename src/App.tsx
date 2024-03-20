import React, { useState } from 'react';
import Router from 'components/Router';
import { app } from "firebaseApp";
import { getAuth } from "firebase/auth";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  
  const auth = getAuth(app);
  console.log(auth, "auth");

  const [ isAuthenticated, setIsAuthenticated ] = useState<boolean>(!!auth?.currentUser);
  console.log("테스트 중");

  return (
    <>
      <Router isAuthenticated={isAuthenticated}/>
      <ToastContainer />
    </>
  );
}

export default App;
