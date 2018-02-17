import React, { Component } from "react";
import AdminNavBar from "./AdminNavBar";

class AdminPage extends Component {
  render() {
    return (
      <div>
        <AdminNavBar />
        {this.props.props}
      </div>
    );
  }
}

export default AdminPage;
