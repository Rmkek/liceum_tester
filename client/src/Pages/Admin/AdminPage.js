import React, { Component } from "react";
import AdminNavBar from "./AdminNavBar";

class AdminPage extends Component {
  render() {
    return (
      <div>
        <AdminNavBar />
        {this.props.component}
      </div>
    );
  }
}

export default AdminPage;
