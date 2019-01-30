import React, { Component } from 'react'
import { Navbar, NavbarBrand } from 'reactstrap'

class AdminNavBar extends Component {
  render () {
    return (
      <Navbar color='faded' light expand='md'>
        <NavbarBrand href='/admin'>TestMyCode Admin Panel</NavbarBrand>
      </Navbar>
    )
  }
}

export default AdminNavBar
