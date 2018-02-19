import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import registerServiceWorker from "./registerServiceWorker";

import App from "./App/App";
import Assignments from "./Assignments/Assignments";
import Admin from "./Admin/Admin";
import AddAssignments from "./Admin/AddAssignments/AddAssignments";
import AddInfo from "./AddInfo/AddInfo";
import AdminPage from "./Admin/AdminPage";
import Assignment from "./Assignments/Assignment/Assignment";
import "./bootstrap.css";

ReactDOM.render(
  <Router>
    <div>
      <Route exact path="/" component={App} />
      <Route exact path="/assignments" component={Assignments} />
      <Route exact path="/admin" render={() => <AdminPage props={<Admin />} />} />
      <Route exact path="/admin/add-assignments" render={() => <AdminPage props={<AddAssignments />} />} />
      <Route exact path="/add-info" component={AddInfo} />
      <Route path="/assignment" component={Assignment} />
    </div>
  </Router>,
  document.getElementById("root")
);

registerServiceWorker();
