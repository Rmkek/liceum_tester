import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import Assignments from "./Assignments";
import Admin from "./Admin";
import AddInfo from "./AddInfo";
import Assignment from "./Assignment";
import { BrowserRouter as Router, Route } from "react-router-dom";
import registerServiceWorker from "./registerServiceWorker";

ReactDOM.render(
    <Router>
        <div>
            <Route exact path="/" component={App} />
            <Route exact path="/assignments" component={Assignments} />
            <Route exact path="/admin" component={Admin} />
            <Route exact path="/add-info" component={AddInfo} />
            <Route path="/assignment" component={Assignment} />
        </div>
    </Router>,
    document.getElementById("root")
);

registerServiceWorker();
