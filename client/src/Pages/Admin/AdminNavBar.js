import React, { Component } from "react";
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from "reactstrap";

class AdminNavBar extends Component {
  render() {
    return (
      <Navbar color="faded" light expand="md">
        <NavbarBrand href="/admin">Liceum Tester Admin Panel</NavbarBrand>
        <Nav className="ml-auto" navbar>
          <NavItem>
            <NavLink href="/admin/add-assignments/">Add assignments</NavLink>
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

export default AdminNavBar;
